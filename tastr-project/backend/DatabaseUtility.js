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

async function CreateSession(sessionId, categoryId, hostId, tasterIds)
{
  try {
    await SessionData.findOneAndUpdate(
      {
        sessionId: sessionId,
        categoryId: categoryId,
        hostId: hostId,
        tasterIds: tasterIds
      },
      { upsert: true, new: true}
    );
  } catch(error) {
    console.error("Failed to create new session data due to", error)
    return false
  }
  return true
}

async function GenerateSelections(categoryId, userIds, round)
{
  const categoryEntry = await TryFindCategory(categoryId)
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
  const selections = GenerateMatchups(Object.keys(foodItemsDictionary), userHistory)

  try {
    let userSelectionPromises = Object.keys(selections).map(async userId => {
      await SelectionData.create({
        categoryId: categoryId,
        round: round,
        tasterId: userId,
        choice: {foodIdA: selections[userId].itemA, foodIdB: selections[userId].itemB},
      })
    })
    await Promise.all(userSelectionPromises)
  } catch(error) {
    console.error("Failed to create selection data from due to ", selections, error)
    return false
  }
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
    return { foodIdA: entry.choice.foodIdA, foodIdB: entry.choice.foodIdB }
  } catch(error) {
    console.error("Error when getting selection data", error)
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

  const categoryEntry = await TryFindCategory(categoryId)
  if (!categoryEntry) {
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
  console.log(`Generating taste-map for ${categoryId} and user ${userId}`)

  try {
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

    const categoryEntry = await TryFindCategory(categoryId)
    if (!categoryEntry) {
      return false
    }

    // We will return a dictionary mapping food ID to the number of times this user has tasted it.
    let tasted = {}
    // Initialize all food IDs to 0
    categoryEntry.foodObjects.forEach(item => tasted[item.id] = 0)

    // Increment once for each win or loss.
    foodVotes.forEach(item => {
      tasted[item.winnerId] = tasted[item.winnerId] + 1
      tasted[item.loserId] = tasted[item.loserId] + 1
    })
    return {userId: userId, tasted: tasted}
  } catch (error) {
    console.error("Failed to generate taste map due to", error)
    return false
  }
}

async function TryFindCategory(categoryId) {
  try {
    let categoryEntry = await FoodCategoryData.findOne({categoryId: categoryId})
    if (!categoryEntry) {
      console.error("No category with ID ", categoryId)
      return false
    }
    return categoryEntry
  } catch (error) {
    console.error(`Failed to find category with ${categoryId} due to `, error)
    return false
  }
}

module.exports = { CreateCategory, CreateSession, GenerateSelections, GetSelection, PerformVote, FindTastedItems}