import { expect, test } from '../../fixtures/apiFixtures';
import customerSchema from '../../schemas/customer.schema.json';
import accountSchema from '../../schemas/account.schema.json';
import transactionSchema from '../../schemas/transaction.schema.json';
import { validateSchema } from '../../utils/schemaValidator';

const payee = {
	name: 'API Utility Company',
	address: { street: '1 API Street', city: 'Austin', state: 'Texas', zipCode: '78701' },
	phoneNumber: '5125550100',
	accountNumber: 10001,
};

function expectSuccessful(response: { status: number; body: string }): void {
	expect(response.status, response.body).toBeGreaterThanOrEqual(200);
	expect(response.status, response.body).toBeLessThan(300);
}

function expectApiError(response: { status: number; body: string }): void {
	expect(response.status >= 400 || /error|invalid|exception|unsupported|not found/i.test(response.body)).toBeTruthy();
}

function expectSchema(value: unknown, schema: any): void {
	expect(validateSchema(value, schema), JSON.stringify(value)).toEqual([]);
}

test.describe('ParaBank Day 8 REST, SOAP, schema and API E2E', () => {
	test('API-001 @api @regression @rest - establishes an isolated seeded customer through the API', async ({ restClient, apiUser, apiCustomerId }) => {
		await test.step('Establish customer without a browser', async () => {
			expect(apiCustomerId).toBeGreaterThan(0);
			expect(apiUser.username).toBe('john');
			const login = await restClient.login(apiUser.username, apiUser.password);
			expectSuccessful(login);
		});
	});

	test('API-002 @api @regression @rest - retrieves the created customer', async ({ restClient, apiCustomerId }) => {
		const response = await restClient.getCustomer(apiCustomerId);
		expectSuccessful(response);
		expect(response.json<{ id: number }>().id).toBe(apiCustomerId);
	});

	test('API-003 @api @regression @rest - updates customer data', async ({ restClient, apiCustomerId }) => {
		const response = await restClient.updateCustomer(apiCustomerId, { firstName: 'ApiUpdated', lastName: 'Customer', street: '2 API Street', city: 'Austin', state: 'Texas', zipCode: '78702', phoneNumber: '5125550101', ssn: '622-11-9999', username: 'john', password: 'demo' });
		expectSuccessful(response);
	});

	test('API-004 @api @regression @rest - verifies unsupported customer deletion behavior', async ({ restClient, apiCustomerId }) => {
		const response = await restClient.raw(`services/bank/customers/${apiCustomerId}`, { method: 'DELETE' });
		expectApiError(response);
	});

	test('API-005 @api @regression @rest - creates an account', async ({ restClient, apiCustomerId, apiAccountId }) => {
		const response = await restClient.createAccount(apiCustomerId, 1, apiAccountId);
		expectSuccessful(response);
		expect(response.json<{ id: number }>().id).toBeGreaterThan(0);
	});

	test('API-006 @api @regression @rest - retrieves an account', async ({ restClient, apiAccountId }) => {
		const response = await restClient.getAccount(apiAccountId);
		expectSuccessful(response);
		expect(response.json<{ id: number }>().id).toBe(apiAccountId);
	});

	test('API-007 @api @regression @rest - creates a transaction through the supported transfer operation', async ({ restClient, apiAccountId }) => {
		const accounts = await (await restClient.raw(`services/bank/accounts/${apiAccountId}`)).json<{ customerId: number }>();
		const accountList = await (await restClient.getAccounts(accounts.customerId)).json<Array<{ id: number }>>();
		const destination = accountList.find((account) => account.id !== apiAccountId);
		expect(destination).toBeTruthy();
		const response = await restClient.transfer(apiAccountId, destination?.id as number, 1);
		expectSuccessful(response);
	});

	test('API-008 @api @regression @rest - transfers funds between accounts', async ({ restClient, apiAccountId }) => {
		const account = await (await restClient.getAccount(apiAccountId)).json<{ customerId: number }>();
		const accounts = await (await restClient.getAccounts(account.customerId)).json<Array<{ id: number }>>();
		const destination = accounts.find((item) => item.id !== apiAccountId);
		const response = await restClient.transfer(apiAccountId, destination?.id as number, 1);
		expectSuccessful(response);
	});

	test('API-009 @api @regression @rest - executes bill payment', async ({ restClient, apiAccountId }) => {
		const response = await restClient.billPay(apiAccountId, 1, payee);
		expectSuccessful(response);
	});

	test('API-010 @api @regression @rest - retrieves transaction history', async ({ restClient, apiAccountId }) => {
		const response = await restClient.getTransactions(apiAccountId);
		expectSuccessful(response);
		expect(Array.isArray(response.json<unknown>())).toBeTruthy();
	});

	test('API-011 @api @regression @rest - rejects an invalid customer id', async ({ restClient }) => {
		expectApiError(await restClient.getCustomer(-1));
	});

	test('API-012 @api @regression @rest - rejects an invalid account id', async ({ restClient }) => {
		expectApiError(await restClient.getAccount(-1));
	});

	test('API-013 @api @regression @rest - rejects missing transfer parameters', async ({ restClient }) => {
		expectApiError(await restClient.raw('services/bank/transfer', { method: 'POST' }));
	});

	test('API-014 @api @regression @rest - rejects a malformed JSON payload', async ({ restClient }) => {
		const response = await restClient.raw('services/bank/billpay?accountId=bad&amount=bad', { method: 'POST', data: '{bad-json', headers: { 'Content-Type': 'application/json' } });
		expectApiError(response);
	});

	test('API-015 @api @regression @rest - rejects an unsupported content type', async ({ restClient }) => {
		const response = await restClient.raw('services/bank/transfer', { method: 'POST', data: 'not-form-data', headers: { 'Content-Type': 'application/octet-stream' } });
		expectApiError(response);
	});

	test('API-016 @api @regression @rest - handles invalid transaction query parameters safely', async ({ restClient, apiAccountId }) => {
		const response = await restClient.getTransactions(apiAccountId, { fromDate: 'not-a-date', toDate: 'also-not-a-date' });
		expectSuccessful(response);
		expect(Array.isArray(response.json<unknown>())).toBeTruthy();
	});

	test('API-017 @api @regression @rest @schema - validates the customer response schema', async ({ restClient, apiCustomerId }) => {
		const value = (await restClient.getCustomer(apiCustomerId)).json<unknown>();
		expectSchema(value, customerSchema);
	});

	test('API-018 @api @regression @rest @schema - validates the account response schema', async ({ restClient, apiAccountId }) => {
		const value = (await restClient.getAccount(apiAccountId)).json<unknown>();
		expectSchema(value, accountSchema);
	});

	test('API-019 @api @regression @rest @schema - validates the transaction response schema', async ({ restClient, apiAccountId }) => {
		const value = (await restClient.getTransactions(apiAccountId)).json<unknown>();
		expectSchema(value, transactionSchema);
	});

	test('API-020 @api @regression @soap - SOAP customer retrieval matches REST', async ({ restClient, soapClient, apiCustomerId }) => {
		const rest = (await restClient.getCustomer(apiCustomerId)).json<{ id: number }>();
		const soap = await soapClient.getCustomer(apiCustomerId);
		expect(soap.id).toBe(rest.id);
	});

	test('API-021 @api @regression @soap - SOAP account retrieval matches REST', async ({ restClient, soapClient, apiAccountId }) => {
		const rest = (await restClient.getAccount(apiAccountId)).json<{ id: number; customerId: number; balance: number }>();
		const soap = await soapClient.getAccount(apiAccountId);
		expect({ id: soap.id, customerId: soap.customerId }).toEqual({ id: rest.id, customerId: rest.customerId });
	});

	test('E2E-API-001 API-022 @api @regression @soap @e2e - completes and reconciles the API journey', async ({ restClient, soapClient, apiCustomerId, apiAccountId }) => {
		await test.step('Seed transactions and transfer funds', async () => {
			const account = await (await restClient.getAccount(apiAccountId)).json<{ customerId: number; balance: number }>();
			const accounts = await (await restClient.getAccounts(account.customerId)).json<Array<{ id: number }>>();
			const destination = accounts.find((item) => item.id !== apiAccountId);
			expect(destination).toBeTruthy();
			const transfer = await restClient.transfer(apiAccountId, destination?.id as number, 1);
			expectSuccessful(transfer);
		});
		await test.step('Pay a bill and reconcile REST and SOAP activity', async () => {
			expectSuccessful(await restClient.billPay(apiAccountId, 1, payee));
			const restTransactions = (await restClient.getTransactions(apiAccountId)).json<unknown[]>();
			const soapTransactions = await soapClient.getTransactions(apiAccountId);
			expect(restTransactions.length).toBeGreaterThan(0);
			expect(soapTransactions).toContain(String(apiAccountId));
		});
		await test.step('Confirm final account state', async () => {
			const rest = (await restClient.getAccount(apiAccountId)).json<{ id: number; customerId: number; balance: number }>();
			const soap = await soapClient.getAccount(apiAccountId);
			expect(rest.id).toBe(apiAccountId);
			expect(soap.customerId).toBe(apiCustomerId);
			expect(Number.isFinite(rest.balance)).toBeTruthy();
		});
	});
});
