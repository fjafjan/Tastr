// Import the necessary models and utilities with types.
import { v4 as uuidv4 } from 'uuid';
import { ISelection, SelectionData, SessionData, VoteData } from '../models';
import { GenerateMatchups, Judge } from '../selection_utility';
import {
  FoodObject,
  GetUserTastedItems,
  MmrMap,
  TryFindCategory,
} from './category';
import { win_likelyhood } from './voting';

// Generate selections for the voting session
async function GenerateSelections(
  categoryId: string,
  userIds: string[],
  round: number,
): Promise<boolean> {
  const categoryEntry = await TryFindCategory(categoryId);
  if (!categoryEntry) {
    console.error('Failed to find category with ID ', categoryId);
    return false;
  }

  const foodItemsDictionary: Record<string, string> =
    categoryEntry.foodObjects.reduce(
      (acc: Record<string, string>, item: FoodObject) => {
        acc[item.id] = item.name;
        return acc;
      },
      {},
    );

  const promises = userIds.map((userId) =>
    GetUserTastedItems(categoryId, userId),
  );
  const userHistory = await Promise.all(promises);

  // Filter out any false values from userHistory
  const validUserHistory = userHistory.filter(
    (result): result is Judge => result !== false,
  );

  const selections = GenerateMatchups(
    Object.keys(foodItemsDictionary),
    validUserHistory,
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
      },
    );
    await Promise.all(userSelectionPromises);
    console.log(
      `Generated selections for category ${categoryId} round ${round}`,
    );
    return true;
  } catch (error) {
    console.error('Failed to create selection data due to ', selections, error);
    return false;
  }
}

// Lets try to write a new way of generating selections.
// So what we want to use is not just based on previous selected, but use a generic
// scoring function for how interested the user would be in that matchup.
// 1) If they have tried either item before.
// 2) If the two items are of similar MMR.
// 3) The total MMRs of the items.

function HasTastedFunction(foodId: string, judge: Judge): number {
  const num_tasted: number = judge.tasted[foodId] ?? 0;
  const tasted_weight = 1.0;
  return Math.max(0, 3 - num_tasted) * tasted_weight;
}

function SimilarMmrFunction(
  foodIdA: string,
  foodIdB: string,
  mmrs: MmrMap,
): number {
  // We want a differet function here which reflects the fact that
  // the MMR is exponential.
  // Maybe we can just use the probability of one beating the other directly
  // here actually? So if it's close to 50/50 it's good, if it's tilted in either
  // direction it's bad.
  const likelyhood = win_likelyhood(mmrs[foodIdA] - mmrs[foodIdB]);
  // 0.5 represents equal likelyhood, so we want to find the distance from
  // this.
  const similarity_weight = 1.0;
  const normalized_likelyhood = 1 - Math.abs(0.5 - likelyhood) * 2;
  return normalized_likelyhood * similarity_weight;
}

function NormalizeMmrMap(mmrMap: MmrMap): MmrMap {
  const normalized_mmrs: MmrMap = {};

  const largest_element = Object.values(mmrMap).reduce((a, b) =>
    Math.max(a, b),
  );
  Object.keys(mmrMap).forEach(
    (item) => (normalized_mmrs[item] = mmrMap[item] / largest_element),
  );
  return normalized_mmrs;
}

// TODO: I think for now this function not produce a sufficiently large difference.
function HighMmrFunction(foodIdA: string, foodIdB: string, mmrs: MmrMap) {
  // Ignore this for now and get some sample data to check if the other functions return reasonable values.
  // So the idea now is to look at the normalized MMRs
  const normalized_mmrs = NormalizeMmrMap(mmrs);
  const high_mmr_weight = 0.5; // Start by down-weighing this.
  // We should probably not normalize the map in the sense of
  // integrating to 1, but in the sense of the largest element being 1.
  const high_rank_score =
    (normalized_mmrs[foodIdA] + normalized_mmrs[foodIdB]) / 2;
  return high_rank_score * high_mmr_weight;
}

function SelectionScore(
  foodIdA: string,
  foodIdB: string,
  judge: Judge,
  mmrs: MmrMap,
): number {
  // TODO: Maybe we should pass the round number here to also weigh up high MMR, and down-weigh tasting.
  //       might be a more stable solution.
  let total_score = 0;
  total_score += HasTastedFunction(foodIdA, judge);
  total_score += HasTastedFunction(foodIdB, judge);
  total_score += SimilarMmrFunction(foodIdA, foodIdB, mmrs);
  total_score += HighMmrFunction(foodIdA, foodIdB, mmrs);
  return total_score;
}

const generateNewSelection = async (
  categoryId: string,
  userId: string,
  round: number,
): Promise<ISelection | false> => {
  const generatedEntry = await GenerateSelections(categoryId, [userId], round);
  if (!generatedEntry) {
    console.error(
      `Failed to find selection in category ${categoryId} for user ${userId}`,
    );
    return false;
  }
  const entry = await SelectionData.findOne({
    categoryId,
    tasterId: userId,
    round: round,
  }).exec();
  return entry ?? false;
};

const GenerateEmptyVote = async (
  categoryId: string,
  userId: string,
  sessionId: string,
  round: number,
) => {
  const voteEntry = await VoteData.findOne({
    categoryId: categoryId,
    userId: userId,
    round: round,
  });
  if (!voteEntry) {
    await new VoteData({
      voteId: uuidv4(),
      userId: userId,
      categoryId: categoryId,
      sessionId: sessionId,
      round: round,
      winnerId: '-1',
      loserId: '-1',
    }).save();
  }
};

// Get a selection for a user
async function GetSelection(
  categoryId: string,
  userId: string,
): Promise<{ round: number; foodIdA: string; foodIdB: string } | false> {
  try {
    const sessionEntry = await SessionData.findOne({
      categoryId: categoryId,
      active: true,
    }).exec();

    // TOOD: Check if there is a better way of managing th  e session here...
    if (!sessionEntry) {
      console.error(`No session found for category ${categoryId}`);
      return false;
    }

    // When asked for a selection we create a corresponding vote that has not yet been filled yet.
    await GenerateEmptyVote(
      categoryId,
      userId,
      sessionEntry.sessionId,
      sessionEntry.round,
    );

    const entry = await SelectionData.findOne({
      categoryId,
      tasterId: userId,
      round: sessionEntry.round,
    }).exec();
    if (!entry) {
      console.log(
        `Could not find selection in category ${categoryId} for user ${userId}, generating new`,
      );
      const newEntry = await generateNewSelection(
        categoryId,
        userId,
        sessionEntry.round,
      );
      if (!newEntry) {
        return false;
      }
      return {
        round: sessionEntry.round,
        foodIdA: newEntry.choice.foodIdA,
        foodIdB: newEntry.choice.foodIdB,
      };
    }
    return {
      round: sessionEntry.round,
      foodIdA: entry.choice.foodIdA,
      foodIdB: entry.choice.foodIdB,
    };
  } catch (error) {
    console.error('Error when getting selection data', error);
    return false;
  }
}

export {
  GenerateSelections,
  GetSelection,
  HasTastedFunction,
  HighMmrFunction,
  SelectionScore,
  SimilarMmrFunction,
  type FoodObject,
};
