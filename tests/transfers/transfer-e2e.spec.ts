import { expect, test } from '../../fixtures/testFixtures';
import { ensureTransferAccounts } from './transferTestUtils';

test.describe('ParaBank Day 4 Transfer E2E', () => {
	test.setTimeout(60000);

	test('E2E-TRF-001 @transfers @regression @e2e @reconciliation - full transfer lifecycle is validated', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountActivityPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		const openingSource = source.balance;
		const openingDestination = destination.balance;

		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '10.00');
		await transferFundsPage.expectSuccessful();
		await accountsOverviewPage.open();
		const afterTransfer = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === source.accountNumber);
		expect(afterTransfer?.balance).toBeCloseTo(openingSource - 10, 2);

		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, String(openingSource - 10));
		await transferFundsPage.expectSuccessful();
		await accountsOverviewPage.open();
		const zeroedSource = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === source.accountNumber);
		expect(zeroedSource?.balance).toBeCloseTo(0, 2);

		for (let index = 0; index < 10; index += 1) {
			await transferFundsPage.open();
			await transferFundsPage.transferBetween(destination.accountNumber, source.accountNumber, '1.00');
			await transferFundsPage.expectSuccessful();
		}
		await accountsOverviewPage.open();
		const finalSource = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === source.accountNumber);
		const finalDestination = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === destination.accountNumber);
		expect(finalSource?.balance).toBeGreaterThanOrEqual(0);
		expect(finalDestination?.balance).toBeGreaterThanOrEqual(0);

		await accountActivityPage.open(source.accountNumber);
		await accountActivityPage.expectDisplayed();
		const sourceRows = await accountActivityPage.rows();
		expect(sourceRows.length).toBeGreaterThanOrEqual(10);
		await accountActivityPage.open(destination.accountNumber);
		await accountActivityPage.expectDisplayed();
		const destinationRows = await accountActivityPage.rows();
		expect(destinationRows.length).toBeGreaterThanOrEqual(10);
		expect(Math.abs((finalSource?.balance ?? 0) + (finalDestination?.balance ?? 0) - (openingSource + openingDestination))).toBeLessThanOrEqual(0.05);
	});
});
