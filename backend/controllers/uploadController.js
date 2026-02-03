const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  'us-east-1';

const s3 = new S3Client({ region });
const BUCKET = process.env.S3_BUCKET;

// @desc    Create presigned URL for image upload
// @route   POST /api/uploads/presign
// @access  Private
const createPresignedUpload = async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!BUCKET) {
      return res.status(500).json({ message: 'S3 bucket not configured' });
    }

    if (!fileName || !contentType) {
      return res
        .status(400)
        .json({ message: 'fileName and contentType are required' });
    }

    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image uploads allowed' });
    }

    const safeExt = path.extname(fileName) || '';
    const userPrefix = req.user?.id ? `users/${req.user.id}` : 'public';
    const key = `${userPrefix}/${uuidv4()}${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.status(200).json({
      uploadUrl,
      key,
      bucket: BUCKET,
      expiresIn: 300
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPresignedUpload };
