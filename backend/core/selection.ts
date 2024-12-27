// Import the necessary models and utilities with types.
import {
    SelectionData
} from "../models";
import { GenerateMatchups, Judge } from "../selection_utility";
import { FoodObject, GetUserTastedItems, TryFindCategory } from "./category";


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

  const promises = userIds.map((userId) => GetUserTastedItems(categoryId, userId));
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
      round: parseInt(String(round), 10), // TODO: Should remove this parseInt stuff, or explain why we need it.
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

export {
    GenerateSelections,
    GetSelection,
    type FoodObject
};

