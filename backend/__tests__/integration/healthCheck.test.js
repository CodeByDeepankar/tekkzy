/**
 * Integration test for the health check endpoint
 */

const {
  mockDocClientSend,
  MockCognitoIdentityProviderClient,
  mockVerify,
  MockCognitoJwtVerifier,
  MockS3Client,
} = require('../mocks/awsMocks');

// ── Module-level mocks (needed because importing app loads all routes) ─
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
  getSignedUrl: jest.fn().mockResolvedValue('https://mock'),
}));

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: MockCognitoJwtVerifier,
}));

// ── Import app AFTER mocks ────────────────────────────────────────────
const request = require('supertest');
const app = require('../../index');

// ════════════════════════════════════════════════════════════════════════
// GET / (health check)
// ════════════════════════════════════════════════════════════════════════
describe('GET / (health check)', () => {
  it('should return 200 with API info', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Daily Spend Management API');
    expect(res.body).toHaveProperty('status', 'running');
    expect(res.body.endpoints).toHaveProperty('auth', '/api/auth');
    expect(res.body.endpoints).toHaveProperty('contacts', '/api/contacts');
  });
});
