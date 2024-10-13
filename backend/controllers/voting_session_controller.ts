import { Request, Response } from "express";
import {
  GetSelection,
  FindTastedItems,
  PerformVote,
} from "../database_utility";
import { SessionData } from "../models";

// Get the active session for a category and user
export const getActiveSession = async (req: Request, res: Response) => {
  const { categoryId, userId } = req.params;
  console.log(`Requesting an active session for ${categoryId}`);

  try {
    let sessionEntry = await SessionData.findOne({
      categoryId: categoryId,
      active: true,
    });

    // If there is no such session, create one
    if (!sessionEntry) {
      console.log(
        `No active session with category ${categoryId}, will create new one.`
      );
      sessionEntry = await SessionData.create({
        sessionId: Math.random().toString(), // TODO: Replace with proper ID generation
        categoryId: categoryId,
        hostId: userId, // TODO: Validate host ID
        active: true,
      });
    }

    res.json(sessionEntry);
  } catch (error) {
    console.error("Failed to find active session with ", categoryId, error);
    res.sendStatus(500);
  }
};

// Add a user to a session
export const addUserToSession = async (req: Request, res: Response) => {
  console.log("Got request to add user to session.");
  const { sessionId, tasterId } = req.body;
  console.log(`Adding ${tasterId} to session ${sessionId}`);

  try {
    let sessionEntry = await SessionData.findOne({ sessionId: sessionId });

    if (!sessionEntry) {
      console.error(`No session with ID ${sessionId} found`);
      res.sendStatus(404);
      return;
    }

    if (sessionEntry.tasterIds.includes(tasterId)) {
      console.error(`User ${tasterId} already exists in session ${sessionId}`);
      res.sendStatus(403);
      return;
    }

    sessionEntry.tasterIds.push(tasterId);
    await sessionEntry.save();

    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to add taster to session due to ", error);
    res.sendStatus(500);
  }
};

// Get the selection for a user
export const getSelection = async (req: Request, res: Response) => {
  const { categoryId, round, userId } = req.params;
  console.log(
    `Requesting vote selection for ${categoryId} round ${round} from user ${userId}`
  );

  const options = await GetSelection(categoryId, userId, parseInt(round));

  if (options) {
    res.json(options);
  } else {
    res.sendStatus(404);
  }
};

// Get the tasted items for a user in a category
export const getTasted = async (req: Request, res: Response) => {
  const { categoryId, userId } = req.params;
  console.log(`Getting the votes in ${categoryId} for ${userId}`);

  const result = await FindTastedItems(categoryId, userId);

  if (result) {
    console.log("Returning tasted map:", result);
    res.json(result);
  } else {
    res.sendStatus(500);
  }
};

// Perform a vote
export const performVote = async (req: Request, res: Response) => {
  const { categoryId, winnerId, loserId } = req.params;
  const { userId } = req.body;
  console.log(
    `Got vote for ${winnerId} over ${loserId} in Session ${categoryId}`
  );

  const result = await PerformVote(userId, categoryId, winnerId, loserId);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
};
