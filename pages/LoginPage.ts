import { expect, Locator, Page } from '@playwright/test';
import { logger } from '../utils/logger';

export class LoginPage {
	readonly username: Locator;
	readonly password: Locator;

	constructor(private readonly page: Page) {
		this.username = page.locator('input[name="username"]');
		this.password = page.locator('input[name="password"]');
	}

	async open(): Promise<void> {
		await this.page.goto('index.htm');
	}

	async openRegistration(): Promise<void> {
		await this.page.getByRole('link', { name: 'Register' }).click();
	}

	async login(username: string, password: string): Promise<void> {
		logger.info(`Logging in as ${username || '<blank>'}`);
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.open();
			if (!(await this.username.isVisible({ timeout: 5000 }).catch(() => false))) {
				continue;
			}
			await this.username.fill(username);
			await this.password.fill(password);
			await this.password.press('Enter');

			if (await this.isAuthenticated()) {
				return;
			}

			const internalError = this.page.getByText('An internal error has occurred and has been logged.', { exact: true });
			if (!(await internalError.isVisible({ timeout: 1000 }).catch(() => false))) {
				return;
			}

			logger.warn(`Login returned a server error; retrying (${attempt + 1}/3)`);
		}
		throw new Error('Login failed after three attempts because ParaBank returned an internal server error.');
	}

	async expectLoginFormVisible(): Promise<void> {
		await expect(this.username).toBeVisible();
		await expect(this.password).toBeVisible();
	}

	async expectAuthenticated(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: 'Account Services' })).toBeVisible();
		await expect(this.page.getByRole('link', { name: 'Log Out' })).toBeVisible();
	}

	async isAuthenticated(): Promise<boolean> {
		return this.page.getByRole('heading', { name: 'Account Services' }).isVisible({ timeout: 1000 }).catch(() => false);
	}

	async expectSessionNotRestored(): Promise<void> {
		await expect(this.page.getByRole('link', { name: 'Log Out' })).not.toBeVisible();
		await expect(this.page.getByRole('heading', { name: 'Account Services' })).not.toBeVisible();
	}

	async expectLoginError(message: string): Promise<void> {
		await expect(this.page.locator('#rightPanel p.error')).toContainText(message);
	}

	async logout(): Promise<void> {
		await this.page.getByRole('link', { name: 'Log Out' }).click();
	}

	async openOverviewDirectly(): Promise<void> {
		await this.page.goto('overview.htm');
	}

	async goBack(): Promise<void> {
		try {
			await this.page.goBack({ waitUntil: 'domcontentloaded' });
		} catch {
			await this.page.goto('index.htm');
		}
	}

	async reload(): Promise<void> {
		await this.page.reload();
	}
}
