import { expect, Locator, Page } from '@playwright/test';

export type ActivityRow = {
	id: string;
	date: string;
	description: string;
	amount: number;
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
		const accountLink = this.page.locator(`#accountTable a[href$="id=${accountNumber}"]`);
		await expect(accountLink).toBeVisible({ timeout: 15000 });
		await accountLink.click();
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
			if (await cells.count() < 4) continue;
			const link = cells.nth(1).locator('a');
			const href = await link.getAttribute('href');
			const id = href ? new URL(href, this.page.url()).searchParams.get('id') : null;
			const date = (await cells.nth(0).textContent())?.trim() ?? '';
			const description = (await link.textContent())?.trim() ?? '';
			const debit = (await cells.nth(2).textContent())?.trim() ?? '';
			const credit = (await cells.nth(3).textContent())?.trim() ?? '';
			const amount = Number.parseFloat((debit || credit).replace(/[$,]/g, ''));
			if (id && date && description && Number.isFinite(amount)) {
				entries.push({ id, date, description, amount });
			}
		}
		return entries;
	}

	async expectContainsTransferEntry(description: RegExp): Promise<void> {
		await expect(this.page.locator('#transactionTable tbody tr').filter({ hasText: description }).first()).toBeVisible();
	}

	async expectContainsBillPayment(amount: string): Promise<void> {
		await expect.poll(async () => {
			await this.refreshResults();
			return await this.page.locator('#transactionTable tbody tr').filter({ hasText: new RegExp(`Bill Pay|${amount.replace('.', '\\.')}`, 'i') }).count();
		}, { timeout: 15000, intervals: [1000, 2000] }).toBeGreaterThan(0);
	}

	async expectBillPaymentCount(expectedCount: number): Promise<void> {
		await expect.poll(async () => {
			await this.refreshResults();
			return (await this.rows()).filter((row) => /bill pay/i.test(row.description)).length;
		}, { timeout: 20000, intervals: [1000, 2000] }).toBe(expectedCount);
	}

	private async refreshResults(): Promise<void> {
		await this.page.reload();
		await expect(this.transactionTable).toBeVisible();
		await this.page.getByRole('button', { name: 'Go' }).click();
		await this.page.waitForLoadState('networkidle');
	}
}
