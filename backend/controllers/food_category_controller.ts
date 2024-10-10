import { Request, Response } from "express";
import { FoodObject } from "../database_utility";
import { FoodCategoryData } from "../models";

const letters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "Å",
  "Ä",
  "Ö",
];

export const addCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    categoryId,
    foodNames,
  }: { categoryId: string; foodNames: Record<string, string> } = req.body;
  console.log("Creating new category with ", categoryId, foodNames);

  const result = await CreateCategory(categoryId, foodNames);

  if (result) {
    res.sendStatus(200); // Ok!
  } else {
    res.sendStatus(500); // Sadness
    console.error("Failed to create new category ", categoryId, foodNames);
  }
};

export const getAliases = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { categoryId } = req.params;
  console.log("Getting aliases for category ", categoryId);

  try {
    const entry = await FoodCategoryData.findOne({
      categoryId: categoryId,
    }).exec();

    if (entry) {
      const idToAliasDictionary = entry.foodObjects.reduce(
        (acc: Record<string, string>, item: { id: string; alias: string }) => {
          acc[item.id] = item.alias;
          return acc;
        },
        {}
      );
      console.log("Returning", idToAliasDictionary);
      res.json(idToAliasDictionary);
    } else {
      res.sendStatus(404); // Not found
    }
  } catch (error) {
    console.error(`Failed to get foods for ${categoryId}`, error);
    res.sendStatus(500); // Internal Server Error
  }
};

export const getNames = async (req: Request, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  console.log("Getting food names for category ", categoryId);

  try {
    const entry = await FoodCategoryData.findOne({
      categoryId: categoryId,
    }).exec();

    if (entry) {
      const idToNamesDictionary = entry.foodObjects.reduce(
        (acc: Record<string, string>, item: { id: string; name: string }) => {
          acc[item.id] = item.name;
          return acc;
        },
        {}
      );
      console.log("Returning", idToNamesDictionary);
      res.json(idToNamesDictionary);
    } else {
      res.sendStatus(404); // Not found
    }
  } catch (error) {
    console.error(`Failed to get foods for ${categoryId}`, error);
    res.sendStatus(500); // Internal Server Error
  }
};

export const getMmr = async (req: Request, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  console.log("Getting MMR for category", categoryId);

  try {
    const entry = await FoodCategoryData.findOne({
      categoryId: categoryId,
    }).exec();

    if (entry) {
      const foodItemsDictionary = entry.foodObjects.reduce(
        (acc: Record<string, number>, item: { name: string; MMR: number }) => {
          acc[item.name] = item.MMR;
          return acc;
        },
        {}
      );

      console.log("Returning", foodItemsDictionary);
      res.json(foodItemsDictionary);
    } else {
      res.sendStatus(404); // Not found
    }
  } catch (error) {
    console.error(`Failed to find MMR for ${categoryId}`, error);
    res.sendStatus(500); // Internal Server Error
  }
};

// Create a new category
async function CreateCategory(
  categoryId: string,
  foodNames: Record<string, string>
): Promise<boolean> {
  try {
    const selection = letters.slice(0, Object.keys(foodNames).length);

    const foodObjects: FoodObject[] = Object.keys(foodNames).map(
      (key, index) => ({
        id: key,
        name: foodNames[key],
        alias: selection[index],
        MMR: 1000,
      })
    );

    await FoodCategoryData.findOneAndUpdate(
      { categoryId },
      { $set: { foodObjects } },
      { upsert: true, new: true }
    );
    return true;
  } catch (error) {
    console.error("Failed to save new data due to ", error);
    return false;
  }
}
