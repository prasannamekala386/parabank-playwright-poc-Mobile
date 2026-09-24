import { test } from '../../fixtures/testFixtures';
import { loginAndCaptureBalance, validPayment } from './billpayTestUtils';

test.describe('ParaBank Day 5 Bill Payments - Boundaries', () => {
	test('BILL-015 @billpay @regression - payment amount 0.01 succeeds', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay({ ...validPayment, amount: '0.01' });
		await billPayPage.expectSuccessful();
	});

	test('BILL-016 @billpay @regression @negative - zero amount is rejected', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay({ ...validPayment, amount: '0' });
		await billPayPage.expectValidationMessage();
	});

	test('BILL-017 @billpay @regression @negative - negative amount is rejected', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay({ ...validPayment, amount: '-1.00' });
		await billPayPage.expectValidationMessage();
	});

	test('BILL-018 @billpay @regression @negative - amount exceeding balance is prevented', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		const source = await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.pay({ ...validPayment, amount: String(source.balance + 1) });
		await billPayPage.expectValidationMessage();
	});
});
