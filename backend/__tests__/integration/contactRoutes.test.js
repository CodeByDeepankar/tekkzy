/**
 * Integration tests for contact routes
 *
 * Tests full HTTP request/response cycle through Express routes
 * using supertest, with all AWS services mocked.
 */

const {
  mockDocClientSend,
  mockS3Send,
  MockS3Client,
  mockGetSignedUrl,
  MockCognitoIdentityProviderClient,
  mockCognitoSend,
  mockVerify,
  MockCognitoJwtVerifier,
  MOCK_UUID,
  mockUuidV4,
} = require('../mocks/awsMocks');
const {
  mockContact,
  mockContactWithImage,
  mockContacts,
  mockPresignedUrl,
  mockJwtPayload,
  mockUser,
} = require('../fixtures/mockData');

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
  ScanCommand: jest.fn((p) => p),
  PutCommand: jest.fn((p) => p),
  GetCommand: jest.fn((p) => p),
  DeleteCommand: jest.fn((p) => p),
  QueryCommand: jest.fn((p) => p),
}));

jest.mock('../../config/dynamo', () => ({
  docClient: { send: mockDocClientSend },
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  GetObjectCommand: jest.fn((p) => p),
  DeleteObjectCommand: jest.fn((p) => p),
  PutObjectCommand: jest.fn((p) => p),
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
// GET /api/contacts (public — no auth required)
// ════════════════════════════════════════════════════════════════════════
describe('GET /api/contacts', () => {
  it('should return all contacts without auth', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Items: mockContacts });

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(mockContacts.length);

    // Verify email masking
    res.body.forEach((c) => {
      expect(c.email).toMatch(/\*{4}/);
    });
  });

  it('should return empty array when no contacts', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Items: [] });

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 500 on DynamoDB error', async () => {
    mockDocClientSend.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(500);
  });
});

// ════════════════════════════════════════════════════════════════════════
// GET /api/contacts/mine (auth required)
// ════════════════════════════════════════════════════════════════════════
describe('GET /api/contacts/mine', () => {
  it('should return user contacts when authenticated', async () => {
    const userContacts = mockContacts.filter((c) => c.userId === mockUser.id);
    mockDocClientSend.mockResolvedValueOnce({ Items: userContacts });

    const res = await request(app)
      .get('/api/contacts/mine')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/contacts/mine');

    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POST /api/contacts (auth required)
// ════════════════════════════════════════════════════════════════════════
describe('POST /api/contacts', () => {
  const validBody = {
    name: 'New Contact',
    email: 'new@test.com',
    service: 'Web Dev',
    message: 'Build my site',
  };

  it('should create a contact and return 201', async () => {
    mockDocClientSend.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', 'Bearer valid-token')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('contactId', MOCK_UUID);
    expect(res.body).toHaveProperty('userId', mockJwtPayload.sub);
    expect(res.body).toHaveProperty('name', 'New Contact');
  });

  it('should create a contact with imageKey', async () => {
    mockDocClientSend.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', 'Bearer valid-token')
      .send({ ...validBody, imageKey: 'users/sub-123/photo.jpg' });

    expect(res.status).toBe(201);
    expect(res.body.imageKey).toBe('users/sub-123/photo.jpg');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please add all required fields');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send(validBody);

    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════
// DELETE /api/contacts/:id (auth required)
// ════════════════════════════════════════════════════════════════════════
describe('DELETE /api/contacts/:id', () => {
  it('should delete a contact owned by the user', async () => {
    mockDocClientSend
      .mockResolvedValueOnce({ Item: mockContact })   // GetCommand
      .mockResolvedValueOnce({});                       // DeleteCommand

    const res = await request(app)
      .delete(`/api/contacts/${mockContact.contactId}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Message deleted');
  });

  it('should return 404 when contact does not exist', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Item: null });

    const res = await request(app)
      .delete('/api/contacts/nonexistent-id')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(404);
  });

  it('should return 403 when user does not own the contact', async () => {
    const otherUserContact = { ...mockContact, userId: 'other-user-id' };
    mockDocClientSend.mockResolvedValueOnce({ Item: otherUserContact });

    const res = await request(app)
      .delete(`/api/contacts/${otherUserContact.contactId}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).delete('/api/contacts/some-id');

    expect(res.status).toBe(401);
  });
});
