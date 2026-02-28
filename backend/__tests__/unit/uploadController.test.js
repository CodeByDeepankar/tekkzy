/**
 * Unit tests for uploadController.js
 *
 * Mocks: S3 client, getSignedUrl, uuid
 */

const {
  MockS3Client,
  mockGetSignedUrl,
  MOCK_UUID,
  mockUuidV4,
} = require('../mocks/awsMocks');
const { mockUser, mockPresignedUrl } = require('../fixtures/mockData');

// ── Module-level mocks ────────────────────────────────────────────────
jest.mock('uuid', () => ({ v4: mockUuidV4 }));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  PutObjectCommand: jest.fn((params) => ({ _type: 'PutObject', ...params })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// ── Helpers ────────────────────────────────────────────────────────────
const buildReq = (body = {}, user = mockUser) => ({
  body,
  user,
});

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ── Import controller AFTER mocks ─────────────────────────────────────
const { createPresignedUpload } = require('../../controllers/uploadController');

// ── Reset ──────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  mockGetSignedUrl.mockResolvedValue(mockPresignedUrl);
});

// ════════════════════════════════════════════════════════════════════════
// createPresignedUpload
// ════════════════════════════════════════════════════════════════════════
describe('createPresignedUpload', () => {
  it('should return a presigned URL with key, bucket, and expiresIn', async () => {
    const req = buildReq({ fileName: 'photo.jpg', contentType: 'image/jpeg' });
    const res = buildRes();

    await createPresignedUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];
    expect(result.uploadUrl).toBe(mockPresignedUrl);
    expect(result.key).toBe(`users/${mockUser.id}/${MOCK_UUID}.jpg`);
    expect(result.bucket).toBe('test-uploads-bucket');
    expect(result.expiresIn).toBe(300);
  });

  it('should handle files without extension', async () => {
    const req = buildReq({ fileName: 'photo', contentType: 'image/png' });
    const res = buildRes();

    await createPresignedUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];
    expect(result.key).toBe(`users/${mockUser.id}/${MOCK_UUID}`);
  });

  it('should return 400 when fileName is missing', async () => {
    const req = buildReq({ contentType: 'image/png' });
    const res = buildRes();

    await createPresignedUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'fileName and contentType are required',
    });
  });

  it('should return 400 when contentType is missing', async () => {
    const req = buildReq({ fileName: 'image.png' });
    const res = buildRes();

    await createPresignedUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'fileName and contentType are required',
    });
  });

  it('should return 400 when contentType is not an image', async () => {
    const req = buildReq({ fileName: 'doc.pdf', contentType: 'application/pdf' });
    const res = buildRes();

    await createPresignedUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Only image uploads allowed' });
  });

  it('should return 500 when getSignedUrl fails', async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error('S3 error'));

    const req = buildReq({ fileName: 'img.png', contentType: 'image/png' });
    const res = buildRes();

    await createPresignedUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'S3 error' });
  });
});
