const { v4: uuidv4 } = require('uuid');
const { ScanCommand, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamo');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const SERVICE_REQUESTS_TABLE = process.env.DYNAMODB_SERVICE_REQUESTS_TABLE;
const BUCKET = process.env.S3_BUCKET;
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const s3 = new S3Client({ region });

const VALID_STATUSES = ['pending', 'reviewed', 'in-progress', 'completed', 'rejected', 'on-hold'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

/**
 * Sign an S3 image URL if imageKey exists
 */
const getImageUrl = async (imageKey) => {
    if (!imageKey || !BUCKET) return null;
    try {
        const command = new GetObjectCommand({ Bucket: BUCKET, Key: imageKey });
        return await getSignedUrl(s3, command, { expiresIn: 900 });
    } catch (err) {
        console.error('Failed to sign image URL', err);
        return null;
    }
};

/**
 * Format a request for API response
 */
const formatRequest = async (item) => {
    const imageUrl = await getImageUrl(item.imageKey);
    return {
        ...item,
        imageUrl,
    };
};

// @desc    Create a service request
// @route   POST /api/service-requests
// @access  Private
const createRequest = async (req, res) => {
    try {
        const { name, email, service, message, priority, imageKey } = req.body;

        if (!name || !email || !service || !message) {
            return res.status(400).json({ message: 'Please provide name, email, service, and message' });
        }

        const validPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'medium';
        const now = new Date().toISOString();
        const requestId = uuidv4();

        const item = {
            requestId,
            userId: req.user.id,
            name,
            email,
            service,
            message,
            priority: validPriority,
            status: 'pending',
            statusHistory: [
                { status: 'pending', timestamp: now, changedBy: 'system' }
            ],
            adminNotes: '',
            adminResponse: '',
            createdAt: now,
            updatedAt: now,
        };

        if (imageKey) {
            item.imageKey = imageKey;
        }

        await docClient.send(
            new PutCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Item: item,
            })
        );

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's service requests
// @route   GET /api/service-requests/mine
// @access  Private
const getUserRequests = async (req, res) => {
    try {
        const result = await docClient.send(
            new QueryCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                IndexName: 'userId-index',
                KeyConditionExpression: 'userId = :uid',
                ExpressionAttributeValues: { ':uid': req.user.id },
                ScanIndexForward: false, // newest first
            })
        );

        const items = result.Items || [];
        const formatted = await Promise.all(items.map(formatRequest));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a single service request by ID
// @route   GET /api/service-requests/:id
// @access  Private (owner or admin)
const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await docClient.send(
            new GetCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
            })
        );

        if (!result.Item) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        // Allow access if user is admin or the owner
        if (result.Item.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this request' });
        }

        const formatted = await formatRequest(result.Item);

        // If not admin, strip internal admin notes
        if (!req.user.isAdmin) {
            delete formatted.adminNotes;
        }

        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all service requests (with optional status filter)
// @route   GET /api/service-requests
// @access  Admin
const getAllRequests = async (req, res) => {
    try {
        const { status, service } = req.query;
        let result;

        if (status && VALID_STATUSES.includes(status)) {
            result = await docClient.send(
                new QueryCommand({
                    TableName: SERVICE_REQUESTS_TABLE,
                    IndexName: 'status-index',
                    KeyConditionExpression: '#s = :status',
                    ExpressionAttributeNames: { '#s': 'status' },
                    ExpressionAttributeValues: { ':status': status },
                    ScanIndexForward: false,
                })
            );
        } else {
            result = await docClient.send(
                new ScanCommand({
                    TableName: SERVICE_REQUESTS_TABLE,
                })
            );
        }

        let items = result.Items || [];

        // Sort by createdAt desc if we did a scan
        if (!status) {
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Optional service filter (client-side for simplicity)
        if (service) {
            items = items.filter((item) => item.service === service);
        }

        const formatted = await Promise.all(items.map(formatRequest));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update request status
// @route   PUT /api/service-requests/:id/status
// @access  Admin
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            });
        }

        const existing = await docClient.send(
            new GetCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
            })
        );

        if (!existing.Item) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        const now = new Date().toISOString();
        const newHistoryEntry = {
            status,
            timestamp: now,
            changedBy: req.user.email || req.user.id,
        };

        const currentHistory = existing.Item.statusHistory || [];

        const result = await docClient.send(
            new UpdateCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
                UpdateExpression: 'SET #s = :status, #sh = :history, #ua = :now',
                ExpressionAttributeNames: {
                    '#s': 'status',
                    '#sh': 'statusHistory',
                    '#ua': 'updatedAt',
                },
                ExpressionAttributeValues: {
                    ':status': status,
                    ':history': [...currentHistory, newHistoryEntry],
                    ':now': now,
                },
                ReturnValues: 'ALL_NEW',
            })
        );

        res.status(200).json(result.Attributes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add admin response (visible to client)
// @route   PUT /api/service-requests/:id/response
// @access  Admin
const addAdminResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminResponse } = req.body;

        if (!adminResponse) {
            return res.status(400).json({ message: 'Response text is required' });
        }

        const existing = await docClient.send(
            new GetCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
            })
        );

        if (!existing.Item) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        const now = new Date().toISOString();

        const result = await docClient.send(
            new UpdateCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
                UpdateExpression: 'SET #ar = :response, #ua = :now',
                ExpressionAttributeNames: {
                    '#ar': 'adminResponse',
                    '#ua': 'updatedAt',
                },
                ExpressionAttributeValues: {
                    ':response': adminResponse,
                    ':now': now,
                },
                ReturnValues: 'ALL_NEW',
            })
        );

        res.status(200).json(result.Attributes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update admin notes (internal only)
// @route   PUT /api/service-requests/:id/notes
// @access  Admin
const updateAdminNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        if (adminNotes === undefined) {
            return res.status(400).json({ message: 'Admin notes field is required' });
        }

        const existing = await docClient.send(
            new GetCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
            })
        );

        if (!existing.Item) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        const now = new Date().toISOString();

        const result = await docClient.send(
            new UpdateCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
                UpdateExpression: 'SET #an = :notes, #ua = :now',
                ExpressionAttributeNames: {
                    '#an': 'adminNotes',
                    '#ua': 'updatedAt',
                },
                ExpressionAttributeValues: {
                    ':notes': adminNotes,
                    ':now': now,
                },
                ReturnValues: 'ALL_NEW',
            })
        );

        res.status(200).json(result.Attributes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a service request
// @route   DELETE /api/service-requests/:id
// @access  Admin
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await docClient.send(
            new GetCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
            })
        );

        if (!existing.Item) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        // Delete S3 image if exists
        if (existing.Item.imageKey && BUCKET) {
            try {
                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: BUCKET,
                        Key: existing.Item.imageKey,
                    })
                );
            } catch (err) {
                console.error('Failed to delete image from S3', err);
            }
        }

        await docClient.send(
            new DeleteCommand({
                TableName: SERVICE_REQUESTS_TABLE,
                Key: { requestId: id },
            })
        );

        res.status(200).json({ message: 'Service request deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRequest,
    getUserRequests,
    getRequestById,
    getAllRequests,
    updateRequestStatus,
    addAdminResponse,
    updateAdminNotes,
    deleteRequest,
};
