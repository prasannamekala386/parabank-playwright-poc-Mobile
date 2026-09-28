import { APIRequestContext, APIResponse, Page } from '@playwright/test';

export type ApiResponse = {
	status: number;
	body: string;
	json: <T>() => T;
};

export type RegistrationData = {
	firstName: string;
	lastName: string;
	address: string;
	city: string;
	state: string;
	zipCode: string;
	phoneNumber: string;
	ssn: string;
	username: string;
	password: string;
};

export class ParaBankRestClient {
	constructor(private readonly request: APIRequestContext, private readonly fallbackPage?: Page) {}

	async register(user: RegistrationData): Promise<ApiResponse> {
		return this.send('register.htm', { method: 'POST', form: { ...user, repeatedPassword: user.password } });
	}

	async login(username: string, password: string): Promise<ApiResponse> {
		return this.send(`services/bank/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`);
	}

	async getCustomer(customerId: number): Promise<ApiResponse> {
		return this.send(`services/bank/customers/${customerId}`);
	}

	async updateCustomer(customerId: number, fields: Record<string, string>): Promise<ApiResponse> {
		return this.send(`services/bank/customers/update/${customerId}`, { method: 'POST', params: fields });
	}

	async getAccounts(customerId: number): Promise<ApiResponse> {
		return this.send(`services/bank/customers/${customerId}/accounts`);
	}

	async createAccount(customerId: number, newAccountType = 1, fromAccountId?: number): Promise<ApiResponse> {
		return this.send('services/bank/createAccount', {
			method: 'POST',
			params: { customerId: String(customerId), newAccountType: String(newAccountType), fromAccountId: fromAccountId === undefined ? undefined : String(fromAccountId) },
		});
	}

	async getAccount(accountId: number): Promise<ApiResponse> {
		return this.send(`services/bank/accounts/${accountId}`);
	}

	async getTransactions(accountId: number, params: Record<string, string> = {}): Promise<ApiResponse> {
		return this.send(`services/bank/accounts/${accountId}/transactions`, { params });
	}

	async transfer(fromAccountId: number, toAccountId: number, amount: number): Promise<ApiResponse> {
		return this.send('services/bank/transfer', { method: 'POST', params: { fromAccountId: String(fromAccountId), toAccountId: String(toAccountId), amount: amount.toFixed(2) } });
	}

	async billPay(accountId: number, amount: number, payee: Record<string, unknown>): Promise<ApiResponse> {
		return this.send('services/bank/billpay', { method: 'POST', params: { accountId: String(accountId), amount: amount.toFixed(2) }, data: payee });
	}

	async raw(path: string, options: { method?: 'GET' | 'POST' | 'DELETE'; params?: Record<string, string>; data?: unknown; headers?: Record<string, string> } = {}): Promise<ApiResponse> {
		return this.send(path, options);
	}

	private async send(path: string, options: { method?: 'GET' | 'POST' | 'DELETE'; params?: Record<string, string | undefined>; form?: Record<string, string>; data?: unknown; headers?: Record<string, string> } = {}): Promise<ApiResponse> {
		const params = Object.fromEntries(Object.entries(options.params ?? {}).filter((entry): entry is [string, string] => entry[1] !== undefined));
		return this.withRetry(async () => {
			try {
				const response: APIResponse = await this.request.fetch(path, {
					method: options.method ?? 'GET',
					params,
					form: options.form,
					data: options.data,
					headers: { Accept: 'application/json', ...options.headers },
				});
				const body = await response.text();
				if (response.status() >= 500) throw new Error(`HTTP ${response.status()} from ${path}: ${body}`);
				return { status: response.status(), body, json: <T>() => JSON.parse(body) as T };
			} catch (error) {
				if (!this.fallbackPage || !/ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(error instanceof Error ? error.message : String(error))) throw error;
				return this.fetchThroughExistingTransport(path, options, params);
			}
		});
	}

	private async fetchThroughExistingTransport(path: string, options: { method?: 'GET' | 'POST' | 'DELETE'; params?: Record<string, string | undefined>; form?: Record<string, string>; data?: unknown; headers?: Record<string, string> }, params: Record<string, string>): Promise<ApiResponse> {
		const baseUrl = process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/index.htm';
		const target = new URL(path, baseUrl);
		for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
		const result = await this.fallbackPage?.evaluate(async ({ target, method, form, data, headers }) => {
			let body: string | undefined;
			const requestHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
			if (form) {
				body = new URLSearchParams(form).toString();
				requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
			} else if (data !== undefined) {
				body = typeof data === 'string' ? data : JSON.stringify(data);
				if (typeof data !== 'string') requestHeaders['Content-Type'] = 'application/json';
			}
			const response = await fetch(target, { method, headers: requestHeaders, body });
			return { status: response.status, body: await response.text() };
		}, { target: target.toString(), method: options.method ?? 'GET', form: options.form, data: options.data, headers: options.headers ?? {} });
		if (!result) throw new Error('API fallback transport was unavailable.');
		return { ...result, json: <T>() => JSON.parse(result.body) as T };
	}

	private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
		let lastError: unknown;
		for (let attempt = 0; attempt < 3; attempt += 1) {
			try {
				return await operation();
			} catch (error) {
				lastError = error;
				if (attempt === 2 || !/ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up|HTTP 5\d\d/i.test(error instanceof Error ? error.message : String(error))) throw error;
				await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
			}
		}
		throw lastError;
	}
}
