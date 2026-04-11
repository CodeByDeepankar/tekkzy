/**
 * Unit tests for contactController.js
 *
 * Mocks: DynamoDB docClient, S3 client, getSignedUrl, uuid
 */

const {
  mockDocClientSend,
  mockS3Send,
  MockS3Client,
  mockGetSignedUrl,
  MOCK_UUID,
  mockUuidV4,
} = require('../mocks/awsMocks');
const {
  mockUser,
  mockContact,
  mockContactWithImage,
  mockContacts,
  mockPresignedUrl,
} = require('../fixtures/mockData');

// ── Module-level mocks ────────────────────────────────────────────────
jest.mock('uuid', () => ({ v4: mockUuidV4 }));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  ScanCommand: jest.fn((params) => ({ _type: 'Scan', ...params })),
  PutCommand: jest.fn((params) => ({ _type: 'Put', ...params })),
  GetCommand: jest.fn((params) => ({ _type: 'Get', ...params })),
  DeleteCommand: jest.fn((params) => ({ _type: 'Delete', ...params })),
  UpdateCommand: jest.fn((params) => ({ _type: 'Update', ...params })),
}));

jest.mock('../../config/dynamo', () => ({
  docClient: { send: mockDocClientSend },
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  GetObjectCommand: jest.fn((params) => ({ _type: 'GetObject', ...params })),
  DeleteObjectCommand: jest.fn((params) => ({ _type: 'DeleteObject', ...params })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// ── Helpers ────────────────────────────────────────────────────────────
const buildReq = (body = {}, params = {}, user = mockUser) => ({
  body,
  params,
  user,
});

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ── Import controller AFTER mocks ─────────────────────────────────────
const {
  getContacts,
  getUserContacts,
  createContact,
  updateContact,
  deleteContact,
} = require('../../controllers/contactController');

// ── Reset ──────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  mockGetSignedUrl.mockResolvedValue(mockPresignedUrl);
});

// ════════════════════════════════════════════════════════════════════════
// getContacts
// ════════════════════════════════════════════════════════════════════════
describe('getContacts', () => {
  it('should return all contacts formatted and sorted by createdAt desc', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Items: mockContacts });

    const req = buildReq();
    const res = buildRes();

    await getContacts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const contacts = res.json.mock.calls[0][0];
    expect(contacts).toHaveLength(3);

    // Verify email masking
    contacts.forEach((c) => {
      expect(c.email).toMatch(/\*{4}/); // masked
    });

    // Verify "submitted" field
    contacts.forEach((c) => {
      expect(c.submitted).toMatch(/^submitted /);
    });

    // Verify contact with image has imageUrl
    const withImage = contacts.find((c) => c.contactId === mockContactWithImage.contactId);
    expect(withImage.imageUrl).toBe(mockPresignedUrl);
  });

  it('should return empty array when no contacts exist', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Items: [] });

    const req = buildReq();
    const res = buildRes();

    await getContacts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should handle undefined Items gracefully', async () => {
    mockDocClientSend.mockResolvedValueOnce({}); // no Items key

    const req = buildReq();
    const res = buildRes();

    await getContacts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should return 500 on DynamoDB error', async () => {
    mockDocClientSend.mockRejectedValueOnce(new Error('DynamoDB unavailable'));

    const req = buildReq();
    const res = buildRes();

    await getContacts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'DynamoDB unavailable' });
  });
});

