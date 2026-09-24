import { expect, test } from '../../fixtures/testFixtures';
import { loginAndCaptureBalance, loadBillers } from './billpayTestUtils';

test('E2E-BILL-001 @billpay @regression @e2e @csv @ledger - ten CSV bill payments reconcile to the ledger', async ({ loginPage, accountsOverviewPage, billPayPage, accountActivityPage, accountUser }) => {
	const billers = await loadBillers();
	expect(billers).toHaveLength(10);
	const source = await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
	const totalPayments = billers.reduce((total, biller) => total + Number(biller.amount), 0);

	for (const biller of billers) {
		await test.step(`Pay ${biller.payeeName}`, async () => {
			await billPayPage.open();
			await billPayPage.pay(biller);
			await billPayPage.expectSuccessful();
		});
	}

	await accountsOverviewPage.waitForBalance(source.accountNumber, source.balance - totalPayments);

	await accountActivityPage.open(source.accountNumber);
	await accountActivityPage.expectDisplayed();
	await accountActivityPage.expectBillPaymentCount(billers.length);
});
