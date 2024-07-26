const { GetSelection, FindTastedItems, PerformVote, GenerateSelections } = require("../DatabaseUtility")
const { SessionData } = require("../Models")

exports.getSelection = async (req, res) => {
  const { categoryId, round, userId } = req.params
  console.log(`Requesting vote selection for ${categoryId} round ${round} from user ${userId}`)
  // We could potentially just check the current round here?
  options = await GetSelection(categoryId, userId, round)
  if (options) {
    res.json(options)
  } else {
    res.sendStatus(404)
  }
}

exports.getTasted = async (req, res) => {
  const { categoryId: categoryId, userId: userId } = req.params
  console.log(`Getting the votes in ${categoryId} for ${userId}`)
  const result = await FindTastedItems(categoryId, userId)

  if (result) {
    console.log("Returning tasted map:", result)
    res.json(result)
  } else {
    res.sendStatus(500)
  }
}

// this function is broken now because we are explicitly calling io here. But I think that makes sense? We
// don't really want the server to be doing that many different things....
exports.performVote = async (req, res) => {
  const { categoryId, winnerId, loserId} = req.params
  const { userId } = req.body
  console.log(`Got vote for ${winnerId} over ${loserId} in Session ${categoryId}`)

  const result = await PerformVote(userId, categoryId, winnerId, loserId)

  if (result) {
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
}