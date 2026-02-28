/**
 * Shared AWS mock helpers for Jest tests.
 *
 * These mocks are applied via jest.mock() at the top of each test file.
 * They intercept all AWS SDK calls so no real AWS credentials are needed.
 */

const { mockPresignedUrl, mockJwtPayload } = require('../fixtures/mockData');

// ── DynamoDB docClient mock ────────────────────────────────────────────
const mockDocClientSend = jest.fn();
const mockDocClient = { send: mockDocClientSend };

// ── Cognito client mock ────────────────────────────────────────────────
const mockCognitoSend = jest.fn();
const MockCognitoIdentityProviderClient = jest.fn(() => ({
  send: mockCognitoSend,
}));

// ── S3 client mock ─────────────────────────────────────────────────────
const mockS3Send = jest.fn();
const MockS3Client = jest.fn(() => ({
  send: mockS3Send,
}));

// ── getSignedUrl mock ──────────────────────────────────────────────────
const mockGetSignedUrl = jest.fn().mockResolvedValue(mockPresignedUrl);

// ── CognitoJwtVerifier mock ───────────────────────────────────────────
const mockVerify = jest.fn().mockResolvedValue(mockJwtPayload);
const MockCognitoJwtVerifier = {
  create: jest.fn(() => ({
    verify: mockVerify,
  })),
};

// ── UUID mock ──────────────────────────────────────────────────────────
const MOCK_UUID = 'mocked-uuid-1234';
const mockUuidV4 = jest.fn(() => MOCK_UUID);

module.exports = {
  // DynamoDB
  mockDocClient,
  mockDocClientSend,
  // Cognito
  mockCognitoSend,
  MockCognitoIdentityProviderClient,
  // S3
  mockS3Send,
  MockS3Client,
  // Presigner
  mockGetSignedUrl,
  // JWT Verifier
  mockVerify,
  MockCognitoJwtVerifier,
  // UUID
  MOCK_UUID,
  mockUuidV4,
};
