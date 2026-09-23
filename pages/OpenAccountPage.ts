import { expect, Locator, Page } from '@playwright/test';

export class OpenAccountPage {
	readonly accountType: Locator;
	readonly sourceAccount: Locator;
	readonly createdAccount: Locator;

	constructor(private readonly page: Page) {
		this.accountType = page.locator('#type');
		this.sourceAccount = page.locator('#fromAccountId');
		this.createdAccount = page.locator('#newAccountId');
	}

	async open(): Promise<void> {
		await this.page.goto('openaccount.htm');
	}

	async createAccount(type: 'CHECKING' | 'SAVINGS' = 'CHECKING'): Promise<void> {
		await this.accountType.selectOption(type === 'CHECKING' ? '0' : '1');
		await this.sourceAccount.selectOption({ index: 0 });
		await this.page.getByRole('button', { name: 'Open New Account' }).click();
	}

	async createCheckingAccount(): Promise<void> {
		await this.createAccount('CHECKING');
	}

	async createSavingsAccount(): Promise<void> {
		await this.createAccount('SAVINGS');
	}

	async expectCreated(): Promise<void> {
		await expect(this.createdAccount).toBeVisible();
		await expect(this.createdAccount).toHaveText(/\d+/);
	}

	async accountNumber(): Promise<string> {
		const accountNumber = await this.createdAccount.evaluate((element) => {
			const candidates = [
				element.textContent,
				element.getAttribute('value'),
				element.getAttribute('href'),
				element.querySelector('a')?.textContent,
				element.querySelector('a')?.getAttribute('href'),
				element.parentElement?.textContent,
			];
			for (const candidate of candidates) {
				const accountNumber = candidate?.match(/\b\d{4,}\b/)?.[0];
				if (accountNumber) {
					return accountNumber;
				}
			}
			return '';
		});
		if (accountNumber) {
			return accountNumber;
		}
		return this.page.locator('a[href*="activity.htm?id="]').last().textContent().then((value) => value?.trim() ?? '');
	}
}
