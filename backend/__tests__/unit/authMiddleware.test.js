/**
 * Unit tests for authMiddleware.js (protect middleware)
 *
 * Mocks: aws-jwt-verify, DynamoDB docClient
 */

const { mockVerify, MockCognitoJwtVerifier, mockDocClientSend } = require('../mocks/awsMocks');
const { mockJwtPayload } = require('../fixtures/mockData');

// ── Module-level mocks ────────────────────────────────────────────────
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: MockCognitoJwtVerifier,
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  GetCommand: jest.fn((params) => ({ _type: 'Get', ...params })),
}));

jest.mock('../../config/dynamo', () => ({
  docClient: { send: mockDocClientSend },
}));

// ── Helpers ────────────────────────────────────────────────────────────
const buildReq = (authHeader) => ({
  headers: {
    authorization: authHeader,
  },
});

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const buildNext = () => jest.fn();

// ── Import middleware AFTER mocks ─────────────────────────────────────
const { protect } = require('../../middleware/authMiddleware');

// ── Reset ──────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  mockVerify.mockResolvedValue(mockJwtPayload);
});

// ════════════════════════════════════════════════════════════════════════
// protect middleware
// ════════════════════════════════════════════════════════════════════════
describe('protect middleware', () => {
  it('should set req.user and call next() with a valid token', async () => {
    const req = buildReq('Bearer valid-token-123');
    const res = buildRes();
    const next = buildNext();

    await protect(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith('valid-token-123');
    expect(req.user).toEqual({
      id: mockJwtPayload.sub,
      name: mockJwtPayload.name,
      email: mockJwtPayload.email,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 when no Authorization header is present', async () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = buildNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header does not start with Bearer', async () => {
    const req = buildReq('Basic some-credentials');
    const res = buildRes();
    const next = buildNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token verification fails', async () => {
    mockVerify.mockRejectedValueOnce(new Error('Token expired'));

    const req = buildReq('Bearer expired-token');
    const res = buildRes();
    const next = buildNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token invalid' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle missing name attribute gracefully', async () => {
    mockVerify.mockResolvedValueOnce({
      sub: 'sub-no-name',
      email: 'noname@test.com',
      // name is undefined
    });

    const req = buildReq('Bearer valid-token');
    const res = buildRes();
    const next = buildNext();

    await protect(req, res, next);

    expect(req.user).toEqual({
      id: 'sub-no-name',
      name: '',
      email: 'noname@test.com',
    });
    expect(next).toHaveBeenCalled();
  });
});
