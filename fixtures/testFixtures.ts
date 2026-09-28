import { test as base } from '@playwright/test';
import { AccountActivityPage } from '../pages/AccountActivityPage';
import { AccountsOverviewPage } from '../pages/AccountsOverviewPage';
import { BillPayPage } from '../pages/BillPayPage';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';
import { LoginPage } from '../pages/LoginPage';
import { OpenAccountPage } from '../pages/OpenAccountPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { ApiHelper } from '../utils/apiHelper';
import { generateRegistrationUser } from '../utils/testDataGenerator';
import { TransactionSeedingUtility } from '../utils/transactionSeedingUtility';
export type TestCredentials = {
	username: string;
	password: string;
};

type Fixtures = {
	loginPage: LoginPage;
	registrationPage: RegistrationPage;
	accountsOverviewPage: AccountsOverviewPage;
	openAccountPage: OpenAccountPage;
	transferFundsPage: TransferFundsPage;
	accountActivityPage: AccountActivityPage;
	billPayPage: BillPayPage;
	findTransactionsPage: FindTransactionsPage;
	transactionSeedingUtility: TransactionSeedingUtility;
	registeredUser: TestCredentials;
	apiHelper: ApiHelper;
	accountUser: TestCredentials;
};

type WorkerFixtures = {
	workerUser: TestCredentials;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
	workerUser: [async ({ browser }, use) => {
		const page = await browser.newPage();
		const user = generateRegistrationUser();
		const loginPage = new LoginPage(page);
		const registrationPage = new RegistrationPage(page);
		await loginPage.open();
		await loginPage.openRegistration();
		await registrationPage.register(user);
		await registrationPage.expectRegistrationSuccessful(user);
		await loginPage.logout();
		await use({ username: user.username, password: user.password });
		await page.close();
	}, { scope: 'worker' }],
	loginPage: async ({ page }, use) => use(new LoginPage(page)),
	registrationPage: async ({ page }, use) => use(new RegistrationPage(page)),
	accountsOverviewPage: async ({ page }, use) => use(new AccountsOverviewPage(page)),
	openAccountPage: async ({ page }, use) => use(new OpenAccountPage(page)),
	transferFundsPage: async ({ page }, use) => use(new TransferFundsPage(page)),
	accountActivityPage: async ({ page }, use) => use(new AccountActivityPage(page)),
	billPayPage: async ({ page }, use) => use(new BillPayPage(page)),
	findTransactionsPage: async ({ page }, use) => use(new FindTransactionsPage(page)),
	transactionSeedingUtility: async ({ apiHelper }, use) => use(new TransactionSeedingUtility(apiHelper)),
	apiHelper: async ({ page }, use) => use(new ApiHelper(page)),
	registeredUser: async ({ workerUser }, use) => use(workerUser),
	accountUser: async ({ page }, use) => {
		const user = generateRegistrationUser();
		const loginPage = new LoginPage(page);
		const registrationPage = new RegistrationPage(page);
		await loginPage.open();
		await loginPage.openRegistration();
		await registrationPage.register(user);
		await registrationPage.expectRegistrationSuccessful(user);
		await loginPage.logout();
		await use({ username: user.username, password: user.password });
	},
});

export { expect } from '@playwright/test';
