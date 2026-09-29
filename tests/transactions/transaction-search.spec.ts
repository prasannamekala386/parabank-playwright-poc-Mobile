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
		expect((await findTransactionsPage.rows()).map((row) => row.id)).toContain(String(transaction?.id));
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
		await findTransactionsPage.expectDateValidationMessage();
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

	// test('TXN-011 @transactions @regression @api - API seeds and displays 50 transactions in newest-first order', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
	// 	test.setTimeout(600_000);
	// 	const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 50 });
	// 	expect(scenario.transactions).toHaveLength(50);
	// 	await findTransactionsPage.open();
	// 	await findTransactionsPage.selectAccount(scenario.source.accountNumber);
	// 	await findTransactionsPage.searchByAmount('1.00');
	// 	const rows = await findTransactionsPage.rows();
	// 	expect(rows).toHaveLength(50);
	// 	const expectedIds = scenario.transactions.map((transaction) => String(transaction.id)).sort((left, right) => Number(right) - Number(left));
	// 	expect(rows.map((row) => row.id)).toEqual(expectedIds);
	// });

	// test('TXN-012 @transactions @regression @search - seeded transaction IDs remain searchable', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
	// 	const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 5 });
	// 	await findTransactionsPage.open();
	// 	await findTransactionsPage.selectAccount(scenario.source.accountNumber);
	// 	for (const transaction of scenario.transactions) {
	// 		await findTransactionsPage.searchByTransactionId(String(transaction.id));
	// 		await findTransactionsPage.expectResults();
	// 		expect((await findTransactionsPage.rows()).map((row) => row.id)).toContain(String(transaction.id));
	// 	}
	// });

	// test('TXN-013 @transactions @regression @search - transaction results are newest first', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountUser }) => {
	// 	const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 5 });
	// 	await findTransactionsPage.open();
	// 	await findTransactionsPage.selectAccount(scenario.source.accountNumber);
	// 	await findTransactionsPage.searchByAmount('1.00');
	// 	const rows = await findTransactionsPage.rows();
	// 	expect(rows).toHaveLength(5);
	// 	const transactionIds = rows.map((row) => Number(row.id));
	// 	expect(transactionIds).toEqual([...transactionIds].sort((left, right) => right - left));
	// });

	// test('TXN-014 @transactions @regression @reconciliation @api - UI activity count matches API count', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountActivityPage, accountUser }) => {
	// 	const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser });
	// 	await accountActivityPage.open(scenario.source.accountNumber);
	// 	await accountActivityPage.expectDisplayed();
	// 	const uiRows = await accountActivityPage.rows();
	// 	const apiAccount = await apiHelper.getAccount(scenario.source.accountNumber);
	// 	const apiRows = await apiHelper.getTransactions(apiAccount.accountId);
	// 	expect(uiRows.length).toBe(apiRows.length);
	// });

	// test('TXN-015 @transactions @regression @reconciliation @api - UI transaction values match API values', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountActivityPage, accountUser }) => {
	// 	const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 5 });
	// 	let accounts = await accountsOverviewPage.accountSummaries();
	// 	while (accounts.length < 3) {
	// 		await openAccountPage.open();
	// 		await openAccountPage.createCheckingAccount();
	// 		await openAccountPage.expectCreated();
	// 		await accountsOverviewPage.open();
	// 		accounts = await accountsOverviewPage.accountSummaries();
	// 	}

	// 	for (const account of accounts.slice(0, 3)) {
	// 		await accountActivityPage.open(account.accountNumber);
	// 		await accountActivityPage.expectDisplayed();
	// 		const uiRows = await accountActivityPage.rows();
	// 		const apiAccount = await apiHelper.getAccount(account.accountNumber);
	// 		const apiRows = await apiHelper.getTransactions(apiAccount.accountId);
	// 		const uiValues = uiRows.map(({ id, description, amount }) => ({ id: Number(id), description, amount })).sort((left, right) => left.id - right.id);
	// 		const apiValues = apiRows.map(({ id, description, amount }) => ({ id, description, amount })).sort((left, right) => left.id - right.id);
	// 		expect(uiValues).toEqual(apiValues);
	// 	}
	//});
});
