import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { GetUserTastedItems } from '../core/category';
import { GetSelection } from '../core/selection';
import { PerformVote } from '../core/voting';
import { ISession, SessionData, VoteData } from '../models';

export const getSession = async (
  sessionId: string,
): Promise<ISession | null> => {
  const sessionEntry = await SessionData.findOne({ sessionId: sessionId });
  return sessionEntry;
};

export const getActiveSession = async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }

  try {
    const sessionEntry = await SessionData.findOne({
      categoryId: categoryId,
      active: true,
    }).exec();

    // If no session found, create one
    if (!sessionEntry) {
      return res
        .status(400)
        .json({ message: `No session with Category ID ${categoryId} found.` });
    }

    res.json(sessionEntry);
  } catch (error) {
    console.error('Error fetching session: ', error);
    return res
      .status(500)
      .json({ message: 'Server error. Unable to fetch session.' });
  }
};

// Get the active session for a category and user
export const getOrCreateActiveSession = async (req: Request, res: Response) => {
  const { categoryId, userId } = req.params;

  if (!categoryId || !userId) {
    return res.status(400).json({ message: 'Invalid category or user ID.' });
  }

  try {
    const sessionEntry = await SessionData.findOne({
      categoryId: categoryId,
      active: true,
    });

    if (sessionEntry) {
      res.json(sessionEntry);
    } else {
      const newEntry = await new SessionData({
        sessionId: uuidv4(),
        categoryId: categoryId,
        hostId: userId,
        active: true,
        tasterIds: [],
      }).save();
      res.json(newEntry);
    }
  } catch (error) {
    console.error('Error fetching session: ', error);
    res.status(500).json({ message: 'Server error. Unable to fetch session.' });
  }
};

export const isSessionRunning = async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    return res.status(400).json({ message: 'Missing category ID' });
  }

  try {
    const sessionEntry = await SessionData.findOne({
      categoryId: categoryId,
      active: true,
    }).exec();

    // If no session found, create one
    if (sessionEntry && sessionEntry.round !== 0) {
      res.json({ running: true });
    } else {
      res.json({ running: false });
    }
  } catch (error) {
    console.error('Error fetching session status: ', error);
    res.status(500).json({ message: 'Server error. Unable to fetch session.' });
  }
};

// Add a user to a session
export const addUserToSession = async (req: Request, res: Response) => {
  const { sessionId, tasterId } = req.body;

  if (!sessionId || !tasterId) {
    return res.status(400).json({ message: 'Invalid session or user ID.' });
  }
  console.log(`Adding user ${tasterId} to session ${sessionId}`);
  try {
    const sessionEntry = await SessionData.findOne({
      sessionId: sessionId,
    });
    if (!sessionEntry) {
      console.error('Could not find session user wanted to be added to');
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
    console.error('Error adding user to session: ', error);
    res
      .status(500)
      .json({ message: 'Server error. Unable to add user to session.' });
  }
};

// Get the selection for a user
export const getSelection = async (req: Request, res: Response) => {
  const { categoryId, userId } = req.params;

  if (!categoryId || !userId) {
    return res.status(400).json({ message: 'Invalid parameters.' });
  }

  try {
    const options = await GetSelection(categoryId, userId);
    if (options) {
      res.json(options);
    } else {
      res.status(404).json({ message: 'No selection found.' });
    }
  } catch (error) {
    console.error('Error fetching selection: ', error);
    res
      .status(500)
      .json({ message: 'Server error. Unable to fetch selection.' });
  }
};

// Get tasted items for a user in a category
export const getTasted = async (req: Request, res: Response) => {
  const { categoryId, userId } = req.params;

  if (!categoryId || !userId) {
    return res.status(400).json({ message: 'Invalid category or user ID.' });
  }

  try {
    const result = await GetUserTastedItems(categoryId, userId);

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ message: 'No tasted items found.' });
    }
  } catch (error) {
    console.error('Error fetching tasted items: ', error);
    res
      .status(500)
      .json({ message: 'Server error. Unable to fetch tasted items.' });
  }
};

// Perform a vote
export const performVote = async (
  req: Request,
  res: Response,
  lastVoteCallback: (sessionId: string, categoryId: string) => Promise<void>,
) => {
  const { categoryId, round: roundStr, winnerId, loserId } = req.params;
  const { userId, sessionId } = req.body;

  if (!categoryId || !roundStr || !winnerId || !loserId || !userId) {
    return res.status(400).json({ message: 'Invalid parameters.' });
  }
  const round = parseInt(roundStr);
  try {
    const result = await PerformVote(
      categoryId,
      userId,
      sessionId,
      round,
      winnerId,
      loserId,
    );

    if (result) {
      const remainingRoundVotes = await CountRemainingVotes(sessionId, round);
      if (remainingRoundVotes == 0) {
        await lastVoteCallback(sessionId, categoryId);
      }

      res.sendStatus(200);
    } else {
      res.status(500).json({ message: 'Error performing vote.' });
    }
  } catch (error) {
    console.error('Error performing vote: ', error);
    res.status(500).json({ message: 'Server error. Unable to perform vote.' });
  }
};

const CountRemainingVotes = async (
  sessionId: string,
  round: number,
): Promise<number> => {
  const votes = await VoteData.find({
    sessionId: sessionId,
    round: round,
    winnerId: '-1',
    loserId: '-1',
  });
  // This is not right at all!  we want to count the votes where winner and loser and both -1
  return votes.length;
};
