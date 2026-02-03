const { v4: uuidv4 } = require('uuid');
const { ScanCommand, PutCommand, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamo');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const CONTACTS_TABLE = process.env.DYNAMODB_CONTACTS_TABLE;
const BUCKET = process.env.S3_BUCKET;
const region =
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'us-east-1';
const s3 = new S3Client({ region });

const formatContact = async (contact) => {
    // Mask Email
    let maskedEmail = contact.email;
    if (contact.email && contact.email.includes('@')) {
        const [local, domain] = contact.email.split('@');
        if (local.length > 4) {
            maskedEmail = `${local.substring(0, 4)}****${domain}`;
        } else {
            maskedEmail = `${local.substring(0, 1)}****${domain}`;
        }
    }

    // Time Ago
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(contact.createdAt)) / 1000);
    let submitted;

    if (diffInSeconds < 60) {
        submitted = 'recently';
    } else if (diffInSeconds < 3600) {
        submitted = `${Math.floor(diffInSeconds / 60)} m ago`;
    } else if (diffInSeconds < 86400) {
        submitted = `${Math.floor(diffInSeconds / 3600)} h ago`;
    } else {
        submitted = `${Math.floor(diffInSeconds / 86400)} d ago`;
    }

    let imageUrl = null;
    if (contact.imageKey && BUCKET) {
        try {
            const command = new GetObjectCommand({
                Bucket: BUCKET,
                Key: contact.imageKey
            });
            imageUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
        } catch (err) {
            console.error('Failed to sign image URL', err);
        }
    }

    return {
        contactId: contact.contactId,
        name: contact.name,
        service: contact.service,
        message: contact.message,
        email: maskedEmail,
        submitted: `submitted ${submitted}`,
        imageUrl
    };
};

// @desc    Get contacts
// @route   GET /api/contacts
// @access  Private
const getContacts = async (req, res) => {
    try {
        // User requested "view all submited users data", assuming authorized user can see all.
        const result = await docClient.send(
            new ScanCommand({
                TableName: CONTACTS_TABLE
            })
        );

        const contacts = (result.Items || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const formattedContacts = await Promise.all(contacts.map(formatContact));

        res.status(200).json(formattedContacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's contacts
// @route   GET /api/contacts/mine
// @access  Private
const getUserContacts = async (req, res) => {
    try {
        const result = await docClient.send(
            new ScanCommand({
                TableName: CONTACTS_TABLE,
                FilterExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': req.user.id
                }
            })
        );

        const contacts = (result.Items || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const formattedContacts = await Promise.all(contacts.map(formatContact));

        res.status(200).json(formattedContacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create contact
// @route   POST /api/contacts
// @access  Private
const createContact = async (req, res) => {
    try {
        const { name, email, service, message, imageKey } = req.body;

        if (!name || !email || !service || !message) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const contactId = uuidv4();
        const createdAt = new Date().toISOString();

        const contactItem = {
            contactId,
            userId: req.user.id,
            name,
            email,
            service,
            message,
            createdAt
        };

        if (imageKey) {
            contactItem.imageKey = imageKey;
        }

        await docClient.send(
            new PutCommand({
                TableName: CONTACTS_TABLE,
                Item: contactItem
            })
        );

        res.status(201).json(contactItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Contact id is required' });
        }

        const existing = await docClient.send(
            new GetCommand({
                TableName: CONTACTS_TABLE,
                Key: { contactId: id }
            })
        );

        if (!existing.Item) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (existing.Item.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        if (existing.Item.imageKey && BUCKET) {
            try {
                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: BUCKET,
                        Key: existing.Item.imageKey
                    })
                );
            } catch (err) {
                console.error('Failed to delete image from S3', err);
            }
        }

        await docClient.send(
            new DeleteCommand({
                TableName: CONTACTS_TABLE,
                Key: { contactId: id }
            })
        );

        res.status(200).json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getContacts,
    getUserContacts,
    createContact,
    deleteContact
};
