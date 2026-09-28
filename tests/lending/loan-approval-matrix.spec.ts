import { expect, test } from '../../fixtures/testFixtures';
import matrix from '../../data/loanApprovalMatrix.json';
import { expectApprovedLoan, prepareLendingAccounts, verifyLoanActivity } from './lendingTestUtils';

type MatrixRow = (typeof matrix)[number];

async function verifyMatrixRow(fixtures: any, row: MatrixRow): Promise<string | undefined> {
	const accounts = await prepareLendingAccounts(fixtures, row.availableBalance);
	await fixtures.loanPage.open();
	await fixtures.loanPage.apply({ loanAmount: row.loanAmount, downPayment: row.downPayment, fromAccountNumber: accounts.loanSource.accountNumber });
	if (row.expectedOutcome === 'approved') {
		await fixtures.loanPage.expectApproved();
		return fixtures.loanPage.loanAccountNumber();
	}
	await fixtures.loanPage.expectProcessed();
	return fixtures.loanPage.loanAccountNumber();
}

test.describe('ParaBank Day 7 data-driven lending approval matrix', () => {
	test('LOAN-012 @lending @regression @loan @approval - approval matrix combination 1 matches expected outcome', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const loanAccountNumber = await verifyMatrixRow(fixtures, matrix[0]);
		expect(loanAccountNumber).toMatch(/^\d+$/);
	});

	test('LOAN-013 @lending @regression @loan @approval - approval matrix combination 2 matches expected outcome', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const loanAccountNumber = await verifyMatrixRow(fixtures, matrix[1]);
		expect(loanAccountNumber).toMatch(/^\d+$/);
	});

	test('LOAN-014 @lending @regression @loan @negative - approval matrix combination 3 matches expected outcome', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountUser };
		const loanAccountNumber = await verifyMatrixRow(fixtures, matrix[2]);
		expect(loanAccountNumber).toMatch(/^\d+$/);
	});

	test('LOAN-015 @lending @regression @loan @e2e @approval - matrix combinations 4 and 5 plus flagship lending journey reconcile', async ({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountActivityPage, billPayPage, apiHelper, accountUser }) => {
		const fixtures = { loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, loanPage, accountActivityPage, billPayPage, apiHelper, accountUser };
		await verifyMatrixRow(fixtures, matrix[3]);
		const accounts = await prepareLendingAccounts(fixtures, matrix[4].availableBalance);
		const loanAccountNumber = await expectApprovedLoan({
			...fixtures,
			application: {
				loanAmount: matrix[4].loanAmount,
				downPayment: matrix[4].downPayment,
				fromAccountNumber: accounts.loanSource.accountNumber,
			},
		});

		await fixtures.accountsOverviewPage.open();
		await fixtures.accountsOverviewPage.expectAccountDisplayed(loanAccountNumber);
		const beforeTransfer = await fixtures.apiHelper.getAccount(loanAccountNumber);
		await verifyLoanActivity({ ...fixtures, loanAccountNumber, destinationAccountNumber: accounts.fundingSource.accountNumber });
		const afterTransfer = await fixtures.apiHelper.getAccount(loanAccountNumber);
		expect(afterTransfer.balance).toBeCloseTo(beforeTransfer.balance - 1, 2);

		await fixtures.billPayPage.open();
		await fixtures.billPayPage.pay({
			payeeName: 'Electric Company',
			address: '1 Utility Street',
			city: 'Austin',
			state: 'Texas',
			zipCode: '78701',
			phoneNumber: '5125550100',
			accountNumber: '10001',
			verifyAccountNumber: '10001',
			amount: '1.00',
			fromAccountNumber: loanAccountNumber,
		});
		await fixtures.billPayPage.expectSuccessful();

		const afterBillPayment = await fixtures.apiHelper.getAccount(loanAccountNumber);
		expect(afterBillPayment.balance).toBeCloseTo(afterTransfer.balance - 1, 2);
		const transactions = await fixtures.apiHelper.getTransactions(afterBillPayment.accountId);
		expect(transactions.length).toBeGreaterThanOrEqual(2);
		await fixtures.accountActivityPage.open(loanAccountNumber);
		await fixtures.accountActivityPage.expectDisplayed();
		const rows = await fixtures.accountActivityPage.rows();
		expect(rows.some((row: { description: string }) => /transfer/i.test(row.description))).toBeTruthy();
		expect(rows.some((row: { description: string }) => /bill pay/i.test(row.description))).toBeTruthy();
		expect(rows[0]?.date).toBeTruthy();
	});
});
