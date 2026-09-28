import { expect, Locator, Page } from '@playwright/test';

export type LoanApplication = {
	loanAmount: string;
	downPayment: string;
	fromAccountNumber?: string;
};

export class LoanPage {
	readonly loanAmount: Locator;
	readonly downPayment: Locator;
	readonly fromAccount: Locator;

	constructor(private readonly page: Page) {
		this.loanAmount = page.locator('#amount');
		this.downPayment = page.locator('#downPayment');
		this.fromAccount = page.locator('#fromAccountId');
	}

	async open(): Promise<void> {
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.page.goto('requestloan.htm');
			if (!(await this.page.getByRole('heading', { name: 'Error!' }).isVisible({ timeout: 1000 }).catch(() => false))) {
				await expect(this.loanAmount).toBeVisible({ timeout: 15000 });
				return;
			}
		}
		throw new Error('Loan request page remained unavailable after retries.');
	}

	async apply(application: LoanApplication): Promise<void> {
		await this.loanAmount.fill(application.loanAmount);
		await this.downPayment.fill(application.downPayment);
		if (application.fromAccountNumber) {
			await this.fromAccount.selectOption({ label: application.fromAccountNumber });
		} else {
			await this.fromAccount.selectOption({ index: 0 });
		}
		await this.page.getByRole('button', { name: 'Apply Now' }).click();
	}

	async status(): Promise<string> {
		return (await this.page.locator('#rightPanel').textContent())?.trim() ?? '';
	}

	async loanAccountNumber(): Promise<string> {
		const account = this.page.locator('#loanAccountId, a[href*="activity.htm?id="]').last();
		return account.evaluate((element) => {
			const text = `${element.textContent ?? ''} ${element.getAttribute('href') ?? ''}`;
			return text.match(/\b\d{4,}\b/)?.[0] ?? '';
		});
	}

	async expectApproved(): Promise<void> {
		await expect(this.page.locator('#rightPanel')).toContainText(/approved|approval/i);
	}

	async expectDenied(): Promise<void> {
		await expect(this.page.locator('#rightPanel')).toContainText(/denied|declined|rejected|cannot|not approved/i);
	}

	async expectProcessed(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: 'Loan Request Processed' })).toBeVisible();
		await expect(this.page.locator('#rightPanel')).toContainText(/approved|denied|declined|rejected/i);
	}

	async expectValidationMessage(): Promise<void> {
		await expect(this.page.locator('#rightPanel .error:visible, .error:visible').first()).toBeVisible();
	}

	async expectAccountCreated(): Promise<void> {
		await expect(this.page.locator('#rightPanel')).toContainText(/loan account|account/i);
		await expect.poll(() => this.loanAccountNumber()).toMatch(/\d{4,}/);
	}
}
