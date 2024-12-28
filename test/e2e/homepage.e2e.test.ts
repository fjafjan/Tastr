import { Builder, By, until } from "selenium-webdriver";

describe("HomePage E2E Tests", () => {
  let driver: any;

  beforeAll(async () => {
    driver = new Builder().forBrowser("chrome").build();
    driver.manage().setTimeouts({ implicit: 10000 }); // Wait up to 10 seconds
    jest.setTimeout(30000)
  });

  afterAll(async () => {
    await driver.quit();
  });

  test("should navigate and add food items", async () => {
    // Navigate to the home page
    await driver.get("http://localhost:9000"); // Replace with your app's URL

    // Find and fill in the category input
    // const categoryInput = await driver.findElement(By.css('input[placeholder="What are you Sampling?"]'));
    const categoryInput = await driver.findElement(By.id("category-input"));

    await categoryInput.sendKeys("Desserts");

    // Add the first food item
    const firstFoodInput = await driver.findElement(By.id('food-item-input-0'));
    await firstFoodInput.sendKeys("Ice Cream");

    // Add the second food item (triggers the addition of a new input)
    const secondFoodInput = await driver.findElement(By.id('food-item-input-1'));
    await secondFoodInput.sendKeys("Cake");

    // Verify a new input was added
    const newFoodInput = await driver.findElement(By.css('food-item-input-2'));
    expect(newFoodInput).toBeTruthy();

    // Click the Done button
    const doneButton = await driver.findElement(By.css('button[title="Done"]'));
    await doneButton.click();

    // Wait for navigation
    await driver.wait(until.urlContains("desserts"), 5000);

    // Assert navigation occurred
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("/desserts");
  });
});
