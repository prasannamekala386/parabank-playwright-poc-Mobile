import { expect } from '../../fixtures/testFixtures';
import { AccountSummary } from '../../pages/AccountsOverviewPage';

export type LendingAccounts = {
	loanSource: AccountSummary;
	fundingSource: AccountSummary;
};

export async function prepareLendingAccounts({ loginPage, accountsOverviewPage, openAccountPage, transferFundsPage, accountUser }: any, targetBalance = 25): Promise<LendingAccounts> {
	if (!(await loginPage.isAuthenticated())) {
		await loginPage.login(accountUser.username, accountUser.password);
	}
	await accountsOverviewPage.open();
	let accounts: AccountSummary[] = await accountsOverviewPage.accountSummaries();
	for (let attempt = 0; accounts.length < 2 && attempt < 2; attempt += 1) {
		await openAccountPage.open();
		await openAccountPage.createSavingsAccount();
		await openAccountPage.expectCreated();
		await accountsOverviewPage.open();
		accounts = await accountsOverviewPage.accountSummaries();
	}
	if (accounts.length < 2) throw new Error('Lending setup requires two accounts.');

	let fundingSource = [...accounts].sort((left, right) => right.balance - left.balance)[0];
	let loanSource = accounts.find((account) => account.accountNumber !== fundingSource.accountNumber);
	if (!loanSource) throw new Error('Lending setup could not identify a loan source account.');

	const difference = Number((targetBalance - loanSource.balance).toFixed(2));
	if (difference > 0) {
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(fundingSource.accountNumber, loanSource.accountNumber, difference.toFixed(2));
		await transferFundsPage.expectSuccessful();
	} else if (difference < 0) {
		await transferFundsPage.open();
		await transferFundsPage.transferBetween(loanSource.accountNumber, fundingSource.accountNumber, Math.abs(difference).toFixed(2));
		await transferFundsPage.expectSuccessful();
	}
	const loanSourceNumber = loanSource.accountNumber;
	const fundingSourceNumber = fundingSource.accountNumber;
	await accountsOverviewPage.open();
	accounts = await accountsOverviewPage.accountSummaries();
	loanSource = accounts.find((account) => account.accountNumber === loanSourceNumber) as AccountSummary;
	fundingSource = accounts.find((account) => account.accountNumber === fundingSourceNumber) as AccountSummary;
	expect(loanSource.balance).toBeCloseTo(targetBalance, 2);
	return { loanSource, fundingSource };
}

export async function expectApprovedLoan({ loanPage, application }: any): Promise<string> {
	await loanPage.open();
	await loanPage.apply(application);
	await loanPage.expectApproved();
	await loanPage.expectAccountCreated();
	const loanAccountNumber = await loanPage.loanAccountNumber();
	expect(loanAccountNumber).toMatch(/^\d+$/);
	return loanAccountNumber;
}

export async function verifyLoanActivity({ accountsOverviewPage, accountActivityPage, loanAccountNumber, transferFundsPage, destinationAccountNumber }: any): Promise<void> {
	await transferFundsPage.open();
	await transferFundsPage.transferBetween(loanAccountNumber, destinationAccountNumber, '1.00');
	await transferFundsPage.expectSuccessful();
	await accountsOverviewPage.open();
	await accountActivityPage.open(loanAccountNumber);
	await accountActivityPage.expectDisplayed();
	await accountActivityPage.expectContainsTransferEntry(/transfer/i);
}
