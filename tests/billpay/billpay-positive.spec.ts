import { expect, test } from '../../fixtures/testFixtures';
import { loginAndCaptureBalance, validPayment } from './billpayTestUtils';

test.describe('ParaBank Day 5 Bill Payments - Positive', () => {
	test('BILL-001 @billpay @regression - valid payment confirms and debits the source account', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		const source = await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay(validPayment);
		await billPayPage.expectSuccessful();
		await billPayPage.expectConfirmation();
		await accountsOverviewPage.waitForBalance(source.accountNumber, source.balance - Number(validPayment.amount));
	});

	test('BILL-004 @billpay @regression @ledger - payment appears in Account Activity', async ({ loginPage, accountsOverviewPage, billPayPage, accountActivityPage, accountUser }) => {
		const source = await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay(validPayment);
		await billPayPage.expectSuccessful();
		await accountActivityPage.open(source.accountNumber);
		await accountActivityPage.expectDisplayed();
		await accountActivityPage.expectContainsBillPayment(validPayment.amount);
	});

	test('BILL-019 @billpay @regression @ledger - paying the same biller twice creates two debits', async ({ loginPage, accountsOverviewPage, billPayPage, accountActivityPage, accountUser }) => {
		const source = await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		for (let payment = 0; payment < 2; payment += 1) {
			await billPayPage.open();
			await billPayPage.pay(validPayment);
			await billPayPage.expectSuccessful();
		}

		await accountsOverviewPage.waitForBalance(source.accountNumber, source.balance - 2 * Number(validPayment.amount));
		await accountActivityPage.open(source.accountNumber);
		await accountActivityPage.expectDisplayed();
		await accountActivityPage.expectBillPaymentCount(2);
	});
});
