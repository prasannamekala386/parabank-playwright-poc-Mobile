import { expect, test } from '../../fixtures/testFixtures';

import { ensureTransferAccounts } from './transferTestUtils';

async function ensureAtLeastTwoAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser }: { loginPage: any; accountsOverviewPage: any; openAccountPage: any; accountUser: { username: string; password: string } }) {
	return ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
}

test.describe('ParaBank Day 4 Transfer Reconciliation', () => {
	test.setTimeout(60000);

	test('TRF-016 @transfers @regression @e2e - 10 sequential transfers execute successfully', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureAtLeastTwoAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		for (let index = 0; index < 10; index += 1) {
			await transferFundsPage.open();
			await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
			await transferFundsPage.expectSuccessful();
			await accountsOverviewPage.open();
		}
	});

	test('TRF-017 @transfers @regression @reconciliation - final source balance equals opening minus sum of transfer amounts', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureAtLeastTwoAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		const openingBalance = source.balance;
		const transferTotal = 10;
		for (let index = 0; index < 10; index += 1) {
			await transferFundsPage.open();
			await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
			await transferFundsPage.expectSuccessful();
		}
		await accountsOverviewPage.open();
		const updatedSource = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === source.accountNumber);
		expect(updatedSource?.balance).toBeCloseTo(openingBalance - transferTotal, 2);
	});

	test('TRF-018 @transfers @regression @reconciliation - final destination account balance equals expected value', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureAtLeastTwoAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		const openingBalance = destination.balance;
		const transferTotal = 10;
		for (let index = 0; index < 10; index += 1) {
			await transferFundsPage.open();
			await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
			await transferFundsPage.expectSuccessful();
		}
		await accountsOverviewPage.open();
		const updatedDestination = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === destination.accountNumber);
		expect(updatedDestination?.balance).toBeCloseTo(openingBalance + transferTotal, 2);
	});

	test('TRF-019 @transfers @regression @ledger - 20 ledger entries exist', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountActivityPage, accountUser }) => {
		const accounts = await ensureAtLeastTwoAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		for (let index = 0; index < 10; index += 1) {
			await transferFundsPage.open();
			await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
			await transferFundsPage.expectSuccessful();
		}
		await accountActivityPage.open(source.accountNumber);
		await accountActivityPage.expectDisplayed();
		const sourceRows = await accountActivityPage.rows();
		expect(sourceRows.length).toBeGreaterThanOrEqual(10);
		await accountActivityPage.open(destination.accountNumber);
		await accountActivityPage.expectDisplayed();
		const destinationRows = await accountActivityPage.rows();
		expect(destinationRows.length).toBeGreaterThanOrEqual(10);
	});

	test('TRF-020 @transfers @regression @ledger - transfer history accurately reflects all transactions', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountActivityPage, accountUser }) => {
		const accounts = await ensureAtLeastTwoAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		for (let index = 0; index < 5; index += 1) {
			await transferFundsPage.open();
			await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
			await transferFundsPage.expectSuccessful();
		}
		await accountActivityPage.open(source.accountNumber);
		await accountActivityPage.expectDisplayed();
		const sourceRows = await accountActivityPage.rows();
		expect(sourceRows.length).toBeGreaterThanOrEqual(5);
		await accountActivityPage.open(destination.accountNumber);
		await accountActivityPage.expectDisplayed();
		const destinationRows = await accountActivityPage.rows();
		expect(destinationRows.length).toBeGreaterThanOrEqual(5);
	});
});
