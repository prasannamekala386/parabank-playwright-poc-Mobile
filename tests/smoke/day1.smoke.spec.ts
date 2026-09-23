import { test, expect } from '../../fixtures/testFixtures';
import { generateRegistrationUser } from '../../utils/testDataGenerator';

test.describe('ParaBank Day 1 Smoke Suite', () => {
  test('SMK-001 @smoke - application launches successfully', async ({ page, loginPage }) => {
    await loginPage.open();
    await expect(page).toHaveTitle(/ParaBank/);
    await loginPage.expectLoginFormVisible();
  });

  test('SMK-002 @smoke - user can navigate to registration', async ({ loginPage, registrationPage }) => {
    await loginPage.open();
    await loginPage.openRegistration();
    await registrationPage.expectVisible();
  });

  test('SMK-003 @smoke - valid registration autologs in with a default account', async ({ loginPage, registrationPage, accountsOverviewPage }) => {
    const user = generateRegistrationUser();
    await loginPage.open();
    await loginPage.openRegistration();
    await registrationPage.register(user);
    await registrationPage.expectRegistrationSuccessful(user);
    await accountsOverviewPage.open();
    await accountsOverviewPage.expectDisplayed();
  });

  test('SMK-004 @smoke - registered user can login successfully', async ({ loginPage, accountsOverviewPage, registeredUser }) => {
    await loginPage.open();
    await loginPage.login(registeredUser.username, registeredUser.password);
    await accountsOverviewPage.open();
    await accountsOverviewPage.expectDisplayed();
  });

  test('SMK-005 @smoke - accounts overview is displayed', async ({ loginPage, accountsOverviewPage, registeredUser }) => {
    await loginPage.open();
    await loginPage.login(registeredUser.username, registeredUser.password);
    await accountsOverviewPage.open();
    await accountsOverviewPage.expectDisplayed();
  });

  test('SMK-006 @smoke - default account and balance are displayed', async ({ loginPage, accountsOverviewPage, registeredUser }) => {
    await loginPage.open();
    await loginPage.login(registeredUser.username, registeredUser.password);
    await accountsOverviewPage.open();
    await accountsOverviewPage.expectDisplayed();
    await expect(accountsOverviewPage.accountNumbers.first()).toHaveText(/\d+/);
    await expect(accountsOverviewPage.balances.first()).toHaveText(/\$\d[\d,]*\.\d{2}/);
  });

  test('SMK-007 @smoke - user can open a new checking account', async ({ loginPage, accountsOverviewPage, openAccountPage, registeredUser }) => {
    await loginPage.open();
    await loginPage.login(registeredUser.username, registeredUser.password);
    await openAccountPage.open();
    await openAccountPage.createCheckingAccount();
    await openAccountPage.expectCreated();
  });

  test('SMK-008 @smoke - newly created account appears in overview', async ({ loginPage, accountsOverviewPage, openAccountPage, registeredUser }) => {
    await loginPage.open();
    await loginPage.login(registeredUser.username, registeredUser.password);
    await openAccountPage.open();
    await openAccountPage.createCheckingAccount();
    await openAccountPage.expectCreated();
    const accountNumber = await openAccountPage.accountNumber();
    await accountsOverviewPage.open();
    await accountsOverviewPage.expectDisplayed();
    await accountsOverviewPage.expectAccountDisplayed(accountNumber);
  });

  test('SMK-009 @smoke - user can transfer funds', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, registeredUser }) => {
    await loginPage.open();
    await loginPage.login(registeredUser.username, registeredUser.password);
    await accountsOverviewPage.open();
    await accountsOverviewPage.expectDisplayed();
    await openAccountPage.open();
    await openAccountPage.createCheckingAccount();
    await transferFundsPage.open();
    await transferFundsPage.transfer('1');
    await transferFundsPage.expectSuccessful();
  });

  test('SMK-010 @smoke - user can logout successfully', async ({ loginPage, accountsOverviewPage, registeredUser }) => {
    await loginPage.open();
    await loginPage.login(registeredUser.username, registeredUser.password);
    await accountsOverviewPage.open();
    await accountsOverviewPage.expectDisplayed();
    await loginPage.logout();
    await loginPage.expectLoginFormVisible();
  });
});