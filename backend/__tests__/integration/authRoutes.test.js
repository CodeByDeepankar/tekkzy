/**
 * Integration tests for auth routes
 *
 * Tests full HTTP request/response cycle through Express routes
 * using supertest, with all AWS services mocked.
 */

const {
  mockDocClientSend,
  mockCognitoSend,
  MockCognitoIdentityProviderClient,
  mockVerify,
  MockCognitoJwtVerifier,
} = require('../mocks/awsMocks');
const { mockTokens, mockCognitoUserAttributes, mockUser, mockJwtPayload } = require('../fixtures/mockData');

// ── Module-level mocks ────────────────────────────────────────────────
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

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: MockCognitoJwtVerifier,
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send: jest.fn() })),
  GetObjectCommand: jest.fn((p) => p),
  DeleteObjectCommand: jest.fn((p) => p),
  PutObjectCommand: jest.fn((p) => p),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-presigned-url'),
}));

// ── Import app AFTER mocks ────────────────────────────────────────────
const request = require('supertest');
const app = require('../../index');

// ── Reset ──────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  mockVerify.mockResolvedValue(mockJwtPayload);
});

// ════════════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  it('should register a new user and return 201', async () => {
    mockCognitoSend.mockResolvedValueOnce({
      UserSub: 'new-sub-id',
      UserConfirmed: false,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Secure1!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userSub', 'new-sub-id');
    expect(res.body).toHaveProperty('email', 'alice@test.com');
    expect(res.body.confirmed).toBe(false);
  });

  it('should return 400 with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please add all fields');
  });

  it('should return 400 on UsernameExistsException', async () => {
    const error = new Error('User exists');
    error.name = 'UsernameExistsException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'dup@test.com', password: 'Pass1!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });
});

// ════════════════════════════════════════════════════════════════════════
// POST /api/auth/confirm
// ════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/confirm', () => {
  it('should confirm user and return 200', async () => {
    mockCognitoSend.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/confirm')
      .send({ email: 'alice@test.com', code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verified successfully/);
  });

  it('should return 400 with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/confirm')
      .send({ email: 'alice@test.com' });

    expect(res.status).toBe(400);
  });

  it('should return 400 on CodeMismatchException', async () => {
    const error = new Error('Bad code');
    error.name = 'CodeMismatchException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const res = await request(app)
      .post('/api/auth/confirm')
      .send({ email: 'a@b.com', code: 'wrong' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid verification code');
  });
});

// ════════════════════════════════════════════════════════════════════════
// POST /api/auth/resend-code
// ════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/resend-code', () => {
  it('should resend code and return 200', async () => {
    mockCognitoSend.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/resend-code')
      .send({ email: 'alice@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/resent/);
  });

  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/resend-code')
      .send({});

    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  it('should login and return tokens + user info', async () => {
    mockCognitoSend.mockResolvedValueOnce({
      AuthenticationResult: mockTokens,
    });
    mockCognitoSend.mockResolvedValueOnce({
      UserAttributes: mockCognitoUserAttributes,
    });
    mockDocClientSend.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Secure1!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', mockTokens.IdToken);
    expect(res.body).toHaveProperty('accessToken', mockTokens.AccessToken);
    expect(res.body).toHaveProperty('refreshToken', mockTokens.RefreshToken);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
  });

  it('should return 400 with missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });

  it('should return 401 on NotAuthorizedException', async () => {
    const error = new Error('Bad creds');
    error.name = 'NotAuthorizedException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should return 403 on UserNotConfirmedException', async () => {
    const error = new Error('Not confirmed');
    error.name = 'UserNotConfirmedException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Pass1!' });

    expect(res.status).toBe(403);
    expect(res.body.needsConfirmation).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════
// GET /api/auth/me
// ════════════════════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {
  it('should return user data when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', mockJwtPayload.sub);
    expect(res.body).toHaveProperty('email', mockJwtPayload.email);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('should return 401 when token is invalid', async () => {
    mockVerify.mockRejectedValueOnce(new Error('Invalid token'));

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
  });
});
