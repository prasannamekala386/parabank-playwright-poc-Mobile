import { expect, Locator, Page } from '@playwright/test';

export type AccountSummary = {
	accountNumber: string;
	balance: number;
};

export class AccountsOverviewPage {
	readonly accountNumbers: Locator;
	readonly balances: Locator;

	constructor(private readonly page: Page) {
		this.accountNumbers = page.locator('#accountTable tbody tr td:first-child a');
		this.balances = page.locator('#accountTable tbody tr td:nth-child(2)');
	}

	async open(): Promise<void> {
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.page.goto('overview.htm');
			if (!(await this.page.getByRole('heading', { name: 'Error!' }).isVisible({ timeout: 1000 }).catch(() => false))) {
				await expect(this.accountNumbers.first()).toBeVisible({ timeout: 15000 });
				return;
			}
		}
		throw new Error('Accounts Overview remained unavailable after retries.');
	}

	async expectDisplayed(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
		await expect(this.accountNumbers.first()).toBeVisible();
		await expect(this.balances.first()).toBeVisible();
	}

	async firstAccountNumber(): Promise<string> {
		return (await this.accountNumbers.first().textContent())?.trim() ?? '';
	}

	async openAccount(accountNumber: string): Promise<void> {
		await this.accountLink(accountNumber).click();
	}

	async expectAccountDisplayed(accountNumber: string): Promise<void> {
		await expect(this.accountLink(accountNumber)).toBeVisible();
	}

	private accountLink(accountNumber: string): Locator {
		return this.page.locator(`#accountTable a[href$="id=${accountNumber}"]`);
	}

	async accountSummaries(): Promise<AccountSummary[]> {
		await expect(this.accountNumbers.first()).toBeVisible();
		const rows = this.page.locator('#accountTable tbody tr');
		const summaries: AccountSummary[] = [];
		for (let index = 0; index < await rows.count(); index += 1) {
			const cells = rows.nth(index).locator('td');
			const accountNumber = (await cells.nth(0).textContent())?.trim() ?? '';
			const balanceText = (await cells.nth(1).textContent())?.trim() ?? '';
			const balance = Number.parseFloat(balanceText.replace(/[$,]/g, ''));
			if (/^\d+$/.test(accountNumber) && Number.isFinite(balance)) {
				summaries.push({ accountNumber, balance });
			}
		}
		return summaries;
	}

	async expectAllBalancesValid(): Promise<void> {
		const summaries = await this.accountSummaries();
		expect(summaries.length).toBeGreaterThan(0);
		for (const summary of summaries) {
			expect(summary.balance).toBeGreaterThanOrEqual(0);
		}
	}

	async totalBalance(): Promise<number> {
		const summaries = await this.accountSummaries();
		return Number(summaries.reduce((total, account) => total + account.balance, 0).toFixed(2));
	}

	async waitForBalance(accountNumber: string, expectedBalance: number): Promise<void> {
		await expect.poll(async () => {
			await this.open();
			const account = (await this.accountSummaries()).find((summary) => summary.accountNumber === accountNumber);
			return account?.balance ?? Number.NaN;
		}, { timeout: 15000, intervals: [1000, 2000] }).toBeCloseTo(expectedBalance, 2);
	}
}
