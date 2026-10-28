import { test as base } from '@playwright/test';
import { ParaBankRestClient } from '../api/restClient';
import { ParaBankSoapClient } from '../api/soapClient';
import { RegistrationUser } from '../utils/testDataGenerator';

export type ApiFixtures = {
	restClient: ParaBankRestClient;
	soapClient: ParaBankSoapClient;
	apiUser: RegistrationUser;
	apiCustomerId: number;
	apiAccountId: number;
};

export const test = base.extend<ApiFixtures>({
	restClient: async ({ request, page }, use) => {
		await page.goto('index.htm');
		await use(new ParaBankRestClient(request, page));
	},
	soapClient: async ({ request, page }, use) => {
		await page.goto('index.htm');
		await use(new ParaBankSoapClient(request, page));
	},
	apiUser: async ({}, use) => use({ firstName: 'John', lastName: 'Smith', address: '1431 Main St', city: 'Beverly Hills', state: 'CA', zipCode: '90210', phoneNumber: '310-447-4121', ssn: '622-11-9999', username: 'john', password: 'demo' }),
	apiCustomerId: async ({ restClient, soapClient, apiUser }, use) => {
		const login = await restClient.login(apiUser.username, apiUser.password);
		if (login.status < 200 || login.status >= 300) throw new Error(`API login failed: ${login.status} ${login.body}`);
		const customerId = Number((login.body.match(/"id"\s*:\s*(\d+)/)?.[1] ?? login.body.match(/<id>(\d+)<\/id>/)?.[1]));
		if (!Number.isFinite(customerId)) throw new Error(`API login did not return a customer id: ${login.body}`);
		await use(customerId);
	},
	apiAccountId: async ({ restClient, soapClient, apiCustomerId }, use) => {
		const accountsPayload = await (await restClient.getAccounts(apiCustomerId)).json<unknown>();
		const accounts = Array.isArray(accountsPayload) ? accountsPayload as Array<{ id: number; balance: number }> : (accountsPayload as { account?: Array<{ id: number; balance: number }> | { id: number; balance: number } }).account;
		const source = Array.isArray(accounts) ? accounts[0] : accounts;
		const fundedSource = Array.isArray(accounts) ? accounts.find((account) => account.balance >= 0) : source;
		if (!fundedSource?.id) throw new Error('API setup did not return a usable source account.');
		const created = await restClient.createAccount(apiCustomerId, 1, fundedSource.id);
		if (created.status < 200 || created.status >= 300) throw new Error(`Account setup failed: ${created.status} ${created.body}`);
		const createdPayload = created.json<{ id: number }>();
		await use(createdPayload.id);
	},
});

export { expect } from '@playwright/test';
