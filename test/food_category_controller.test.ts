import { addCategory, getAliases, getMmr, getNames } from "../backend/controllers/food_category_controller"; // Adjust the import as needed
import * as DatabaseUtility from "../backend/database_utility";
import { Request, Response } from "express";
import { FoodCategoryData, IFoodCategory } from "../backend/models";
import { ParamsDictionary } from 'express-serve-static-core'
jest.mock("../backend/database_utility");

const mockFoodObject =
{
  id: "test-food-id",
  name: "test-name",
  alias: "test-alias",
  voteCount: 5,
  MMR: 1000,
};

const mockFoodCategory = {
  categoryId: "test-category",
  foodObjects:
  [
    mockFoodObject,
  ],
} as IFoodCategory

function foodCategoryParams(): ParamsDictionary {
  return { foodCategoryId: "test-category"}
}

const validCategoryRequest = {
  body: {
    categoryId: "test-category",
  },
  params: foodCategoryParams()
} as Request

function GetMockResponse(): Response {
  return {
    json: jest.fn(),
    sendStatus: jest.fn(),
  } as any as Response;
}

describe("FoodCategoryController", () => {
  it("should add a new category", async () => {
    const mockRequest = {
      body: {
        categoryId: "test-category",
        foodNames: { Food1: "Apples", Food2: "Oranges" } as Record<
          string,
          string
        >,
      },
    } as Request;

    const mockResponse = GetMockResponse();
    // Mock the CreateCategory function to return true
    (DatabaseUtility.CreateCategory as jest.Mock).mockResolvedValue(true);

    await addCategory(mockRequest, mockResponse);
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200); // Assuming success
  });

  // Add more tests as needed

  it("Should retrieve names from category", async () => {
    const mockResponse = GetMockResponse();

    // Mock response value from data.
    // (FoodCategoryData.findOne as jest.Mock).mockResolvedValue(mockFoodCategory)
    // jest.spyOn(FoodCategoryData, 'findOne').mockReturnValue(mockFoodCategory)
    FoodCategoryData.findOne = jest.fn().mockResolvedValue([mockFoodCategory])

    const names = await getNames( validCategoryRequest, mockResponse);

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200)
    expect(names).toBe([mockFoodObject.name])
   })

   it("Should retrieve aliases from category", async () => {
    const mockResponse = GetMockResponse();

    // Mock response value from data.
    (FoodCategoryData.findOne as jest.Mock).mockResolvedValue(mockFoodCategory)

    const names = await getAliases(validCategoryRequest, mockResponse);

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200)
    expect(names).toBe([mockFoodObject.alias])
   })

   it("Should retrieve MMR from category", async () => {
    const mockResponse = GetMockResponse();

    // Mock response value from data.
    (FoodCategoryData.findOne as jest.Mock).mockResolvedValue(mockFoodCategory)

    const names = await getMmr(validCategoryRequest, mockResponse);

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200)
    expect(names).toBe([mockFoodObject.MMR])
   })
  });
