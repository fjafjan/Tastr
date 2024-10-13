import { Request, Response } from "express";
import {
  GetSelection,
  FindTastedItems,
  PerformVote,
} from "../database_utility";
import { v4 as uuidv4 } from "uuid";
import { SessionData } from "../models";

// Get the active session for a category and user
export const getActiveSession = async (req: Request, res: Response) => {
  const { categoryId, userId } = req.params;

  if (!categoryId || !userId) {
    return res.status(400).json({ message: "Invalid category or user ID." });
  }

  try {
    let sessionEntry = await SessionData.findOne({
      categoryId: categoryId,
      active: true,
    });

    // If no session found, create one
    if (!sessionEntry) {
      sessionEntry = await SessionData.create({
        sessionId: uuidv4(),
        categoryId: categoryId,
        hostId: userId,
        active: true,
      });
    }

    res.json(sessionEntry);
  } catch (error) {
    console.error("Error fetching session: ", error);
    res.status(500).json({ message: "Server error. Unable to fetch session." });
  }
};

// Add a user to a session
export const addUserToSession = async (req: Request, res: Response) => {
  const { sessionId, tasterId } = req.body;

  if (!sessionId || !tasterId) {
    return res.status(400).json({ message: "Invalid session or user ID." });
  }

  try {
    let sessionEntry = await SessionData.findOne({ sessionId: sessionId });

    if (!sessionEntry) {
      return res
        .status(404)
        .json({ message: `Session ${sessionId} not found.` });
    }

    if (sessionEntry.tasterIds.includes(tasterId)) {
      return res
        .status(403)
        .json({ message: `User ${tasterId} already in session.` });
    }

    sessionEntry.tasterIds = [...sessionEntry.tasterIds, tasterId];
    await sessionEntry.save();

    res.sendStatus(200);
  } catch (error) {
    console.error("Error adding user to session: ", error);
    res
      .status(500)
      .json({ message: "Server error. Unable to add user to session." });
  }
};

// Get the selection for a user
export const getSelection = async (req: Request, res: Response) => {
  const { categoryId, round, userId } = req.params;

  if (!categoryId || !round || !userId) {
    return res.status(400).json({ message: "Invalid parameters." });
  }

  try {
    const options = await GetSelection(categoryId, userId, parseInt(round));
    if (options) {
      res.json(options);
    } else {
      res.status(404).json({ message: "No selection found." });
    }
  } catch (error) {
    console.error("Error fetching selection: ", error);
    res
      .status(500)
      .json({ message: "Server error. Unable to fetch selection." });
  }
};

// Get tasted items for a user in a category
export const getTasted = async (req: Request, res: Response) => {
  const { categoryId, userId } = req.params;

  if (!categoryId || !userId) {
    return res.status(400).json({ message: "Invalid category or user ID." });
  }

  try {
    const result = await FindTastedItems(categoryId, userId);

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ message: "No tasted items found." });
    }
  } catch (error) {
    console.error("Error fetching tasted items: ", error);
    res
      .status(500)
      .json({ message: "Server error. Unable to fetch tasted items." });
  }
};

// Perform a vote
export const performVote = async (req: Request, res: Response) => {
  const { categoryId, winnerId, loserId } = req.params;
  const { userId } = req.body;

  if (!categoryId || !winnerId || !loserId || !userId) {
    return res.status(400).json({ message: "Invalid parameters." });
  }

  try {
    const result = await PerformVote(userId, categoryId, winnerId, loserId);

    if (result) {
      res.sendStatus(200);
    } else {
      res.status(500).json({ message: "Error performing vote." });
    }
  } catch (error) {
    console.error("Error performing vote: ", error);
    res.status(500).json({ message: "Server error. Unable to perform vote." });
  }
};
