const mockUser = {
  id: 'sub-123-456-789',
  name: 'Test User',
  email: 'test@example.com',
};

const mockTokens = {
  IdToken: 'mock-id-token-xyz',
  AccessToken: 'mock-access-token-xyz',
  RefreshToken: 'mock-refresh-token-xyz',
};

const mockCognitoUserAttributes = [
  { Name: 'sub', Value: 'sub-123-456-789' },
  { Name: 'email', Value: 'test@example.com' },
  { Name: 'name', Value: 'Test User' },
];

const mockContact = {
  contactId: 'uuid-contact-001',
  userId: 'sub-123-456-789',
  name: 'Jane Doe',
  email: 'jane@example.com',
  service: 'Web Development',
  message: 'I need a website built for my business.',
  createdAt: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
};

const mockContactWithImage = {
  ...mockContact,
  contactId: 'uuid-contact-002',
  imageKey: 'users/sub-123-456-789/image-abc.png',
};

const mockContacts = [
  mockContact,
  {
    contactId: 'uuid-contact-003',
    userId: 'sub-other-user',
    name: 'John Smith',
    email: 'john@example.com',
    service: 'Mobile App',
    message: 'Looking for a mobile app developer.',
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(), // 1 day ago
  },
  mockContactWithImage,
];

const mockPresignedUrl = 'https://test-uploads-bucket.s3.amazonaws.com/presigned-url?X-Amz-Signature=mock';

const mockJwtPayload = {
  sub: 'sub-123-456-789',
  email: 'test@example.com',
  name: 'Test User',
  iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TestPool',
  token_use: 'id',
};

module.exports = {
  mockUser,
  mockTokens,
  mockCognitoUserAttributes,
  mockContact,
  mockContactWithImage,
  mockContacts,
  mockPresignedUrl,
  mockJwtPayload,
};
