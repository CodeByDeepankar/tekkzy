## Plan: Jest Unit + Integration Tests for Backend APIs

**TL;DR:** Set up Jest with `supertest` in the backend, then create two layers of tests — controller unit tests (mocking AWS SDK at the module level) and route integration tests (mocking AWS SDK, hitting Express endpoints via supertest). All 11 endpoints will be covered with happy-path and error-case tests using mock data. Jest's `jest.mock()` will intercept all AWS SDK calls (Cognito, DynamoDB, S3) so no real AWS credentials are needed.

**Steps**

1. **Install dependencies** — Add `jest`, `supertest`, and configure in `backend/package.json`:
   - `npm install --save-dev jest supertest`
   - Update `"test"` script to `"jest --verbose --forceExit --detectOpenHandles"`
   - Add a `jest` config block: `testEnvironment: "node"`, `testMatch: ["**/__tests__/**/*.test.js"]`

2. **Create test directory structure** under `backend/__tests__/`:
   - `__tests__/unit/authController.test.js`
   - `__tests__/unit/contactController.test.js`
   - `__tests__/unit/uploadController.test.js`
   - `__tests__/unit/authMiddleware.test.js`
   - `__tests__/integration/authRoutes.test.js`
   - `__tests__/integration/contactRoutes.test.js`
   - `__tests__/integration/uploadRoutes.test.js`
   - `__tests__/mocks/awsMocks.js` — shared mock factories
   - `__tests__/fixtures/mockData.js` — reusable mock data (users, contacts, tokens)

3. **Create shared mock data fixtures** in `__tests__/fixtures/mockData.js`:
   - `mockUser` — `{ id: 'sub-123', name: 'Test User', email: 'test@example.com' }`
   - `mockTokens` — fake `AccessToken`, `IdToken`, `RefreshToken`
   - `mockContact` — `{ contactId: 'uuid-456', userId: 'sub-123', name: '...', email: '...', service: '...', message: '...', createdAt: '...' }`
   - `mockCognitoUserAttributes` — array of `{ Name, Value }` objects
   - `mockPresignedUrl` — `'https://s3.amazonaws.com/test-presigned-url'`

4. **Create shared AWS mock helpers** in `__tests__/mocks/awsMocks.js`:
   - Factory functions that return mock implementations for `docClient.send()`, `cognitoClient.send()`, `getSignedUrl()`
   - Mock for `aws-jwt-verify` `CognitoJwtVerifier.create()` returning a verifier with a mock `.verify()` method

5. **Set up environment variables** — Create `__tests__/setup.js` (configured as Jest `setupFiles`) to set all required `process.env` values (`COGNITO_CLIENT_ID`, `COGNITO_USER_POOL_ID`, `DYNAMODB_USERS_TABLE`, `DYNAMODB_CONTACTS_TABLE`, `S3_BUCKET`, `AWS_REGION`, etc.)

6. **Write auth controller unit tests** (`__tests__/unit/authController.test.js`):
   - Mock `@aws-sdk/client-cognito-identity-provider`, `@aws-sdk/lib-dynamodb`, `../config/dynamo`, `uuid`
   - `registerUser`: success (201 + userSub), missing fields (400), `UsernameExistsException` (400), `InvalidPasswordException` (400), generic error (500)
   - `confirmUser`: success (200), missing fields (400), `CodeMismatchException` (400), `ExpiredCodeException` (400)
   - `resendCode`: success (200), missing email (400), generic error (500)
   - `loginUser`: success (200 + tokens + user data), missing fields (400), `NotAuthorizedException` (401), `UserNotConfirmedException` (403), DynamoDB sync tested
   - `getMe`: returns `req.user` (200)

7. **Write contact controller unit tests** (`__tests__/unit/contactController.test.js`):
   - Mock `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `../config/dynamo`, `uuid`
   - `getContacts`: success with formatted contacts (masked emails, time ago, presigned image URLs), empty list
   - `getUserContacts`: success filtered by user ID, empty list
   - `createContact`: success with all fields (201), success with optional imageKey, missing required fields (400)
   - `deleteContact`: success (200), contact not found (404), not owner (403), deletes S3 image when present

8. **Write upload controller unit tests** (`__tests__/unit/uploadController.test.js`):
   - Mock `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `uuid`
   - `createPresignedUpload`: success (200 + presigned URL + key), missing fileName (400), missing contentType (400), non-image contentType (400)

9. **Write auth middleware unit tests** (`__tests__/unit/authMiddleware.test.js`):
   - Mock `aws-jwt-verify`
   - Valid token → sets `req.user` and calls `next()`
   - No Authorization header → 401
   - Invalid/expired token → 401

10. **Write auth routes integration tests** (`__tests__/integration/authRoutes.test.js`):
    - Use `supertest(app)` against the Express app from `backend/index.js`
    - Mock all AWS SDK modules at the top level
    - Test all 5 auth endpoints end-to-end through HTTP: POST `/api/auth/register`, `/api/auth/confirm`, `/api/auth/resend-code`, `/api/auth/login`, GET `/api/auth/me` (with mocked auth middleware)
    - Verify status codes, response shapes, headers

11. **Write contact routes integration tests** (`__tests__/integration/contactRoutes.test.js`):
    - Test all 4 contact endpoints: GET `/api/contacts/`, GET `/api/contacts/mine`, POST `/api/contacts/`, DELETE `/api/contacts/:id`
    - Include auth-required tests (401 when no token provided)
    - Test the public `GET /api/contacts/` endpoint works without auth

12. **Write upload routes integration tests** (`__tests__/integration/uploadRoutes.test.js`):
    - Test POST `/api/uploads/presign` — success and validation errors
    - Test 401 when unauthenticated

13. **Add a health check test** — Verify `GET /` returns 200 with expected response

**Mocking Strategy**
- Use `jest.mock()` at the module level for all AWS SDK packages — this is critical because the controllers instantiate SDK clients at module load time
- For integration tests, mock `aws-jwt-verify` to make the `protect` middleware pass with a controlled `req.user`
- Mock `uuid.v4` to return deterministic IDs for assertions
- Mock `getSignedUrl` from `@aws-sdk/s3-request-presigner` to return a fixed URL

**Verification**
- Run `cd backend && npm test` — all tests should pass with 0 real AWS calls
- Run `npx jest --coverage` to verify coverage across all controllers, routes, and middleware
- Expected: ~50+ test cases covering happy paths, validation errors, AWS error handling, and auth middleware

**Decisions**
- Jest chosen over Mocha for built-in mocking (`jest.mock()`) which is ideal for AWS SDK module-level mocking
- CommonJS `jest.mock()` hoisting handles the module-level client instantiation pattern used in all controllers
- Express app export from `backend/index.js` (which already conditionally starts the server) is directly usable by supertest without modification
- Separate fixtures/mocks files to keep tests DRY across unit and integration layers
