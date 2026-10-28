import { expect, Locator, Page } from '@playwright/test';

export type BillPayment = {
	payeeName: string;
	address: string;
	city: string;
	state: string;
	zipCode: string;
	phoneNumber: string;
	accountNumber: string;
	verifyAccountNumber: string;
	amount: string;
	fromAccountNumber?: string;
};

export class BillPayPage {
	readonly payeeName: Locator;
	readonly address: Locator;
	readonly city: Locator;
	readonly state: Locator;
	readonly zipCode: Locator;
	readonly phoneNumber: Locator;
	readonly accountNumber: Locator;
	readonly verifyAccountNumber: Locator;
	readonly amount: Locator;
	readonly fromAccount: Locator;

	constructor(private readonly page: Page) {
		this.payeeName = page.locator('input[name="payee.name"]');
		this.address = page.locator('input[name="payee.address.street"]');
		this.city = page.locator('input[name="payee.address.city"]');
		this.state = page.locator('input[name="payee.address.state"]');
		this.zipCode = page.locator('input[name="payee.address.zipCode"]');
		this.phoneNumber = page.locator('input[name="payee.phoneNumber"]');
		this.accountNumber = page.locator('input[name="payee.accountNumber"]');
		this.verifyAccountNumber = page.locator('input[name="verifyAccount"]');
		this.amount = page.locator('input[name="amount"]');
		this.fromAccount = page.locator('select[name="fromAccountId"]');
	}

	async open(): Promise<void> {
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.page.goto('billpay.htm');
			if (await this.page.getByRole('heading', { name: 'Error!' }).isVisible({ timeout: 1000 }).catch(() => false)) {
				continue;
			}
			await expect(this.payeeName).toBeVisible({ timeout: 15000 });
			return;
		}
		throw new Error('Bill Pay page remained unavailable after retries.');
	}

	async fillPayment(payment: Partial<BillPayment>): Promise<void> {
		for (const field of [this.payeeName, this.address, this.city, this.state, this.zipCode, this.phoneNumber, this.accountNumber, this.verifyAccountNumber, this.amount]) {
			await field.fill('');
		}
		const values: Array<[Locator, string | undefined]> = [
			[this.payeeName, payment.payeeName],
			[this.address, payment.address],
			[this.city, payment.city],
			[this.state, payment.state],
			[this.zipCode, payment.zipCode],
			[this.phoneNumber, payment.phoneNumber],
			[this.accountNumber, payment.accountNumber],
			[this.verifyAccountNumber, payment.verifyAccountNumber],
			[this.amount, payment.amount],
		];
		for (const [field, value] of values) {
			if (value !== undefined) {
				await field.fill(value);
			}
		}
		if (payment.fromAccountNumber) {
			await this.fromAccount.selectOption({ label: payment.fromAccountNumber });
		} else {
			await this.fromAccount.selectOption({ index: 0 });
		}
	}

	async submit(): Promise<void> {
		const submitButton = this.page.locator('input.button[value="Send Payment"]');
		await submitButton.scrollIntoViewIfNeeded();
		await submitButton.click({ force: true, trial: false });
	}

	async pay(payment: BillPayment): Promise<void> {
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.fillPayment(payment);
			await this.submit();
			if (!(await this.page.getByRole('heading', { name: 'Error!' }).isVisible({ timeout: 1000 }).catch(() => false))) {
				return;
			}
			await this.open();
		}
		throw new Error('Bill payment remained unavailable after retries.');
	}

	async expectSuccessful(): Promise<void> {
		await expect(this.page.locator('#rightPanel')).toContainText(/Bill Payment Complete|payment.*successful|successful.*payment/i);
	}

	async expectConfirmation(): Promise<void> {
		await expect(this.page.locator('#rightPanel')).toContainText(/payment|complete|success/i);
	}

	async expectValidationMessage(): Promise<void> {
		await expect(this.page.locator('#rightPanel .error:visible, .error:visible').first()).toBeVisible();
	}
}
