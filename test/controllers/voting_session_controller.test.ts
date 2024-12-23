import { Request, Response } from "express";
import {
  addUserToSession,
  getOrCreateActiveSession,
  getSelection,
  getTasted,
  performVote,
} from "../../backend/controllers/voting_session_controller"; // Adjust import as needed
// Mock these imports
import { v4 as uuidv4 } from "uuid"; // For uuid generation
import { FindTastedItems } from "../../backend/core/category";
import { GetSelection } from "../../backend/core/selection";
import { PerformVote } from "../../backend/core/voting";
import { SessionData } from "../../backend/models"; // Your Mongoose model
import { clearDatabase, closeDatabase, connect } from "../jest-mongodb-setup";

jest.mock("uuid");
jest.mock("../../backend/core/category");
jest.mock("../../backend/core/selection");
jest.mock("../../backend/core/voting");

const mockedUuidv4 = uuidv4 as jest.Mock;
const mockedGetSelection = GetSelection as jest.Mock;
const mockedFindTastedItems = FindTastedItems as jest.Mock;
const mockedPerformVote = PerformVote as jest.Mock;

beforeAll(async () => {
  await connect(); // Set up the database before tests
});

beforeEach(async () => {
  await SessionData.create({
    sessionId: "existing-session",
    categoryId: "test-category",
    hostId: "host-user",
    tasterIds: ["taster1"],
    active: true,
  });
});

afterAll(async () => {
  await closeDatabase(); // Clean up after all tests
});

afterEach(async () => {
  await clearDatabase(); // Clear data between tests
});

// Helper function to mock responses
function GetMockResponse(): Response {
  return {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
    sendStatus: jest.fn(),
  } as any as Response;
}

function createMockRequest(params: any, body: any): Request {
  return {
    params,
    body,
  } as any as Request;
}

function createMockResponse(): Response {
  return {
    sendStatus: jest.fn(),
  } as any as Response;
}

describe("VotingSessionController", () => {
  describe("getOrCreateActiveSession", () => {
    test("should return an existing active session", async () => {
      const req = createMockRequest(
        {
          categoryId: "test-category",
          userId: "user1",
        },
        {}
      );

      const res = GetMockResponse();

      await getOrCreateActiveSession(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "existing-session" })
      );
    });

    test("should create a new session if none exists", async () => {
      mockedUuidv4.mockReturnValue("new-session-id");
      const req = createMockRequest(
        {
          categoryId: "new-category",
          userId: "new-host",
        },
        {}
      );

      const res = GetMockResponse();

      await getOrCreateActiveSession(req, res);

      const session = await SessionData.findOne({
        categoryId: "new-category",
        active: true,
      });

      expect(session).toBeTruthy();
      expect(session?.sessionId).toBe("new-session-id");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "new-session-id" })
      );
    });

    test("should return 400 for invalid parameters", async () => {
      const req = { params: {} } as Request; // No params
      const res = GetMockResponse();

      await getOrCreateActiveSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid category or user ID.",
      });
    });
  });

  describe("addUserToSession", () => {
    test("should add a user to an existing session", async () => {
      const req = {
        body: { sessionId: "existing-session", tasterId: "taster2" },
      } as Request;
      const res = GetMockResponse();

      await addUserToSession(req, res);

      const session = await SessionData.findOne({
        sessionId: "existing-session",
      });
      expect(session?.tasterIds).toContain("taster2");
      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    test("should return 403 if the user is already in the session", async () => {
      const req = {
        body: { sessionId: "existing-session", tasterId: "taster1" }, // Already present
      } as Request;
      const res = GetMockResponse();

      await addUserToSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "User taster1 already in session.",
      });
    });

    test("should return 404 if the session is not found", async () => {
      const req = {
        body: { sessionId: "non-existent-session", tasterId: "new-taster" },
      } as Request;
      const res = GetMockResponse();

      await addUserToSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Session non-existent-session not found.",
      });
    });
  });

  describe("getSelection", () => {
    test("should return the selection for a user", async () => {
      mockedGetSelection.mockResolvedValue({
        option1: "Pizza",
        option2: "Burger",
      });

      const req = createMockRequest(
        {
          categoryId: "test-category",
          round: "1",
          userId: "user1",
        },
        {}
      );
      const res = GetMockResponse();

      await getSelection(req, res);

      expect(res.json).toHaveBeenCalledWith({
        option1: "Pizza",
        option2: "Burger",
      });
    });

    test("should return 404 if no selection is found", async () => {
      mockedGetSelection.mockResolvedValue(null);

      const req = createMockRequest(
        {
          categoryId: "test-category",
          round: "1",
          userId: "user1",
        },
        {}
      );
      const res = GetMockResponse();

      await getSelection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No selection found." });
    });
  });

  describe("getTasted", () => {
    test("should return tasted items for a user", async () => {
      mockedFindTastedItems.mockResolvedValue({ "1": "Pizza", "2": "Burger" });

      const req = createMockRequest(
        {
          categoryId: "test-category",
          userId: "user1",
        },
        {}
      );
      const res = GetMockResponse();

      await getTasted(req, res);

      expect(res.json).toHaveBeenCalledWith({
        "1": "Pizza",
        "2": "Burger",
      });
    });

    test("should return 404 if no tasted items are found", async () => {
      mockedFindTastedItems.mockResolvedValue(null);

      const req = createMockRequest(
        {
          categoryId: "test-category",
          userId: "user1",
        },
        {}
      );
      const res = GetMockResponse();

      await getTasted(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No tasted items found.",
      });
    });
  });

  describe("performVote", () => {
    test("should perform a vote and return 200", async () => {
      mockedPerformVote.mockResolvedValue(true);

      const req = createMockRequest(
        {
          categoryId: "test-category",
          winnerId: "Pizza",
          loserId: "Burger",
        },
        { userId: "user1" }
      );
      const res = GetMockResponse();

      await performVote(req, res);

      expect(PerformVote).toHaveBeenCalledWith(
        "user1",
        "test-category",
        "Pizza",
        "Burger"
      );
      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    test("should return 500 if the vote fails", async () => {
      mockedPerformVote.mockResolvedValue(false);

      const req = createMockRequest(
        {
          categoryId: "test-category",
          winnerId: "Pizza",
          loserId: "Burger",
        },
        { userId: "user1" }
      );
      const res = GetMockResponse();

      await performVote(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error performing vote.",
      });
    });
  });
});
