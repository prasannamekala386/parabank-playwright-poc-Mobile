import { expect, test } from '../../fixtures/testFixtures';
import { loginAndCaptureBalance, validPayment } from './billpayTestUtils';

test.describe('ParaBank Day 5 Bill Payments - Positive', () => {
	test('BILL-001 @billpay @regression - valid payee payment succeeds', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		await test.step('Log in and prepare the source account', async () => {
			await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		});
		await test.step('Submit a valid bill payment', async () => {
			await billPayPage.open();
			await billPayPage.pay(validPayment);
		});
		await billPayPage.expectSuccessful();
	});

	test('BILL-002 @billpay @regression - payment confirmation is displayed', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay(validPayment);
		await billPayPage.expectConfirmation();
	});

	test('BILL-003 @billpay @regression - source account is debited', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		const source = await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay(validPayment);
		await billPayPage.expectSuccessful();
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
});
