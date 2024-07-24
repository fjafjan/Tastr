const { FoodCategoryData, VoteData } = require('./Models')

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

async function PerformVote(userId, categoryId, winnerId, loserId) {
  console.log(`Got vote from ${userId} for ${winnerId} over ${loserId} in Session ${categoryId}`)

  await VoteData.create({
    voteId: Math.random().toString(), // TODO: Just use the default ID instead?
    userId: userId,
    categoryId: categoryId,
    winnerId: winnerId,
    loserId: loserId
  })

  const sessionEntry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
  if (!sessionEntry) {
    console.error("Failed to find category with ID ", categoryId)
    return false
  }

  const winnerEntry = sessionEntry.foodObjects.find(food => food.id === winnerId)
  const loserEntry = sessionEntry.foodObjects.find(food => food.id === loserId)
  if (typeof(winnerEntry) === "undefined" || typeof(loserEntry) === "undefined") {
    console.error(`Missing entry with id ${loserId} or ${winnerId}`)
    return false
  }

  // Update the MMR.
  ({ winnerAfter: winnerEntry.MMR, loserAfter: loserEntry.MMR } = elo_change(winnerEntry.MMR, loserEntry.MMR))
  console.log(`After vote, MMR for winner: ${winnerEntry.MMR}, loser: ${loserEntry.MMR}`)
  sessionEntry.save()
  return true
}

async function CreateSession(categoryId, foodNames) {
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
  return tasted
}

module.exports = { PerformVote, CreateSession, FindTastedItems}