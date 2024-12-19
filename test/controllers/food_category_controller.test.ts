import {
  addCategory,
  getAliases,
  getMmr,
  getNames,
} from "../../backend/controllers/food_category_controller"; // Adjust the import as needed
import { Request, Response } from "express";
import { FoodCategoryData, IFoodCategory } from "../../backend/models";
import { ParamsDictionary } from "express-serve-static-core";
import { connect, closeDatabase, clearDatabase } from "../jest-mongodb-setup";

beforeAll(async () => {
  await connect(); // Set up connection before tests
});

beforeEach(async () => {
  const testCategory = new FoodCategoryData({
    categoryId: "test-category",
    foodObjects: [
      { id: "1", name: "Pizza", alias: "P", voteCount: 0, MMR: 1000 },
    ],
  });
  testCategory.foodObjects[0].id;
  await testCategory.save();
});

afterAll(async () => {
  await closeDatabase(); // Clean up after all tests
});

afterEach(async () => {
  await clearDatabase(); // Clear data between tests
});

function foodCategoryParams(): ParamsDictionary {
  return { categoryId: "test-category" };
}

const validCategoryRequest = {
  body: {
    categoryId: "test-category",
  },
  params: foodCategoryParams(),
} as Request;

function GetMockResponse(): Response {
  return {
    json: jest.fn(),
    sendStatus: jest.fn(),
  } as any as Response;
}

describe("FoodCategoryController", () => {
  test("should add a new category", async () => {
    const mockRequest = {
      body: {
        categoryId: "new-category",
        foodNames: { Food1: "Apples", Food2: "Oranges" } as Record<
          string,
          string
        >,
      },
    } as Request;

    const mockResponse = GetMockResponse();
    await addCategory(mockRequest, mockResponse);

    const foundCategory = await FoodCategoryData.findOne({
      categoryId: "new-category",
    }).exec();
    expect(foundCategory?.foodObjects[0].name).toBe("Apples");
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200); // Assuming success
  });

  test("Should retrieve names from category", async () => {
    const mockResponse = GetMockResponse();

    await getNames(validCategoryRequest, mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith({ "1": "Pizza" });
  });

  test("Should retrieve aliases from category", async () => {
    const mockResponse = GetMockResponse();

    await getAliases(validCategoryRequest, mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith({ "1": "P" });
  });

  test("Should retrieve MMR from category", async () => {
    const mockResponse = GetMockResponse();

    await getMmr(validCategoryRequest, mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith({ Pizza: 1000 });
  });
});