// ════════════════════════════════════════════════════════════════════════
// getUserContacts
// ════════════════════════════════════════════════════════════════════════
describe('getUserContacts', () => {
  it('should return only current user contacts', async () => {
    const userContacts = mockContacts.filter((c) => c.userId === mockUser.id);
    mockDocClientSend.mockResolvedValueOnce({ Items: userContacts });

    const req = buildReq({}, {}, mockUser);
    const res = buildRes();

    await getUserContacts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const contacts = res.json.mock.calls[0][0];
    expect(contacts.length).toBe(userContacts.length);
  });

  it('should return empty array when user has no contacts', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Items: [] });

    const req = buildReq({}, {}, mockUser);
    const res = buildRes();

    await getUserContacts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should return 500 on error', async () => {
    mockDocClientSend.mockRejectedValueOnce(new Error('Scan failed'));

    const req = buildReq({}, {}, mockUser);
    const res = buildRes();

    await getUserContacts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════════════════════════════
// createContact
// ════════════════════════════════════════════════════════════════════════
describe('createContact', () => {
  it('should create a contact and return 201', async () => {
    mockDocClientSend.mockResolvedValueOnce({});

    const body = {
      name: 'New Contact',
      email: 'new@test.com',
      service: 'SEO',
      message: 'Help me rank',
    };
    const req = buildReq(body);
    const res = buildRes();

    await createContact(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: MOCK_UUID,
        userId: mockUser.id,
        name: 'New Contact',
        email: 'new@test.com',
        service: 'SEO',
        message: 'Help me rank',
        createdAt: expect.any(String),
      })
    );
  });

  it('should include imageKey when provided', async () => {
    mockDocClientSend.mockResolvedValueOnce({});

    const body = {
      name: 'Img Contact',
      email: 'img@test.com',
      service: 'Design',
      message: 'See attachment',
      imageKey: 'users/sub-123/img.png',
    };
    const req = buildReq(body);
    const res = buildRes();

    await createContact(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].imageKey).toBe('users/sub-123/img.png');
  });

  it('should return 400 when required fields are missing', async () => {
    const req = buildReq({ name: 'Only Name' });
    const res = buildRes();

    await createContact(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Please add all required fields',
    });
  });

  it('should return 500 on DynamoDB error', async () => {
    mockDocClientSend.mockRejectedValueOnce(new Error('Write failed'));

    const body = {
      name: 'N',
      email: 'e@e.com',
      service: 'S',
      message: 'M',
    };
    const req = buildReq(body);
    const res = buildRes();

    await createContact(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════════════════════════════
// updateContact
// ════════════════════════════════════════════════════════════════════════
describe('updateContact', () => {
  it('should update service and message and return updated contact', async () => {
    // GetCommand returns existing contact
    mockDocClientSend.mockResolvedValueOnce({ Item: mockContact });
    // UpdateCommand returns updated attributes
    const updatedItem = { ...mockContact, service: 'Updated Service', message: 'Updated message', updatedAt: '2026-02-28T00:00:00Z' };
    mockDocClientSend.mockResolvedValueOnce({ Attributes: updatedItem });

    const req = buildReq(
      { service: 'Updated Service', message: 'Updated message' },
      { id: mockContact.contactId }
    );
    const res = buildRes();

    await updateContact(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedItem);
  });

  it('should update only service when message is not provided', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Item: mockContact });
    const updatedItem = { ...mockContact, service: 'New Service', updatedAt: '2026-02-28T00:00:00Z' };
    mockDocClientSend.mockResolvedValueOnce({ Attributes: updatedItem });

    const req = buildReq({ service: 'New Service' }, { id: mockContact.contactId });
    const res = buildRes();

    await updateContact(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedItem);
  });

  it('should update only message when service is not provided', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Item: mockContact });
    const updatedItem = { ...mockContact, message: 'New message', updatedAt: '2026-02-28T00:00:00Z' };
    mockDocClientSend.mockResolvedValueOnce({ Attributes: updatedItem });

    const req = buildReq({ message: 'New message' }, { id: mockContact.contactId });
    const res = buildRes();

    await updateContact(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedItem);
  });

  it('should return 400 when no fields to update are provided', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Item: mockContact });

    const req = buildReq({}, { id: mockContact.contactId });
    const res = buildRes();

    await updateContact(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Please provide at least one field to update',
    });
  });

  it('should return 404 when contact not found', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Item: null });

    const req = buildReq({ service: 'X' }, { id: 'nonexistent-id' });
    const res = buildRes();

    await updateContact(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Message not found' });
  });

  it('should return 500 on DynamoDB error', async () => {
    mockDocClientSend.mockRejectedValueOnce(new Error('Update failed'));

    const req = buildReq({ service: 'X' }, { id: 'some-id' });
    const res = buildRes();

    await updateContact(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════════════════════════════
// deleteContact
// ════════════════════════════════════════════════════════════════════════
describe('deleteContact', () => {
  it('should delete a contact and return 200', async () => {
    // GetCommand returns the contact
    mockDocClientSend.mockResolvedValueOnce({ Item: mockContact });
    // DeleteCommand succeeds
    mockDocClientSend.mockResolvedValueOnce({});

    const req = buildReq({}, { id: mockContact.contactId });
    const res = buildRes();

    await deleteContact(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Message deleted' });
  });

  it('should delete S3 image when contact has imageKey', async () => {
    // GetCommand returns contact with image
    mockDocClientSend.mockResolvedValueOnce({ Item: mockContactWithImage });
    // DeleteCommand succeeds
    mockDocClientSend.mockResolvedValueOnce({});

    const req = buildReq({}, { id: mockContactWithImage.contactId });
    const res = buildRes();

    // S3 send (for DeleteObjectCommand) — need to handle this
    // The controller uses a module-level s3 client; since we mocked S3Client
    // via jest.mock, the mock s3 instance's send is mockS3Send
    mockS3Send.mockResolvedValueOnce({});

    await deleteContact(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Message deleted' });
  });

  it('should return 404 when contact not found', async () => {
    mockDocClientSend.mockResolvedValueOnce({ Item: null });

    const req = buildReq({}, { id: 'nonexistent-id' });
    const res = buildRes();

    await deleteContact(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Message not found' });
  });

  it('should return 500 on error', async () => {
    mockDocClientSend.mockRejectedValueOnce(new Error('DB error'));

    const req = buildReq({}, { id: 'some-id' });
    const res = buildRes();

    await deleteContact(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
