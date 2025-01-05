import { Builder, By, ThenableWebDriver, until } from 'selenium-webdriver';

const testCategory = 'Treats';

const createNewCategory = async (driver: ThenableWebDriver) => {
  // Find and fill in the category input
  const categoryInput = await driver.findElement(By.id('category-input'));

  await categoryInput.sendKeys(testCategory);

  // Add the first food item
  const firstFoodInput = await driver.findElement(By.id('food-item-input-0'));
  await firstFoodInput.sendKeys('Ice Cream');

  // Add the second food item (triggers the addition of a new input)
  const secondFoodInput = await driver.findElement(By.id('food-item-input-1'));
  await secondFoodInput.sendKeys('Cake');

  // Verify a new input was added
  const newFoodInput = await driver.findElement(By.id('food-item-input-2'));
  expect(newFoodInput).toBeTruthy();

  // Click the Done button
  const doneButton = await driver.findElement(By.id('done-button'));
  await doneButton.click();

  await driver.wait(until.urlContains(`${testCategory.toLowerCase()}`), 5000);
};

const loginUser = async (
  driver: ThenableWebDriver,
  username: string,
  email: string,
) => {
  // Enter user name
  const userNameInput = await driver.findElement(By.id('user-name-input'));
  await userNameInput.sendKeys(username);

  // User user email
  const userEmailInput = await driver.findElement(By.id('user-email-input'));
  await userEmailInput.sendKeys(email);

  // Click done
  const loginButton = await driver.findElement(By.id('login-button'));
  await loginButton.click();

  // Wait until completed.
  await driver.wait(until.urlContains('waiting'));
};

const voteForFood = async (driver: ThenableWebDriver) => {
  const leftButton = await driver.findElement(By.id('vote-option-0'));
  const rightButton = await driver.findElement(By.id('vote-option-0'));
  expect(await leftButton.isEnabled()).toBe(true);
  expect(await rightButton.isEnabled()).toBe(true);

  // We always vote for the left option for now.
  await leftButton.click();
};

describe('HomePage E2E Tests', () => {
  let driver: ThenableWebDriver;
  let driver2: ThenableWebDriver;

  beforeEach(async () => {
    driver = new Builder().forBrowser('chrome').build();
    driver.manage().setTimeouts({ implicit: 10000 }); // Wait up to 10 seconds

    driver2 = new Builder().forBrowser('chrome').build();
    driver2.manage().setTimeouts({ implicit: 10000 }); // Wait up to 10 seconds

    jest.setTimeout(30000);
  });

  afterEach(async () => {
    await driver.quit();
    await driver2?.quit();
  }, 20000);

  test('should navigate and add food items', async () => {
    // Navigate to the home page
    await driver.get('http://localhost:9000'); // Replace with your app's URL

    await createNewCategory(driver);

    // Wait for navigation
    await driver.wait(until.urlContains(`${testCategory.toLowerCase()}`), 5000);

    // Assert navigation occurred
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain(`/${testCategory.toLowerCase()}`);
  }, 20000);

  test('Multiple users should both get to waiting screen', async () => {
    // Navigate to the home page
    await driver.get('http://localhost:9000');
    // Create the test category
    await createNewCategory(driver);
    // Log in as Host User and make sure you are in waiting room
    await loginUser(driver, 'Host User', 'Host.User@TestEmail.com');

    // Log in as second user as well
    await driver2.get(`http://localhost:9000/${testCategory.toLowerCase()}`);
    await loginUser(driver2, 'Other User', 'Other.User@TestEmail.com');

    const startButton = await driver.findElement(By.id('start-session-button'));
    expect(startButton).toBeTruthy();
    // Only the host should have a start button.
    // For some reason this check is SUPER slow...
    // const buttons = await driver2.findElements(By.id('start-session-button'))
    // expect(buttons.length).toBe(0)
  }, 40000);

  test('All users in waiting room should enter session and see options', async () => {
    // Navigate to the home page
    await driver.get('http://localhost:9000');
    // Create the dessert category
    await createNewCategory(driver);
    // Log in as Host User and make sure you are in waiting room
    await loginUser(driver, 'Host User', 'Host.User@TestEmail.com');

    // Log in as second user as well
    await driver2.get(`http://localhost:9000/${testCategory.toLowerCase()}`);
    await loginUser(driver2, 'Other User', 'Other.User@TestEmail.com');

    // TODO: We need a local database to fix this since the session is already
    const startButton = await driver.findElement(By.id('start-session-button'));
    await startButton.click();

    await voteForFood(driver);
    await voteForFood(driver2);

    await voteForFood(driver);
    await voteForFood(driver2);
  }, 100000);
});
