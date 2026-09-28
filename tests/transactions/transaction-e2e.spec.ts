import { expect, test } from '../../fixtures/testFixtures';
import { prepareTransactions, toUiDate } from './transactionTestUtils';

test('E2E-TXN-001 @transactions @regression @e2e @reconciliation - API seeded transactions are searchable and reconcile with UI activity', async ({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, findTransactionsPage, accountActivityPage, accountUser }) => {
	const scenario = await prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume: 50 });
	const firstTransaction = scenario.transactions[0];
	const lastTransaction = scenario.transactions.at(-1);
	expect(firstTransaction).toBeDefined();
	expect(lastTransaction).toBeDefined();

	await test.step('Search by transaction ID', async () => {
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByTransactionId(String(lastTransaction?.id));
		await findTransactionsPage.expectResults();
	});

	await test.step('Search by date and date range', async () => {
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByDate(toUiDate(lastTransaction?.date ?? ''));
		await findTransactionsPage.expectResults();
		await findTransactionsPage.searchByDateRange(toUiDate(firstTransaction?.date ?? ''), toUiDate(lastTransaction?.date ?? ''));
		await findTransactionsPage.expectResults();
	});

	await test.step('Search by amount and reconcile account activity', async () => {
		await findTransactionsPage.open();
		await findTransactionsPage.selectAccount(scenario.source.accountNumber);
		await findTransactionsPage.searchByAmount('1.00');
		await findTransactionsPage.expectResults();
		await accountActivityPage.open(scenario.source.accountNumber);
		await accountActivityPage.expectDisplayed();
		const uiRows = await accountActivityPage.rows();
		const apiAccount = await apiHelper.getAccount(scenario.source.accountNumber);
		const apiRows = await apiHelper.getTransactions(apiAccount.accountId);
		expect(uiRows.length).toBe(apiRows.length);
		expect(uiRows.map((row) => row.amount)).toEqual(apiRows.map((row) => row.amount));
	});
});
