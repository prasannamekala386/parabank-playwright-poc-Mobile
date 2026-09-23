import { test } from '../../fixtures/testFixtures';

test.describe('ParaBank Session Management', () => {
	test('AUTH-SESSION-001 @session - logout invalidates the session', async ({ loginPage, registeredUser }) => {
		await loginPage.open();
		await loginPage.login(registeredUser.username, registeredUser.password);
		await loginPage.expectAuthenticated();
		await loginPage.logout();
		await loginPage.expectLoginFormVisible();
	});

	test('AUTH-SESSION-002 @session - browser back does not restore the session', async ({ loginPage, registeredUser }) => {
		await loginPage.open();
		await loginPage.login(registeredUser.username, registeredUser.password);
		await loginPage.expectAuthenticated();
		await loginPage.logout();
		await loginPage.goBack();
		await loginPage.reload();
		await loginPage.expectSessionNotRestored();
	});

	test('AUTH-SESSION-003 @session - direct overview access after logout redirects to login', async ({ loginPage, registeredUser }) => {
		await loginPage.open();
		await loginPage.login(registeredUser.username, registeredUser.password);
		await loginPage.expectAuthenticated();
		await loginPage.logout();
		await loginPage.openOverviewDirectly();
		await loginPage.expectLoginFormVisible();
	});
});