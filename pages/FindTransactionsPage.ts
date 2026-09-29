import { expect, Locator, Page } from '@playwright/test';

export type SearchTransaction = {
	id: string;
	date: string;
	description: string;
	amount: number;
};

export class FindTransactionsPage {
	readonly account: Locator;
	readonly transactionId: Locator;
	readonly transactionDate: Locator;
	readonly fromDate: Locator;
	readonly toDate: Locator;
	readonly amount: Locator;
	readonly resultsTable: Locator;

	constructor(private readonly page: Page) {
		this.account = page.locator('#accountId');
		this.transactionId = page.locator('#transactionId');
		this.transactionDate = page.locator('#transactionDate');
		this.fromDate = page.locator('#fromDate');
		this.toDate = page.locator('#toDate');
		this.amount = page.locator('#amount');
		this.resultsTable = page.locator('#transactionTable');
	}

	async open(): Promise<void> {
		await this.page.goto('findtrans.htm');
		await expect(this.page.getByRole('heading', { name: 'Find Transactions' })).toBeVisible();
	}

	async selectAccount(accountNumber: string): Promise<void> {
		await this.account.selectOption({ label: accountNumber });
	}

	async searchByTransactionId(transactionId: string): Promise<void> {
		await this.runSearch(this.transactionId, transactionId, 'findById');
	}

	async searchByDate(date: string): Promise<void> {
		await this.runSearch(this.transactionDate, date, 'findByDate');
	}

	async searchByDateRange(fromDate: string, toDate: string): Promise<void> {
		await this.fromDate.fill(fromDate);
		await this.toDate.fill(toDate);
		await this.page.locator('#findByDateRange').click();
		await this.page.waitForLoadState('networkidle');
	}

	async searchByAmount(amount: string): Promise<void> {
		await this.runSearch(this.amount, amount, 'findByAmount');
	}

	async rows(): Promise<SearchTransaction[]> {
		const rows = this.resultsTable.locator('tbody tr');
		const entries: SearchTransaction[] = [];
		for (let index = 0; index < await rows.count(); index += 1) {
			const cells = rows.nth(index).locator('td');
			if (await cells.count() < 4) continue;
			const link = cells.nth(1).locator('a');
			const href = await link.getAttribute('href');
			const id = href ? new URL(href, this.page.url()).searchParams.get('id') : null;
			const date = (await cells.nth(0).textContent())?.trim() ?? '';
			const description = (await link.textContent())?.trim() ?? '';
			const debit = (await cells.nth(2).textContent())?.trim() ?? '';
			const credit = (await cells.nth(3).textContent())?.trim() ?? '';
			const amount = Number.parseFloat((debit || credit).replace(/[$,]/g, ''));
			if (!id || !date || !description || !Number.isFinite(amount)) continue;
			entries.push({
				id,
				date,
				description,
				amount,
			});
		}
		return entries;
	}

	async expectResults(): Promise<void> {
		await expect(this.resultsTable).toBeVisible();
		await expect(this.resultsTable.locator('tbody tr').first()).toBeVisible();
	}

	async expectNoResults(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: 'Error!' })).toHaveCount(0);
		await expect(this.resultsTable).toBeVisible();
		await expect(this.resultsTable.locator('tbody tr')).toHaveCount(0);
	}

	async expectDateValidationMessage(): Promise<void> {
		await expect(this.page.getByText('Invalid date format', { exact: true })).toBeVisible();
	}

	private async runSearch(field: Locator, value: string, buttonId: string): Promise<void> {
		await field.fill(value);
		await this.page.locator(`#${buttonId}`).click();
		await this.page.waitForLoadState('networkidle');
	}
}
