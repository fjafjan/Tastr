import { addCategory } from "../backend/controllers/food_category_controller"; // Adjust the import as needed
import * as DatabaseUtility from "../backend/database_utility";
import { Request, Response } from "express";

jest.mock("../backend/database_utility");

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

    const mockResponse = {
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as any as Response;

    // Mock the CreateCategory function to return true
    (DatabaseUtility.CreateCategory as jest.Mock).mockResolvedValue(true);

    await addCategory(mockRequest, mockResponse);
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(200); // Assuming success
  });

  // Add more tests as needed
});
