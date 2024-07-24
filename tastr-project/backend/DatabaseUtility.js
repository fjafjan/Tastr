const { SessionData, VoteData } = require('./Models')

// Constants defining how quickly the ELO changes.
const s = 400
const K = 32
function sigma(r) {
  const exponent = -r/s
  return 1./(1 + Math.pow(10, exponent))
}

function expected_score(my_elo, opponent_elo) {
  exponent = (opponent_elo - my_elo) / s
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

async function PerformVote(userId, sessionId, winnerId, loserId) {
  console.log(`Got vote from ${userId} for ${winnerId} over ${loserId} in Session ${sessionId}`)

  await VoteData.create({
    voteId: Math.random().toString(), // TODO: Just use the default ID instead?
    userId: userId,
    sessionId: sessionId,
    winnerId: winnerId,
    loserId: loserId
  })

  const sessionEntry = await SessionData.findOne({ sessionId: sessionId }).exec()
  if (!sessionEntry) {
    console.error("Failed to find session ID ", sessionId)
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

async function GetMMR(sessionId, foodId) {
  console.log(`Computing MMR for ${foodId} in ${sessionId}`)

  const foodVotes = await VoteData.find(
    {
      $or:
      [
        {
          sessionId: sessionId,
          winnerId: foodId,
        },
        {
          sessionId: sessionId,
          loserId: foodId,
        }
      ]
    }
  )


}

module.exports = PerformVote


// export default DatabaseUtility