import {
    IVote,
    VoteData
} from "../models";
import { TryFindCategory } from "./category";

// Constants defining how quickly the ELO changes.
const s = 400;
const K = 32;

// Helper function to calculate ELO change
function sigma(r: number): number {
    const exponent = -r / s;
    return 1 / (1 + Math.pow(10, exponent));
  }

  function elo_change(
    winner_elo: number,
    loser_elo: number
  ): { winnerAfter: number; loserAfter: number } {
    const rho = winner_elo - loser_elo;
    const likelihood = sigma(-rho);
    const winner_after = winner_elo + likelihood * K;
    const loser_after = loser_elo - likelihood * K;
    return { winnerAfter: winner_after, loserAfter: loser_after };
  }

// Finds all votes for a user in a certain category.
async function GetUserVotes(categoryId: string, userId: string) : Promise<IVote[]>
{
    const foodVotes = await VoteData.find({ categoryId, userId })
      .select(["winnerId", "loserId"])
      .exec();
    if (!foodVotes) {
      throw new Error(`Failed to find any votes in category with user ${userId} in category ${categoryId}`);
    }
    return foodVotes
}

// Perform a vote in the session
async function PerformVote(
    userId: string,
    categoryId: string,
    winnerId: string,
    loserId: string
  ): Promise<boolean> {
    console.log(
      `Got vote from ${userId} for ${winnerId} over ${loserId} in Session ${categoryId}`
    );

    await VoteData.create({
      voteId: Math.random().toString(),
      userId,
      categoryId,
      winnerId,
      loserId,
    });

    const categoryEntry = await TryFindCategory(categoryId);
    if (!categoryEntry) {
      return false;
    }

    const winnerEntry = categoryEntry.foodObjects.find(
      (food) => food.id === winnerId
    );
    const loserEntry = categoryEntry.foodObjects.find(
      (food) => food.id === loserId
    );
    if (!winnerEntry || !loserEntry) {
      console.error(`Missing entry with id ${loserId} or ${winnerId}`);
      return false;
    }

    ({ winnerAfter: winnerEntry.MMR, loserAfter: loserEntry.MMR } = elo_change(
      winnerEntry.MMR,
      loserEntry.MMR
    ));
    await categoryEntry.save();
    return true;
  }

export {
    GetUserVotes,
    PerformVote
};

