import { test } from '../../fixtures/testFixtures';
import { prepareLendingAccounts } from './lendingTestUtils';

test.describe('ParaBank Day 7 Lending denied scenarios', () => {
	test('LOAN-005 @lending @regression @loan @negative - down payment over available balance is denied', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const { loanSource } = await prepareLendingAccounts(fixtures, 10);
		await fixtures.loanPage.open();
		await fixtures.loanPage.apply({ loanAmount: '50.00', downPayment: '25.00', fromAccountNumber: loanSource.accountNumber });
		await fixtures.loanPage.expectProcessed();
	});

	test('LOAN-006 @lending @regression @loan @negative - denied loan displays rejection messaging', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const { loanSource } = await prepareLendingAccounts(fixtures, 10);
		await fixtures.loanPage.open();
		await fixtures.loanPage.apply({ loanAmount: '50.00', downPayment: '25.00', fromAccountNumber: loanSource.accountNumber });
		await fixtures.loanPage.expectProcessed();
	});
});
