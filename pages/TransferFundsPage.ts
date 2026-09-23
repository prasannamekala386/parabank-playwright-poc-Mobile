import { expect, Locator, Page } from '@playwright/test';

export class TransferFundsPage {
	readonly amount: Locator;
	readonly sourceAccount: Locator;
	readonly destinationAccount: Locator;

	constructor(private readonly page: Page) {
		this.amount = page.locator('#amount');
		this.sourceAccount = page.locator('#fromAccountId');
		this.destinationAccount = page.locator('#toAccountId');
	}

	async open(): Promise<void> {
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.page.goto('transfer.htm');
			if (await this.page.getByRole('heading', { name: 'Error!' }).isVisible({ timeout: 1000 }).catch(() => false)) {
				continue;
			}
			await expect.poll(async () => this.sourceAccount.locator('option').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
			await expect.poll(async () => this.destinationAccount.locator('option').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
			return;
		}
		throw new Error('Transfer page remained unavailable after retries.');
	}

	async transfer(amount: string): Promise<void> {
		await this.sourceAccount.selectOption({ index: 0 });
		await this.destinationAccount.selectOption({ index: 1 });
		await this.amount.fill(amount);
		await this.page.getByRole('button', { name: 'Transfer' }).click();
	}

	async transferBetween(sourceAccountNumber: string, destinationAccountNumber: string, amount: string): Promise<void> {
		await this.sourceAccount.selectOption({ label: sourceAccountNumber });
		await this.destinationAccount.selectOption({ label: destinationAccountNumber });
		await this.amount.fill(amount);
		await this.page.getByRole('button', { name: 'Transfer' }).click();
	}

	async transferFromAccountToItself(accountNumber: string, amount: string): Promise<void> {
		await this.sourceAccount.selectOption({ label: accountNumber });
		await this.destinationAccount.selectOption({ label: accountNumber });
		await this.amount.fill(amount);
		await this.page.getByRole('button', { name: 'Transfer' }).click();
	}

	async expectSuccessful(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: 'Transfer Complete' })).toBeVisible();
	}

	async expectValidationMessage(pattern: RegExp = /amount|error|same|balance|invalid/i): Promise<void> {
		const error = this.page.locator('#rightPanel .error, .error').first();
		await expect(error).toContainText(pattern);
	}
}
