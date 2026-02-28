/**
 * Integration tests for upload routes
 *
 * Tests full HTTP request/response cycle through Express routes
 * using supertest, with all AWS services mocked.
 */

const {
  mockDocClientSend,
  MockS3Client,
  mockGetSignedUrl,
  MockCognitoIdentityProviderClient,
  mockCognitoSend,
  mockVerify,
  MockCognitoJwtVerifier,
  MOCK_UUID,
  mockUuidV4,
} = require('../mocks/awsMocks');
const { mockPresignedUrl, mockJwtPayload, mockUser } = require('../fixtures/mockData');

// ── Module-level mocks ────────────────────────────────────────────────
jest.mock('uuid', () => ({ v4: mockUuidV4 }));

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: MockCognitoIdentityProviderClient,
  SignUpCommand: jest.fn((p) => p),
  ConfirmSignUpCommand: jest.fn((p) => p),
  InitiateAuthCommand: jest.fn((p) => p),
  GetUserCommand: jest.fn((p) => p),
  ResendConfirmationCodeCommand: jest.fn((p) => p),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn((p) => p),
  QueryCommand: jest.fn((p) => p),
  ScanCommand: jest.fn((p) => p),
  GetCommand: jest.fn((p) => p),
  DeleteCommand: jest.fn((p) => p),
}));

jest.mock('../../config/dynamo', () => ({
  docClient: { send: mockDocClientSend },
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  PutObjectCommand: jest.fn((p) => p),
  GetObjectCommand: jest.fn((p) => p),
  DeleteObjectCommand: jest.fn((p) => p),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: MockCognitoJwtVerifier,
}));

// ── Import app AFTER mocks ────────────────────────────────────────────
const request = require('supertest');
const app = require('../../index');

// ── Reset ──────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  mockVerify.mockResolvedValue(mockJwtPayload);
  mockGetSignedUrl.mockResolvedValue(mockPresignedUrl);
});

// ════════════════════════════════════════════════════════════════════════
// POST /api/uploads/presign
// ════════════════════════════════════════════════════════════════════════
describe('POST /api/uploads/presign', () => {
  it('should return a presigned URL when authenticated', async () => {
    const res = await request(app)
      .post('/api/uploads/presign')
      .set('Authorization', 'Bearer valid-token')
      .send({ fileName: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uploadUrl', mockPresignedUrl);
    expect(res.body).toHaveProperty('key');
    expect(res.body.key).toContain(`users/${mockJwtPayload.sub}/`);
    expect(res.body.key).toContain(MOCK_UUID);
    expect(res.body).toHaveProperty('bucket', 'test-uploads-bucket');
    expect(res.body).toHaveProperty('expiresIn', 300);
  });

  it('should return 400 when fileName is missing', async () => {
    const res = await request(app)
      .post('/api/uploads/presign')
      .set('Authorization', 'Bearer valid-token')
      .send({ contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('fileName and contentType are required');
  });

  it('should return 400 when contentType is missing', async () => {
    const res = await request(app)
      .post('/api/uploads/presign')
      .set('Authorization', 'Bearer valid-token')
      .send({ fileName: 'img.png' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for non-image contentType', async () => {
    const res = await request(app)
      .post('/api/uploads/presign')
      .set('Authorization', 'Bearer valid-token')
      .send({ fileName: 'doc.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only image uploads allowed');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/uploads/presign')
      .send({ fileName: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(401);
  });

  it('should return 500 when getSignedUrl fails', async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error('S3 signing error'));

    const res = await request(app)
      .post('/api/uploads/presign')
      .set('Authorization', 'Bearer valid-token')
      .send({ fileName: 'img.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('S3 signing error');
  });
});
