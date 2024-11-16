// Import the necessary models and utilities with types.
import {
  FoodCategoryData,
  VoteData,
  SessionData,
  SelectionData,
  IFoodCategory,
} from "./models";
import { GenerateMatchups, Judge } from "./selection_utility";

// Constants defining how quickly the ELO changes.
const s = 400;
const K = 32;

// Type for food objects
type FoodObject = {
  id: string;
  name: string;
  alias: string;
  MMR: number;
};

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

// Create a new session
async function CreateSession(
  sessionId: string,
  categoryId: string,
  hostId: string,
  tasterIds: string[]
): Promise<boolean> {
  try {
    await SessionData.findOneAndUpdate(
      { sessionId, categoryId, hostId, tasterIds },
      { upsert: true, new: true }
    );
    return true;
  } catch (error) {
    console.error("Failed to create new session data due to", error);
    return false;
  }
}

// Generate selections for the voting session
async function GenerateSelections(
  categoryId: string,
  userIds: string[],
  round: number
): Promise<boolean> {
  const categoryEntry = await TryFindCategory(categoryId);
  if (!categoryEntry) {
    console.error("Failed to find category with ID ", categoryId);
    return false;
  }

  const foodItemsDictionary: Record<string, string> =
    categoryEntry.foodObjects.reduce(
      (acc: Record<string, string>, item: FoodObject) => {
        acc[item.id] = item.name;
        return acc;
      },
      {}
    );

  const promises = userIds.map((userId) => FindTastedItems(categoryId, userId));
  const userHistory = await Promise.all(promises);

  // Filter out any false values from userHistory
  const validUserHistory = userHistory.filter(
    (result): result is Judge => result !== false
  );

  const selections = GenerateMatchups(
    Object.keys(foodItemsDictionary),
    validUserHistory
  );

  try {
    const userSelectionPromises = Object.keys(selections).map(
      async (userId) => {
        await SelectionData.create({
          categoryId,
          round,
          tasterId: userId,
          choice: {
            foodIdA: selections[userId].itemA,
            foodIdB: selections[userId].itemB,
          },
        });
      }
    );
    await Promise.all(userSelectionPromises);
    console.log(
      `Generated selections for category ${categoryId} round ${round}`
    );
    return true;
  } catch (error) {
    console.error("Failed to create selection data due to ", selections, error);
    return false;
  }
}

// Get a selection for a user
async function GetSelection(
  categoryId: string,
  userId: string,
  round: number
): Promise<{ foodIdA: string; foodIdB: string } | false> {
  try {
    const entry = await SelectionData.findOne({
      categoryId,
      tasterId: userId,
      round: parseInt(String(round), 10),
    }).exec();
    if (!entry) {
      console.error(
        `Failed to find selection in category ${categoryId} for user ${userId} round ${round}`
      );
      return false;
    }
    return { foodIdA: entry.choice.foodIdA, foodIdB: entry.choice.foodIdB };
  } catch (error) {
    console.error("Error when getting selection data", error);
    return false;
  }
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

// Find tasted items for a user
async function FindTastedItems(
  categoryId: string,
  userId: string
): Promise<Judge | false> {
  console.log(`Generating taste-map for ${categoryId} and user ${userId}`);

  try {
    const foodVotes = await VoteData.find({ categoryId, userId })
      .select(["winnerId", "loserId"])
      .exec();
    if (!foodVotes) {
      console.error(
        "Failed to find any votes in category with user",
        categoryId,
        userId
      );
      return false;
    }

    const categoryEntry = await TryFindCategory(categoryId);
    if (!categoryEntry) {
      return false;
    }

    const tasted: Record<string, number> = {};
    categoryEntry.foodObjects.forEach((item) => (tasted[item.id] = 0));

    foodVotes.forEach((item) => {
      tasted[item.winnerId] += 1;
      tasted[item.loserId] += 1;
    });
    return { userId, tasted };
  } catch (error) {
    console.error("Failed to generate taste map due to", error);
    return false;
  }
}

// Find a category by ID
async function TryFindCategory(
  categoryId: string
): Promise<IFoodCategory | false> {
  try {
    const categoryEntry = await FoodCategoryData.findOne({ categoryId }).exec();
    if (!categoryEntry) {
      console.error("No category with ID ", categoryId);
      return false;
    }
    return categoryEntry;
  } catch (error) {
    console.error(`Failed to find category with ${categoryId} due to `, error);
    return false;
  }
}

export {
  FoodObject,
  CreateSession,
  GenerateSelections,
  GetSelection,
  PerformVote,
  FindTastedItems,
};
