import { expect, Locator, Page } from '@playwright/test';

export type ActivityRow = {
	date: string;
	description: string;
	amount: number;
	balance: number;
};

export class AccountActivityPage {
	readonly transactionTable: Locator;
	readonly accountNumber: Locator;

	constructor(private readonly page: Page) {
		this.transactionTable = page.locator('#transactionTable');
		this.accountNumber = page.locator('table#transactionTable tbody tr td:nth-child(1)');
	}

	async open(accountNumber: string): Promise<void> {
		await this.page.getByRole('link', { name: 'Accounts Overview' }).click();
		await this.page.locator('#accountTable tbody tr').filter({ hasText: accountNumber }).getByRole('link').click();
	}

	async expectDisplayed(): Promise<void> {
		await expect(this.transactionTable).toBeVisible();
		await this.page.getByRole('button', { name: 'Go' }).click();
		await this.page.waitForLoadState('networkidle');
	}

	async rows(): Promise<ActivityRow[]> {
		const rows = this.page.locator('#transactionTable tbody tr');
		const entries: ActivityRow[] = [];
		for (let index = 0; index < await rows.count(); index += 1) {
			const cells = rows.nth(index).locator('td');
			const date = (await cells.nth(0).textContent())?.trim() ?? '';
			const description = (await cells.nth(1).textContent())?.trim() ?? '';
			const amountText = (await cells.nth(2).textContent())?.trim() ?? '';
			const balanceText = (await cells.nth(3).textContent())?.trim() ?? '';
			const amount = Number.parseFloat(amountText.replace(/[$,]/g, ''));
			const balance = Number.parseFloat(balanceText.replace(/[$,]/g, ''));
			if (date && description) {
				entries.push({ date, description, amount, balance });
			}
		}
		return entries;
	}

	async expectContainsTransferEntry(description: RegExp): Promise<void> {
		await expect(this.page.locator('#transactionTable tbody tr').filter({ hasText: description }).first()).toBeVisible();
	}
}
