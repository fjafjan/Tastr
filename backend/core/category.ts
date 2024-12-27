import {
  FoodCategoryData,
  IFoodCategory,
} from "../models";
import { Judge } from "../selection_utility";
import { GetUserVotes } from "./voting";

// Type for food objects
type FoodObject = {
    id: string;
    name: string;
    alias: string;
    MMR: number;
  };

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
  };

// Find tasted items for a user
async function GetUserTastedItems(
    categoryId: string,
    userId: string
  ): Promise<Judge | false> {
    console.log(`Generating taste-map for ${categoryId} and user ${userId}`);

    try {
      const foodVotes = await GetUserVotes(categoryId, userId);

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

export {
  GetUserTastedItems as GetUserTastedItems, TryFindCategory, type FoodObject
};

