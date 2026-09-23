import { expect, test } from '../../fixtures/testFixtures';
import { AccountSummary } from '../../pages/AccountsOverviewPage';

async function loginAndOpenOverview(loginPage: { open(): Promise<void>; login(username: string, password: string): Promise<void> }, accountsOverviewPage: { open(): Promise<void>; expectDisplayed(): Promise<void> }, username: string, password: string): Promise<void> {
	await loginPage.open();
	await loginPage.login(username, password);
	await accountsOverviewPage.open();
	await accountsOverviewPage.expectDisplayed();
}

function cents(value: number): number {
	return Math.round(value * 100);
}

function sumBalances(accounts: AccountSummary[]): number {
	return Number(accounts.reduce((total, account) => total + account.balance, 0).toFixed(2));
}

test.describe('ParaBank Day 3 Accounts and Balances', () => {
	test.describe.configure({ mode: 'serial' });

	test('ACC-001 @accounts @regression - user can open a new CHECKING account', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		await openAccountPage.open();
		await openAccountPage.createCheckingAccount();
		await openAccountPage.expectCreated();
	});

	test('ACC-002 @accounts @regression - new CHECKING account appears in overview', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		await openAccountPage.open();
		await openAccountPage.createCheckingAccount();
		const accountNumber = await openAccountPage.accountNumber();
		await accountsOverviewPage.open();
		await accountsOverviewPage.expectAccountDisplayed(accountNumber);
	});

	test('ACC-003 @accounts @regression - generated CHECKING account numbers are unique', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const accountNumbers: string[] = [];
		for (let index = 0; index < 2; index += 1) {
			await openAccountPage.open();
			await openAccountPage.createCheckingAccount();
			accountNumbers.push(await openAccountPage.accountNumber());
			await accountsOverviewPage.open();
		}
		expect(new Set(accountNumbers).size).toBe(accountNumbers.length);
	});

	test('ACC-004 @accounts @regression - source balance is reconciled after CHECKING account creation', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const before = (await accountsOverviewPage.accountSummaries())[0];
		await openAccountPage.open();
		await openAccountPage.createCheckingAccount();
		const createdAccountNumber = await openAccountPage.accountNumber();
		await accountsOverviewPage.open();
		const afterAccounts = await accountsOverviewPage.accountSummaries();
		const after = afterAccounts.find((account) => account.accountNumber === before.accountNumber);
		const created = afterAccounts.find((account) => account.accountNumber === createdAccountNumber);
		expect(after).toBeDefined();
		expect(created).toBeDefined();
		expect(cents((after?.balance ?? 0) + (created?.balance ?? 0))).toBe(cents(before.balance));
	});

	test('ACC-005 @accounts @regression - user can open a new SAVINGS account', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		await openAccountPage.open();
		await openAccountPage.createSavingsAccount();
		await openAccountPage.expectCreated();
	});

	test('ACC-006 @accounts @regression - new SAVINGS account appears in overview', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		await openAccountPage.open();
		await openAccountPage.createSavingsAccount();
		const accountNumber = await openAccountPage.accountNumber();
		await accountsOverviewPage.open();
		await accountsOverviewPage.expectAccountDisplayed(accountNumber);
	});

	test('ACC-007 @accounts @regression - generated SAVINGS account numbers are unique', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const accountNumbers: string[] = [];
		for (let index = 0; index < 2; index += 1) {
			await openAccountPage.open();
			await openAccountPage.createSavingsAccount();
			accountNumbers.push(await openAccountPage.accountNumber());
			await accountsOverviewPage.open();
		}
		expect(new Set(accountNumbers).size).toBe(accountNumbers.length);
	});

	test('ACC-008 @accounts @regression - Accounts Overview displays all customer accounts', async ({ loginPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const accounts = await accountsOverviewPage.accountSummaries();
		expect(accounts.length).toBeGreaterThan(0);
	});

	test('ACC-009 @accounts @regression - all displayed balances are valid monetary values', async ({ loginPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		await accountsOverviewPage.expectAllBalancesValid();
	});

	test('ACC-010 @accounts @regression @e2e - multiple accounts can be opened sequentially', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		for (const type of ['CHECKING', 'SAVINGS', 'CHECKING'] as const) {
			await openAccountPage.open();
			await openAccountPage.createAccount(type);
			await openAccountPage.expectCreated();
			await accountsOverviewPage.open();
			await accountsOverviewPage.expectDisplayed();
		}
	});

	test('ACC-011 @accounts @regression @e2e @reconciliation - E2E-ACC-001 creates five accounts and reconciles balances', async ({ loginPage, openAccountPage, accountsOverviewPage, apiHelper, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const initialAccounts = await accountsOverviewPage.accountSummaries();
		const createdAccountNumbers: string[] = [];
		const runningTotals: number[] = [];
		for (let index = 0; index < 5; index += 1) {
			await openAccountPage.open();
			await openAccountPage.createAccount(index % 2 === 0 ? 'CHECKING' : 'SAVINGS');
			await openAccountPage.expectCreated();
			createdAccountNumbers.push(await openAccountPage.accountNumber());
			await accountsOverviewPage.open();
			await accountsOverviewPage.expectDisplayed();
			runningTotals.push(await accountsOverviewPage.totalBalance());
		}
		expect(new Set(createdAccountNumbers).size).toBe(5);
		const finalAccounts = await accountsOverviewPage.accountSummaries();
		expect(finalAccounts.length).toBe(initialAccounts.length + 5);
		const finalTotal = sumBalances(finalAccounts);
		expect(cents(finalTotal)).toBe(cents(runningTotals[runningTotals.length - 1]));
		for (let index = 1; index < runningTotals.length; index += 1) {
			expect(cents(runningTotals[index])).toBe(cents(runningTotals[index - 1]));
		}
		const apiBalances = await Promise.all(createdAccountNumbers.map((accountNumber) => apiHelper.getAccount(accountNumber)));
		expect(apiBalances.map((account) => account.accountId.toString()).sort()).toEqual([...createdAccountNumbers].sort());
		expect(cents(apiBalances.reduce((total, account) => total + account.balance, 0))).toBe(cents(sumBalances(finalAccounts.filter((account) => createdAccountNumbers.includes(account.accountNumber)))));
	});

	test('ACC-012 @accounts @regression @reconciliation - Accounts Overview total equals displayed balance sum', async ({ loginPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const accounts = await accountsOverviewPage.accountSummaries();
		expect(cents(await accountsOverviewPage.totalBalance())).toBe(cents(sumBalances(accounts)));
	});

	test('ACC-013 @accounts @regression @reconciliation - running balance remains penny-accurate after account creation', async ({ loginPage, openAccountPage, accountsOverviewPage, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const totals: number[] = [];
		for (let index = 0; index < 3; index += 1) {
			await openAccountPage.open();
			await openAccountPage.createCheckingAccount();
			await accountsOverviewPage.open();
			totals.push(await accountsOverviewPage.totalBalance());
		}
		for (const total of totals) {
			expect(Number.isInteger(cents(total))).toBe(true);
		}
	});

	test('ACC-014 @accounts @regression @api - API account balances match UI balances', async ({ loginPage, accountsOverviewPage, apiHelper, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const uiAccounts = await accountsOverviewPage.accountSummaries();
		const apiAccounts = await Promise.all(uiAccounts.map((account) => apiHelper.getAccount(account.accountNumber)));
		for (const uiAccount of uiAccounts) {
			const apiAccount = apiAccounts.find((account) => account.accountId.toString() === uiAccount.accountNumber);
			expect(apiAccount).toBeDefined();
			expect(cents(apiAccount?.balance ?? NaN)).toBe(cents(uiAccount.balance));
		}
	});

	test('ACC-015 @accounts @regression @api - API account count matches UI account count', async ({ loginPage, accountsOverviewPage, apiHelper, accountUser }) => {
		await loginAndOpenOverview(loginPage, accountsOverviewPage, accountUser.username, accountUser.password);
		const uiAccounts = await accountsOverviewPage.accountSummaries();
		const apiAccounts = await Promise.all(uiAccounts.map((account) => apiHelper.getAccount(account.accountNumber)));
		expect(apiAccounts).toHaveLength(uiAccounts.length);
	});
});
