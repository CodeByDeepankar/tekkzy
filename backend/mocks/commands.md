# Beginner Mock Commands

Use these commands from the `backend` folder.

Mock event files are organized by feature:
- `mocks/contacts/*`
- `mocks/services/*`

## 1) Sign Up (create a new account)
```bash
serverless invoke local --function api --path mocks/contacts/signup-event.json
```

## 2) Sign In (log in)
```bash
serverless invoke local --function api --path mocks/contacts/signin-event.json
```

## 3) Forgot Password
```bash
serverless invoke local --function api --path mocks/contacts/forgot-password-event.json
```

## 4) Create Contact Message
```bash
serverless invoke local --function api --path mocks/contacts/create-message-event.json
```

## 5) Update Contact Message
```bash
serverless invoke local --function api --path mocks/contacts/update-message-event.json
```

## 6) Delete Contact Message
```bash
serverless invoke local --function api --path mocks/contacts/delete-message-event.json
```

## 7) Create Service Request
```bash
serverless invoke local --function api --path mocks/services/create-message-event.json
```

## 8) Update Service Request Status
```bash
serverless invoke local --function api --path mocks/services/update-message-event.json
```

## 9) Delete Service Request
```bash
serverless invoke local --function api --path mocks/services/delete-message-event.json
```

Notes for beginners:
- `signup` uses route `/api/auth/register`.
- `signin` uses route `/api/auth/login`.
- `forgot-password` uses route `/api/auth/forgot-password`.
- `contacts/create` can use `requestContext.authorizer.claims.sub` as user ID in mock events (no bearer token needed for local invoke).
- `services/create` can use `requestContext.authorizer.claims.sub` as user ID in mock events.
- `services/update` and `services/delete` can use `requestContext.authorizer.claims.cognito:groups` with `admin`.
- `update` and `delete` now use only contact ID (no Authorization token required).
- `update` and `delete` use sample contact IDs in each mock file path/params.