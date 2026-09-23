import { test } from '../../fixtures/testFixtures';

test.describe('ParaBank Authentication Smoke Tests', () => {
	test('AUTH-001 @smoke - valid credentials login successfully', async ({ loginPage, accountsOverviewPage, registeredUser }) => {
		await loginPage.open();
		await loginPage.login(registeredUser.username, registeredUser.password);
		await accountsOverviewPage.open();
		await accountsOverviewPage.expectDisplayed();
	});

	test('AUTH-002 @smoke - invalid credentials are rejected', async ({ loginPage }) => {
		await loginPage.open();
		await loginPage.login('invalid-user', 'invalid-password');
		await loginPage.expectLoginError('could not be verified');
	});

	test('AUTH-003 @smoke - blank credentials are rejected', async ({ loginPage }) => {
		await loginPage.open();
		await loginPage.login('', '');
		await loginPage.expectLoginError('Please enter a username and password.');
	});
});