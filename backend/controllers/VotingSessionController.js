const {
  GetSelection,
  FindTastedItems,
  PerformVote,
  GenerateSelections,
} = require("../DatabaseUtility");
const { SessionData } = require("../Models");

exports.getActiveSession = async (req, res) => {
  const { categoryId: categoryId, userId: userId } = req.params;
  // const { userId: userId } = req.body // TODO: Investigate why this does not work.
  console.log(`Requesting an active session for ${categoryId}`);
  try {
    let sessionEntry = await SessionData.findOne({
      categoryId: categoryId,
      active: true,
    });
    // If there is no such session, we create one.
    if (!sessionEntry) {
      console.log(
        `No active session with category ${categoryId}, will create new one.`
      );
      sessionEntry = await SessionData.create({
        sessionId: Math.random().toString(), // TODO Replace this with proper ID generation.
        categoryId: categoryId,
        hostId: userId, // TODO: If we have this structure...
        active: true,
      });
    }
    res.json(sessionEntry);
  } catch (error) {
    console.error("Failed to find active session with ", categoryId, error);
    res.sendStatus(500);
  }
};

exports.addUserToSession = async (req, res) => {
  console.log("Got request to add user to session.");
  const { sessionId: sessionId, tasterId: tasterId } = req.body;
  console.log(`Adding ${tasterId} to session ${sessionId}`);

  try {
    let sessionEntry = await SessionData.findOne({ sessionId: sessionId });
    if (!sessionEntry) {
      console.error(`No session with ID ${sessionId} found`);
      res.sendStatus(404);
      return;
    }
    if (sessionEntry.tasterIds.includes(tasterId)) {
      console.error(`User ${userId} already exists in session ${sessionId}`);
      res.sendStatus(403);
    }
    sessionEntry.tasterIds.push(tasterId);
    sessionEntry.save();
    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to add taster to session due to ", error);
    res.sendStatus(500);
  }
};

exports.getSelection = async (req, res) => {
  const { categoryId, round, userId } = req.params;
  console.log(
    `Requesting vote selection for ${categoryId} round ${round} from user ${userId}`
  );
  // We could potentially just check the current round here?
  options = await GetSelection(categoryId, userId, round);
  if (options) {
    res.json(options);
  } else {
    res.sendStatus(404);
  }
};

exports.getTasted = async (req, res) => {
  const { categoryId: categoryId, userId: userId } = req.params;
  console.log(`Getting the votes in ${categoryId} for ${userId}`);
  const result = await FindTastedItems(categoryId, userId);

  if (result) {
    console.log("Returning tasted map:", result);
    res.json(result);
  } else {
    res.sendStatus(500);
  }
};

// this function is broken now because we are explicitly calling io here. But I think that makes sense? We
// don't really want the server to be doing that many different things....
exports.performVote = async (req, res) => {
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
