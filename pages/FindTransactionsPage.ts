import { expect, Locator, Page } from '@playwright/test';

export type SearchTransaction = {
	id: string;
	date: string;
	description: string;
	amount: number;
	balance: number;
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
		await this.runSearch(this.fromDate, fromDate);
		await this.toDate.fill(toDate);
		await this.page.locator('#findByDateRange').click();
	}

	async searchByAmount(amount: string): Promise<void> {
		await this.runSearch(this.amount, amount, 'findByAmount');
	}

	async rows(): Promise<SearchTransaction[]> {
		const rows = this.resultsTable.locator('tbody tr');
		const entries: SearchTransaction[] = [];
		for (let index = 0; index < await rows.count(); index += 1) {
			const cells = rows.nth(index).locator('td');
			const values = await cells.allTextContents();
			if (values.length < 4 || !/^\d+$/.test(values[0].trim())) continue;
			entries.push({
				id: values[0].trim(),
				date: values[1].trim(),
				description: values[2].trim(),
				amount: Number.parseFloat(values[3].replace(/[$,]/g, '')),
				balance: Number.parseFloat((values[4] ?? '').replace(/[$,]/g, '')),
			});
		}
		return entries;
	}

	async expectResults(): Promise<void> {
		await expect(this.resultsTable).toBeVisible();
		await expect(this.resultsTable.locator('tbody tr').first()).toBeVisible();
	}

	async expectNoResults(): Promise<void> {
		await expect(this.page.locator('body')).toContainText(/No transactions found|No results|not found/i);
	}

	private async runSearch(field: Locator, value: string, buttonId: string): Promise<void> {
		await field.fill(value);
		await this.page.locator(`#${buttonId}`).click();
		await this.page.waitForLoadState('networkidle');
	}
}
