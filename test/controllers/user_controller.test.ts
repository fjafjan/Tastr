import { addUser } from '../../backend/controllers/user_controller'; // Adjust the import as needed
import { Request, Response } from 'express';
import { UserData } from '../../backend/models';
import { connect, closeDatabase, clearDatabase } from '../jest-mongodb-setup';

beforeAll(async () => {
  await connect(); // Set up connection before tests
});

afterEach(async () => {
  await clearDatabase(); // Clear data between tests
});

afterAll(async () => {
  await closeDatabase(); // Clean up after all tests
});

function createMockRequest(body: any): Request {
  return {
    body,
  } as Request;
}

function createMockResponse(): Response {
  return {
    sendStatus: jest.fn(),
  } as any as Response;
}

describe('UserController - addUser', () => {
  test('should add a new user and update the database', async () => {
    const mockRequest = createMockRequest({
      userId: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
    });

    const mockResponse = createMockResponse();

    await addUser(mockRequest, mockResponse);

    // Check if sendStatus was called with 200
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);

    // Check the database to verify the user was added
    const addedUser = await UserData.findOne({ userId: 'user123' });
    expect(addedUser).not.toBeNull();
    expect(addedUser?.name).toBe('John Doe');
    expect(addedUser?.email?.email).toBe('john@example.com');
  });

  test('should update an existing user and modify the database', async () => {
    // Pre-populate the database with an existing user
    const existingUser = new UserData({
      userId: 'existingUser',
      name: 'Old Name',
      email: { email: 'old@example.com' },
    });
    await existingUser.save();

    const mockRequest = createMockRequest({
      userId: 'existingUser',
      name: 'Jane Smith',
      email: 'jane@example.com',
    });

    const mockResponse = createMockResponse();

    await addUser(mockRequest, mockResponse);

    // Check if sendStatus was called with 200
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);

    // Check the database to verify the user was updated
    const updatedUser = await UserData.findOne({ userId: 'existingUser' });
    expect(updatedUser).not.toBeNull();
    expect(updatedUser?.name).toBe('Jane Smith');
    expect(updatedUser?.email?.email).toBe('jane@example.com');
  });

  test('should return 404 and not modify the database on error', async () => {
    const mockRequest = createMockRequest({
      userId: 'errorUser',
      name: 'Error User',
      email: 'error@example.com',
    });

    const mockResponse = createMockResponse();

    // Simulate a database error
    jest
      .spyOn(UserData, 'findOneAndUpdate')
      .mockRejectedValueOnce(new Error('DB Error'));

    await addUser(mockRequest, mockResponse);

    // Check if sendStatus was called with 404
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(404);

    // Ensure that no user was added to the database
    const userInDb = await UserData.findOne({ userId: 'errorUser' });
    expect(userInDb).toBeNull();
  });
});
