/**
 * Unit tests for authController.js
 *
 * Mocks: Cognito SDK, DynamoDB docClient, uuid
 */

const {
  mockDocClientSend,
  mockCognitoSend,
  MockCognitoIdentityProviderClient,
} = require('../mocks/awsMocks');
const { mockUser, mockTokens, mockCognitoUserAttributes } = require('../fixtures/mockData');

// ── Module-level mocks (hoisted by Jest) ───────────────────────────────
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: MockCognitoIdentityProviderClient,
  SignUpCommand: jest.fn((params) => ({ _type: 'SignUp', ...params })),
  ConfirmSignUpCommand: jest.fn((params) => ({ _type: 'ConfirmSignUp', ...params })),
  InitiateAuthCommand: jest.fn((params) => ({ _type: 'InitiateAuth', ...params })),
  GetUserCommand: jest.fn((params) => ({ _type: 'GetUser', ...params })),
  ResendConfirmationCodeCommand: jest.fn((params) => ({ _type: 'ResendCode', ...params })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn((params) => ({ _type: 'Put', ...params })),
  QueryCommand: jest.fn((params) => ({ _type: 'Query', ...params })),
}));

jest.mock('../../config/dynamo', () => ({
  docClient: { send: mockDocClientSend },
}));

// ── Helpers ────────────────────────────────────────────────────────────
const buildReq = (body = {}, user = null) => ({
  body,
  user,
});

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ── Import controller AFTER mocks are set up ──────────────────────────
const {
  registerUser,
  confirmUser,
  resendCode,
  loginUser,
  getMe,
} = require('../../controllers/authController');

// ── Tests ──────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════
// registerUser
// ════════════════════════════════════════════════════════════════════════
describe('registerUser', () => {
  it('should register a user and return 201', async () => {
    mockCognitoSend.mockResolvedValueOnce({
      UserSub: 'sub-new-user',
      UserConfirmed: false,
    });

    const req = buildReq({ name: 'New User', email: 'New@Example.COM', password: 'Secure1!' });
    const res = buildRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        userSub: 'sub-new-user',
        email: 'new@example.com', // lowercased
        confirmed: false,
      })
    );
  });

  it('should return 400 when fields are missing', async () => {
    const req = buildReq({ email: 'test@example.com' }); // missing name & password
    const res = buildRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Please add all fields' });
  });

  it('should return 400 on UsernameExistsException', async () => {
    const error = new Error('User already exists');
    error.name = 'UsernameExistsException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const req = buildReq({ name: 'U', email: 'dup@test.com', password: 'Pass1!' });
    const res = buildRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
  });

  it('should return 400 on InvalidPasswordException', async () => {
    const error = new Error('Password does not meet requirements');
    error.name = 'InvalidPasswordException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const req = buildReq({ name: 'U', email: 'u@t.com', password: 'short' });
    const res = buildRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password does not meet requirements' });
  });

  it('should return 500 on generic error', async () => {
    mockCognitoSend.mockRejectedValueOnce(new Error('Service unavailable'));

    const req = buildReq({ name: 'U', email: 'u@t.com', password: 'Pass1!' });
    const res = buildRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Service unavailable' });
  });
});

