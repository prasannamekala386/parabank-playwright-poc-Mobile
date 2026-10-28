import { expect, Page } from '@playwright/test';
import { RegistrationUser } from '../utils/testDataGenerator';
import { logger } from '../utils/logger';

export type RegistrationField =
	| 'firstName'
	| 'lastName'
	| 'address'
	| 'city'
	| 'state'
	| 'zipCode'
	| 'phoneNumber'
	| 'ssn'
	| 'username'
	| 'password'
	| 'repeatedPassword';

type RegistrationOverrides = Partial<RegistrationUser> & {
	repeatedPassword?: string;
};

const fieldSelectors: Record<RegistrationField, string> = {
	firstName: 'input[name="customer.firstName"]',
	lastName: 'input[name="customer.lastName"]',
	address: 'input[name="customer.address.street"]',
	city: 'input[name="customer.address.city"]',
	state: 'input[name="customer.address.state"]',
	zipCode: 'input[name="customer.address.zipCode"]',
	phoneNumber: 'input[name="customer.phoneNumber"]',
	ssn: 'input[name="customer.ssn"]',
	username: 'input[name="customer.username"]',
	password: 'input[name="customer.password"]',
	repeatedPassword: 'input[name="repeatedPassword"]',
};

export class RegistrationPage {
	constructor(private readonly page: Page) {}

	async expectVisible(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: 'Signing up is easy!' })).toBeVisible();
		await expect(this.page.locator('input[name="customer.firstName"]')).toBeVisible();
		await expect(this.page.locator('input[name="customer.username"]')).toBeVisible();
	}

	async register(user: RegistrationUser): Promise<void> {
		logger.info(`Registering user ${user.username}`);
		await this.registerWithOverrides(user);
	}

	async registerWithOverrides(user: RegistrationUser, overrides: RegistrationOverrides = {}): Promise<void> {
		const values = { ...user, ...overrides };
		const fields = {
			'customer.firstName': values.firstName,
			'customer.lastName': values.lastName,
			'customer.address.street': values.address,
			'customer.address.city': values.city,
			'customer.address.state': values.state,
			'customer.address.zipCode': values.zipCode,
			'customer.phoneNumber': values.phoneNumber,
			'customer.ssn': values.ssn,
			'customer.username': values.username,
			'customer.password': values.password,
			'repeatedPassword': overrides.repeatedPassword ?? values.password,
		};
		for (const [name, value] of Object.entries(fields)) {
			await this.page.locator(`input[name="${name}"]`).fill(value);
		}
		await this.page.locator('input[name="repeatedPassword"]').press('Enter');
	}

	async expectValidationError(): Promise<void> {
		await expect(this.page.locator('.error').first()).toBeVisible();
	}

	async expectFieldBlank(field: RegistrationField): Promise<void> {
		await expect(this.page.locator(fieldSelectors[field])).toHaveValue('');
	}

	async expectFormVisible(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: 'Signing up is easy!' })).toBeVisible();
	}

	async expectNoServerError(): Promise<void> {
		await expect(this.page.locator('body')).not.toContainText('Internal Server Error');
		await expect(this.page.locator('body')).not.toContainText('Exception');
	}

	async expectRegistrationNotSuccessful(): Promise<void> {
		await expect(this.page.getByRole('link', { name: 'Log Out' })).not.toBeVisible();
		await expect(this.page.getByText('Your account was created successfully. You are now logged in.')).not.toBeVisible();
	}

	async expectRegistrationSuccessful(user: RegistrationUser): Promise<void> {
		await expect(this.page.getByRole('heading', { name: `Welcome ${user.username}` })).toBeVisible();
		await expect(this.page.getByText('Your account was created successfully. You are now logged in.')).toBeVisible();
	}
}
