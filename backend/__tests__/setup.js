// Set up environment variables for all tests
process.env.AWS_REGION = 'us-east-1';
process.env.COGNITO_REGION = 'us-east-1';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_TestPool';
process.env.DYNAMODB_USERS_TABLE = 'test-users';
process.env.DYNAMODB_USERS_EMAIL_INDEX = 'email-index';
process.env.DYNAMODB_CONTACTS_TABLE = 'test-contacts';
process.env.S3_BUCKET = 'test-uploads-bucket';
process.env.NODE_ENV = 'test';