// ════════════════════════════════════════════════════════════════════════
// confirmUser
// ════════════════════════════════════════════════════════════════════════
describe('confirmUser', () => {
  it('should confirm a user and return 200', async () => {
    mockCognitoSend.mockResolvedValueOnce({});

    const req = buildReq({ email: 'test@example.com', code: '123456' });
    const res = buildRes();

    await confirmUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email verified successfully. You can now log in.',
    });
  });

  it('should return 400 when email or code is missing', async () => {
    const req = buildReq({ email: 'test@example.com' }); // missing code
    const res = buildRes();

    await confirmUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email and confirmation code are required',
    });
  });

  it('should return 400 on CodeMismatchException', async () => {
    const error = new Error('Invalid code');
    error.name = 'CodeMismatchException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const req = buildReq({ email: 'test@example.com', code: 'wrong' });
    const res = buildRes();

    await confirmUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid verification code' });
  });

  it('should return 400 on ExpiredCodeException', async () => {
    const error = new Error('Code expired');
    error.name = 'ExpiredCodeException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const req = buildReq({ email: 'test@example.com', code: '000000' });
    const res = buildRes();

    await confirmUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification code has expired. Please request a new one.',
    });
  });

  it('should return 500 on generic error', async () => {
    mockCognitoSend.mockRejectedValueOnce(new Error('Unexpected'));

    const req = buildReq({ email: 'a@b.com', code: '111111' });
    const res = buildRes();

    await confirmUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════════════════════════════
// resendCode
// ════════════════════════════════════════════════════════════════════════
describe('resendCode', () => {
  it('should resend code and return 200', async () => {
    mockCognitoSend.mockResolvedValueOnce({});

    const req = buildReq({ email: 'test@example.com' });
    const res = buildRes();

    await resendCode(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification code resent. Please check your email.',
    });
  });

  it('should return 400 when email is missing', async () => {
    const req = buildReq({});
    const res = buildRes();

    await resendCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
  });

  it('should return 500 on generic error', async () => {
    mockCognitoSend.mockRejectedValueOnce(new Error('Cognito down'));

    const req = buildReq({ email: 'test@example.com' });
    const res = buildRes();

    await resendCode(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cognito down' });
  });
});

// ════════════════════════════════════════════════════════════════════════
// loginUser
// ════════════════════════════════════════════════════════════════════════
describe('loginUser', () => {
  it('should login successfully and return tokens + user data', async () => {
    // First send: InitiateAuthCommand
    mockCognitoSend.mockResolvedValueOnce({
      AuthenticationResult: mockTokens,
    });
    // Second send: GetUserCommand
    mockCognitoSend.mockResolvedValueOnce({
      UserAttributes: mockCognitoUserAttributes,
    });
    // DynamoDB PutCommand (sync user)
    mockDocClientSend.mockResolvedValueOnce({});

    const req = buildReq({ email: 'Test@Example.COM', password: 'Secure1!' });
    const res = buildRes();

    await loginUser(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'sub-123-456-789',
        name: 'Test User',
        email: 'test@example.com',
        token: mockTokens.IdToken,
        accessToken: mockTokens.AccessToken,
        refreshToken: mockTokens.RefreshToken,
      })
    );
  });

  it('should handle DynamoDB ConditionalCheckFailedException gracefully (user exists)', async () => {
    mockCognitoSend.mockResolvedValueOnce({
      AuthenticationResult: mockTokens,
    });
    mockCognitoSend.mockResolvedValueOnce({
      UserAttributes: mockCognitoUserAttributes,
    });
    // DynamoDB conditional check fails — user already exists
    const putError = new Error('Condition not met');
    putError.name = 'ConditionalCheckFailedException';
    mockDocClientSend.mockRejectedValueOnce(putError);

    const req = buildReq({ email: 'test@example.com', password: 'Secure1!' });
    const res = buildRes();

    await loginUser(req, res);

    // Should still succeed — ConditionalCheckFailedException is expected
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'sub-123-456-789',
        token: mockTokens.IdToken,
      })
    );
  });

  it('should return 400 when email or password is missing', async () => {
    const req = buildReq({ email: 'test@example.com' }); // no password
    const res = buildRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Please provide email and password',
    });
  });

  it('should return 401 on NotAuthorizedException', async () => {
    const error = new Error('Incorrect username or password');
    error.name = 'NotAuthorizedException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const req = buildReq({ email: 'test@example.com', password: 'wrong' });
    const res = buildRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 403 on UserNotConfirmedException', async () => {
    const error = new Error('User not confirmed');
    error.name = 'UserNotConfirmedException';
    mockCognitoSend.mockRejectedValueOnce(error);

    const req = buildReq({ email: 'test@example.com', password: 'Pass1!' });
    const res = buildRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        needsConfirmation: true,
      })
    );
  });

  it('should return 500 on generic error', async () => {
    mockCognitoSend.mockRejectedValueOnce(new Error('Network error'));

    const req = buildReq({ email: 'test@example.com', password: 'Pass1!' });
    const res = buildRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════════════════════════════
// getMe
// ════════════════════════════════════════════════════════════════════════
describe('getMe', () => {
  it('should return the current user from req.user', async () => {
    const req = buildReq({}, mockUser);
    const res = buildRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });
});
