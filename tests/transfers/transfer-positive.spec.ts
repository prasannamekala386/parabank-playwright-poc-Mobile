import { expect, test } from '../../fixtures/testFixtures';
import { ensureTransferAccounts } from './transferTestUtils';

test.describe('ParaBank Day 4 Transfer Positive', () => {
	test.setTimeout(60000);

	test('TRF-001 @transfers @regression - transfer between two valid accounts succeeds', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		expect(accounts.length).toBeGreaterThanOrEqual(2);
		const source = accounts[0];
		const destination = accounts[1];
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
		await transferFundsPage.expectSuccessful();
	});

	test('TRF-002 @transfers @regression - source account balance is debited', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		const beforeSource = source.balance;
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
		await transferFundsPage.expectSuccessful();
		await accountsOverviewPage.open();
		const updated = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === source.accountNumber);
		expect(updated?.balance).toBeCloseTo(beforeSource - 1, 2);
	});

	test('TRF-003 @transfers @regression - destination account balance is credited', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		const destination = accounts[1];
		const beforeDestination = destination.balance;
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, destination.accountNumber, '1.00');
		await transferFundsPage.expectSuccessful();
		await accountsOverviewPage.open();
		const updated = (await accountsOverviewPage.accountSummaries()).find((account) => account.accountNumber === destination.accountNumber);
		expect(updated?.balance).toBeCloseTo(beforeDestination + 1, 2);
	});

	test('TRF-004 @transfers @regression - transfer confirmation message is displayed', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(accounts[0].accountNumber, accounts[1].accountNumber, '1.00');
		await transferFundsPage.expectSuccessful();
	});

	test('TRF-005 @transfers @regression @ledger - source account ledger contains debit entry', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountActivityPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const source = accounts[0];
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(source.accountNumber, accounts[1].accountNumber, '1.00');
		await transferFundsPage.expectSuccessful();
		await accountActivityPage.open(source.accountNumber);
		await accountActivityPage.expectDisplayed();
		await accountActivityPage.expectContainsTransferEntry(/Transfer|Debit|Withdrawal|Credit/i);
	});

	test('TRF-006 @transfers @regression @ledger - destination account ledger contains credit entry', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountActivityPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		const destination = accounts[1];
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(accounts[0].accountNumber, destination.accountNumber, '1.00');
		await transferFundsPage.expectSuccessful();
		await accountActivityPage.open(destination.accountNumber);
		await accountActivityPage.expectDisplayed();
		await accountActivityPage.expectContainsTransferEntry(/Transfer|Credit|Deposit/i);
	});
});
