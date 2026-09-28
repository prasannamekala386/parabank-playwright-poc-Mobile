import { expect, test } from '../../fixtures/testFixtures';
import { prepareTransactions, toUiDate } from './transactionTestUtils';

test.describe('ParaBank Day 6 Transaction Search', () => {
	test('TXN-001 @transactions @regression @search - transaction ID search returns the transaction', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		const transaction = scenario.transactions.at(-1);
		expect(transaction).toBeDefined();
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByTransactionId(String(transaction?.id));
		await findTransactionsPage.expectResults();
	});

	test('TXN-002 @transactions @regression @search - transaction date search returns matching transactions', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		const date = toUiDate(scenario.transactions.at(-1)?.date ?? '');
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByDate(date);
		await findTransactionsPage.expectResults();
	});

	test('TXN-003 @transactions @regression @search - transaction date range returns in-range transactions', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 2 });
		const dates = scenario.transactions.map((transaction) => toUiDate(transaction.date));
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByDateRange(dates[0], dates.at(-1) ?? dates[0]);
		await findTransactionsPage.expectResults();
	});

	test('TXN-004 @transactions @regression @search - amount search returns matching transactions', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByAmount('1.00');
		await findTransactionsPage.expectResults();
	});

	test('TXN-005 @transactions @regression @search - equal start and end dates return same-day results', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		const date = toUiDate(scenario.transactions.at(-1)?.date ?? '');
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByDateRange(date, date);
		await findTransactionsPage.expectResults();
	});

	test('TXN-006 @transactions @regression @negative - end date before start date is handled', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		const date = toUiDate(scenario.transactions.at(-1)?.date ?? '');
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByDateRange('12-31-2099', date);
		await findTransactionsPage.expectNoResults();
	});

	test('TXN-007 @transactions @regression @negative - invalid date format is handled', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByDate('invalid-date');
		await findTransactionsPage.expectNoResults();
	});

	test('TXN-008 @transactions @regression @negative - future date returns no results', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByDate('12-31-2099');
		await findTransactionsPage.expectNoResults();
	});

	test('TXN-009 @transactions @regression @negative - unmatched amount shows empty state', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByAmount('999999.99');
		await findTransactionsPage.expectNoResults();
	});

	test('TXN-010 @transactions @regression @negative - invalid transaction ID returns no results', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByTransactionId('999999999');
		await findTransactionsPage.expectNoResults();
	});

	test('TXN-011 @transactions @regression @api - API seeds 50 transactions', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 50 });
		expect(scenario.transactions).toHaveLength(50);
	});

	test('TXN-012 @transactions @regression @search - all seeded transactions are searchable', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 50 });
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByTransactionId(String(scenario.transactions.at(-1)?.id));
		await findTransactionsPage.expectResults();
	});

	test('TXN-013 @transactions @regression @search - transaction results are newest first', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 50 });
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByAmount('1.00');
		const rows = await findTransactionsPage.rows();
		expect(rows.length).toBeGreaterThanOrEqual(50);
		const dates = rows.map((row) => new Date(row.date).getTime()).filter(Number.isFinite);
		expect(dates).toEqual([...dates].sort((left, right) => right - left));
	});

	test('TXN-014 @transactions @regression @reconciliation @api - UI activity count matches API count', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountActivityPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 50 });
		await accountActivityPage.open(scenario.source.accountNumber);
		await accountActivityPage.expectDisplayed();
		const uiRows = await accountActivityPage.rows();
		const apiAccount = await apiHelper.getAccount(scenario.source.accountNumber);
		const apiRows = await apiHelper.getTransactions(apiAccount.accountId);
		expect(uiRows.length).toBe(apiRows.length);
	});

	test('TXN-015 @transactions @regression @reconciliation @api - UI transaction values match API values', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountActivityPage, accountUser }) => {
		const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 5 });
		await accountActivityPage.open(scenario.source.accountNumber);
		await accountActivityPage.expectDisplayed();
		const uiRows = await accountActivityPage.rows();
		const apiAccount = await apiHelper.getAccount(scenario.source.accountNumber);
		const apiRows = await apiHelper.getTransactions(apiAccount.accountId);
		expect(uiRows.map((row) => row.amount)).toEqual(apiRows.map((row) => row.amount));
	});
});
