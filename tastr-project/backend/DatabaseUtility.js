const { FoodCategoryData, VoteData, SessionData, SelectionData } = require('./Models')
const { GenerateMatchups } = require('./SelectionUtility')

// Constants defining how quickly the ELO changes.
const s = 400
const K = 32
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö']

function sigma(r) {
  const exponent = -r/s
  return 1./(1 + Math.pow(10, exponent))
}

// Computes the ELO after a and b play.
function elo_change(winner_elo, loser_elo)
{
  rho = winner_elo - loser_elo
  likelihood = sigma(-rho)
  winner_after = winner_elo + (likelihood * K) // For some reason using + converts the results to a string...
  loser_after = loser_elo - likelihood * K
  return { winnerAfter: winner_after, loserAfter: loser_after }
}


async function CreateCategory(categoryId, foodNames) {
  try {
    // Shuffle the letters.
    const selection = letters.slice(0, Object.keys(foodNames).length)
    const shuffled = selection.sort(() => 0.5 - Math.random())

    const foodObjects = Object.keys(foodNames).map((key, index) => ({
      id: key,
      name: foodNames[key],
      alias: shuffled[index],
      MMR: 1000, // Default MMR
    }))
    await FoodCategoryData.findOneAndUpdate(
      {categoryId: categoryId},
      { $set : { foodObjects: foodObjects} },
      { upsert: true, new: true}
    );
    return true
  } catch(error) {
    console.error("Failed to save new data due to ", error)
    return false
  }
}

async function CreateSession(categoryId, hostId, tasterIds)
{
  try {
    await SessionData.create({
      categoryId: categoryId,
      hostId: hostId,
      sessionId: Math.random().toString(),
      tasterIds: tasterIds
    })
  } catch(error) {
    console.error("Failed to create new session data due to", error)
    return false
  }
  return true
}

async function GenerateSelections(categoryId, userIds, round)
{
  const categoryEntry = await FoodCategoryData.findOne({categoryId: categoryId})
  if (!categoryEntry) {
    console.error("Failed to find category with ID ", categoryId)
    return false
  }
  const foodItemsDictionary = categoryEntry.foodObjects.reduce((acc, item) => {
    acc[item.id] = item.name
    return acc;
  }, {});

  const promises  =  userIds.map(userId => FindTastedItems(categoryId, userId))
  const userHistory = await Promise.all(promises)
  const selections = await GenerateMatchups(Object.keys(foodItemsDictionary), userHistory)

  await selections.map(async selection => {
    await SelectionData.create({
      categoryId: categoryId,
      round: round,
      tasterId: userIds,
      choice: {itemA: selection.itemA, itemB: selection.itemB},
    })
  })
}

async function GetSelection(categoryId, userId, round)
{
  try {
    const entry = await SelectionData.findOne({
      categoryId: categoryId,
      tasterId: userId,
      round: round,
    })
    if (!entry) {
      console.error(`Failed to find selection in category ${categoryId} for user ${userId} round ${round}`)
      return false
    }
    // TODO Should return the selection here instead of true or false, and should
    return { firstOption: entry.choice.foodIdA, secondOption: entry.choice.foodIdB }
  } catch(error) {
    console.error("Error when getting selection data")
    return false
  }
}

async function PerformVote(userId, categoryId, winnerId, loserId) {
  console.log(`Got vote from ${userId} for ${winnerId} over ${loserId} in Session ${categoryId}`)

  await VoteData.create({
    voteId: Math.random().toString(), // TODO: Just use the default ID instead?
    userId: userId,
    categoryId: categoryId,
    winnerId: winnerId,
    loserId: loserId
  })

  const categoryEntry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
  if (!categoryEntry) {
    console.error("Failed to find category with ID ", categoryId)
    return false
  }

  const winnerEntry = categoryEntry.foodObjects.find(food => food.id === winnerId)
  const loserEntry = categoryEntry.foodObjects.find(food => food.id === loserId)
  if (typeof(winnerEntry) === "undefined" || typeof(loserEntry) === "undefined") {
    console.error(`Missing entry with id ${loserId} or ${winnerId}`)
    return false
  }

  // Update the MMR.
  ({ winnerAfter: winnerEntry.MMR, loserAfter: loserEntry.MMR } = elo_change(winnerEntry.MMR, loserEntry.MMR))
  console.log(`After vote, MMR for winner: ${winnerEntry.MMR}, loser: ${loserEntry.MMR}`)
  categoryEntry.save()
  return true
}

// Get the number of times a user has tasted each food item.
async function FindTastedItems(categoryId, userId)
{
  console.log(`Computing MMR for ${categoryId} in ${userId}`)

  const foodVotes = await VoteData.find(
    {
      categoryId: categoryId,
      userId: userId
    }
  ).select(['winnerId', 'loserId'])
  if (!foodVotes) {
    console.error("Failed to find any votes in category with user", categoryId, userId)
    return false
  }

  const categoryEntry = await FoodCategoryData.findOne({categoryId: categoryId})
  if (!categoryEntry) {
    console.error("Failed to find category with ID ", categoryId)
    return false
  }

  // We will return a dictionary mapping food ID to the number of times this user has tasted it.
  const tasted = {}
  // Initialize all food IDs to 0
  categoryEntry.foodObjects.forEach(item => tasted[item.id] = 0)

  // Increment once for each win or loss.
  foodVotes.forEach(item => {
    tasted[item.winnerId] = tasted[item.winnerId] + 1
    tasted[item.loserId] = tasted[item.loserId] + 1
  })
  return {userId: userId, tasted: tasted}
}

module.exports = { CreateCategory, CreateSession, GenerateSelections, PerformVote, FindTastedItems}