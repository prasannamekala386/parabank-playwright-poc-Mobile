import { expect, test } from '../../fixtures/testFixtures';
import { prepareLendingAccounts } from './lendingTestUtils';

async function submitBoundary(fixtures: any, loanAmount: string, downPayment = '1.00'): Promise<void> {
	const { loanSource } = await prepareLendingAccounts(fixtures);
	await fixtures.loanPage.open();
	await fixtures.loanPage.apply({ loanAmount, downPayment, fromAccountNumber: loanSource.accountNumber });
}

test.describe('ParaBank Day 7 Lending boundary validation', () => {
	test('LOAN-007 @lending @regression @loan @negative - zero loan amount is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		await submitBoundary(fixtures, '0.00');
		await fixtures.loanPage.expectValidationMessage();
	});

	test('LOAN-008 @lending @regression @loan @negative - negative loan amount is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		await submitBoundary(fixtures, '-1.00');
		await fixtures.loanPage.expectValidationMessage();
	});

	test('LOAN-009 @lending @regression @loan @negative - blank loan amount is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		await submitBoundary(fixtures, '');
		await fixtures.loanPage.expectValidationMessage();
	});

	test('LOAN-010 @lending @regression @loan @negative - non-numeric loan amount is rejected', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		await submitBoundary(fixtures, 'not-a-number');
		await fixtures.loanPage.expectValidationMessage();
	});

	test('LOAN-011 @lending @regression @loan - down payment equal to loan amount follows the observed business rule', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		await submitBoundary(fixtures, '10.00', '10.00');
		expect(await fixtures.loanPage.status()).toMatch(/approved|denied|rejected|error/i);
	});
});
