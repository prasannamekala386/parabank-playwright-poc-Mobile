import { expect, test } from '../../fixtures/testFixtures';
import { ensureTransferAccounts } from './transferTestUtils';

test.describe('ParaBank Day 4 Transfer Negative', () => {
	test.setTimeout(60000);

	test('TRF-010 @transfers @regression @negative - transfer exceeding available balance is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(accounts[0].accountNumber, accounts[1].accountNumber, String(accounts[0].balance + 1));
		await transferFundsPage.expectValidationMessage(/insufficient|available|balance|amount/i);
	});

	test('TRF-011 @transfers @regression @negative - negative transfer amount is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(accounts[0].accountNumber, accounts[1].accountNumber, '-1.00');
		await transferFundsPage.expectValidationMessage(/negative|amount|invalid/i);
	});

	test('TRF-012 @transfers @regression @negative - zero transfer amount is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(accounts[0].accountNumber, accounts[1].accountNumber, '0.00');
		await transferFundsPage.expectValidationMessage(/amount|zero|invalid/i);
	});

	test('TRF-013 @transfers @regression @negative - non-numeric transfer amount is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(accounts[0].accountNumber, accounts[1].accountNumber, 'abc');
		await transferFundsPage.expectValidationMessage(/amount|numeric|invalid/i);
	});

	test('TRF-014 @transfers @regression @negative - amount with more than two decimals is handled correctly', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(accounts[0].accountNumber, accounts[1].accountNumber, '1.234');
		await transferFundsPage.expectValidationMessage(/amount|decimal|invalid|2|precision/i);
	});

	test('TRF-015 @transfers @regression @negative - same-account transfer is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }) => {
		const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
		await transferFundsPage.open();
		await transferFundsPage.transferFromAccountToItself(accounts[0].accountNumber, '1.00');
		await transferFundsPage.expectValidationMessage(/same|account|different|amount/i);
	});
});
