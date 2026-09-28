import { expect, test } from '../../fixtures/testFixtures';
import { expectApprovedLoan, prepareLendingAccounts, verifyLoanActivity } from './lendingTestUtils';

test.describe('ParaBank Day 7 Lending positive scenarios', () => {
	test('LOAN-001 @lending @regression @loan @approval - valid loan application succeeds', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const { loanSource } = await prepareLendingAccounts(fixtures);
		await expectApprovedLoan({ ...fixtures, application: { loanAmount: '50.00', downPayment: '10.00', fromAccountNumber: loanSource.accountNumber } });
	});

	test('LOAN-002 @lending @regression @loan @approval - approved status is displayed', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const { loanSource } = await prepareLendingAccounts(fixtures);
		await fixtures.loanPage.open();
		await fixtures.loanPage.apply({ loanAmount: '50.00', downPayment: '10.00', fromAccountNumber: loanSource.accountNumber });
		await fixtures.loanPage.expectApproved();
		expect(await fixtures.loanPage.status()).toMatch(/approved/i);
	});

	test('LOAN-003 @lending @regression @loan @e2e - approved loan account appears and supports transfer', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountActivityPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountActivityPage, accountUser };
		const { loanSource, fundingSource } = await prepareLendingAccounts(fixtures);
		const loanAccountNumber = await expectApprovedLoan({ ...fixtures, application: { loanAmount: '50.00', downPayment: '10.00', fromAccountNumber: loanSource.accountNumber } });
		await fixtures.accountsOverviewPage.open();
		await fixtures.accountsOverviewPage.expectAccountDisplayed(loanAccountNumber);
		await verifyLoanActivity({ ...fixtures, loanAccountNumber, destinationAccountNumber: fundingSource.accountNumber });
	});

	test('LOAN-004 @lending @regression @loan - approved loan receives a unique account number', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const { loanSource } = await prepareLendingAccounts(fixtures);
		const loanAccountNumber = await expectApprovedLoan({ ...fixtures, application: { loanAmount: '50.00', downPayment: '10.00', fromAccountNumber: loanSource.accountNumber } });
		expect(loanAccountNumber).toMatch(/^\d{4,}$/);
	});
});
