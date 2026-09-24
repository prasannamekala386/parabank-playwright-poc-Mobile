import { test } from '../../fixtures/testFixtures';
import { BillPayment } from '../../pages/BillPayPage';
import { loginAndCaptureBalance, validPayment } from './billpayTestUtils';

const requiredFields: Array<{ id: string; label: string; field: keyof BillPayment }> = [
	{ id: '005', label: 'payee name', field: 'payeeName' },
	{ id: '006', label: 'address', field: 'address' },
	{ id: '007', label: 'city', field: 'city' },
	{ id: '008', label: 'state', field: 'state' },
	{ id: '009', label: 'zip code', field: 'zipCode' },
	{ id: '010', label: 'phone number', field: 'phoneNumber' },
	{ id: '011', label: 'account number', field: 'accountNumber' },
	{ id: '012', label: 'verify account number', field: 'verifyAccountNumber' },
	{ id: '013', label: 'amount', field: 'amount' },
];

test.describe('ParaBank Day 5 Bill Payments - Validation', () => {
	for (const requiredField of requiredFields) {
		test(`BILL-${requiredField.id} @billpay @regression @negative - ${requiredField.label} is mandatory`, async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
			await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
			await billPayPage.open();
			const payment = { ...validPayment } as Partial<BillPayment>;
			delete payment[requiredField.field];
			await billPayPage.fillPayment(payment);
			await billPayPage.submit();
			await billPayPage.expectValidationMessage();
		});
	}

	test('BILL-014 @billpay @regression @negative - mismatched account verification is rejected', async ({ loginPage, accountsOverviewPage, billPayPage, accountUser }) => {
		await loginAndCaptureBalance(loginPage, accountsOverviewPage, accountUser);
		await billPayPage.open();
		await billPayPage.fillPayment({ ...validPayment, verifyAccountNumber: 'DIFFERENT-PAYEE' });
		await billPayPage.submit();
		await billPayPage.expectValidationMessage();
	});
});
