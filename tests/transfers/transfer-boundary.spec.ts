import { expect, test } from '../../fixtures/testFixtures';
import { ensureTransferAccounts } from './transferTestUtils';

test.describe('ParaBank Day 4 Transfer Boundaries', () => {
	test.setTimeout(60000);

	test('TRF-007 @transfers @regression - full account balance can be transferred', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, String(source.balance));
		await transferFundsPage.expectSuccessful();
	});

	test('TRF-008 @transfers @regression - balance becomes zero after full-balance transfer', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, String(source.balance));
		await transferFundsPage.expectSuccessful();
		await accountsOverviewPage.open();
		const updated = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === source.accountNumber);
		expect(updated?.balance).toBeCloseTo(0, 2);
	});

	test('TRF-009 @transfers @regression - destination account receives full transferred amount', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		const beforeDestination = destination.balance;
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, String(source.balance));
		await transferFundsPage.expectSuccessful();
		await accountsOverviewPage.open();
		const updated = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === destination.accountNumber);
		expect(updated?.balance).toBeCloseTo(beforeDestination + source.balance, 2);
	});
});
