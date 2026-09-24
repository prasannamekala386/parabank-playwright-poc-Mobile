import path from 'node:path';
import { BillPayment } from '../../pages/BillPayPage';
import { AccountsOverviewPage } from '../../pages/AccountsOverviewPage';
import { LoginPage } from '../../pages/LoginPage';
import { readCsvRecords } from '../../utils/csvReader';

export type BillerCsvRecord = {
	payeeName: string;
	address: string;
	city: string;
	state: string;
	zip: string;
	phone: string;
	accountNumber: string;
	verifyAccountNumber: string;
	amount: string;
};

export const validPayment: BillPayment = {
	payeeName: 'Electric Company',
	address: '1 Utility Street',
	city: 'Austin',
	state: 'Texas',
	zipCode: '78701',
	phoneNumber: '5125550100',
	accountNumber: '10001',
	verifyAccountNumber: '10001',
	amount: '1.00',
};

export async function loginAndCaptureBalance(loginPage: LoginPage, accountsOverviewPage: AccountsOverviewPage, credentials: { username: string; password: string }): Promise<{ accountNumber: string; balance: number }> {
	await loginPage.login(credentials.username, credentials.password);
	await accountsOverviewPage.open();
	const account = (await accountsOverviewPage.accountSummaries())[0];
	if (!account) {
		throw new Error('Bill payment precondition failed: no source account exists.');
	}
	return account;
}

export async function loadBillers(): Promise<BillPayment[]> {
	const records = await readCsvRecords<BillerCsvRecord>(path.resolve(process.cwd(), 'data/billers.csv'));
	return records.map((record) => ({
		payeeName: record.payeeName,
		address: record.address,
		city: record.city,
		state: record.state,
		zipCode: record.zip,
		phoneNumber: record.phone,
		accountNumber: record.accountNumber,
		verifyAccountNumber: record.verifyAccountNumber,
		amount: record.amount,
	}));
}
