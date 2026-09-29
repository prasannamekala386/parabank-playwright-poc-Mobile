import { Page } from '@playwright/test';

export type ApiAccount = {
	accountId: number;
	balance: number;
};

export type ApiTransaction = {
	id: number;
	accountId: number;
	type: string;
	date: string;
	amount: number;
	description: string;
	balance: number;
};

export class ApiHelper {
	constructor(private readonly page: Page) {}

	async login(username: string, password: string): Promise<void> {
		await this.withRetry(async () => {
			const response = await this.apiRequest('login.htm', {
				method: 'POST',
				form: { username, password },
			});
			this.ensureSuccessful(response, 'POST', 'login.htm');
		});
	}

	async getAccount(accountNumber: string): Promise<ApiAccount> {
		const payload = await this.withRetry(async () => {
			const response = await this.apiRequest(`services/bank/accounts/${accountNumber}`);
			this.ensureSuccessful(response, 'GET', `services/bank/accounts/${accountNumber}`);
			return JSON.parse(response.body) as { id: number; balance: number | string };
		});
		return { accountId: payload.id, balance: Number(payload.balance) };
	}

	async getTransactions(accountId: number, query: { fromDate?: string; toDate?: string; amount?: string } = {}): Promise<ApiTransaction[]> {
		const payload = await this.withRetry(async () => {
			const path = `services/bank/accounts/${accountId}/transactions`;
			const response = await this.apiRequest(path, { params: query });
			this.ensureSuccessful(response, 'GET', path);
			return JSON.parse(response.body) as Array<Record<string, unknown>>;
		});
		return payload.map((transaction) => ({
			id: Number(transaction.id),
			accountId: Number(transaction.accountId ?? accountId),
			type: String(transaction.type ?? ''),
			date: String(transaction.date ?? ''),
			amount: Number(transaction.amount),
			description: String(transaction.description ?? ''),
			balance: Number(transaction.balance),
		}));
	}

	async transfer(fromAccountId: number, toAccountId: number, amount: number): Promise<void> {
		await this.withRetry(async () => {
			const path = 'services/bank/transfer';
			const response = await this.apiRequest(path, {
				method: 'POST',
				params: {
					fromAccountId: String(fromAccountId),
					toAccountId: String(toAccountId),
					amount: amount.toFixed(2),
				},
			});
			this.ensureSuccessful(response, 'POST', path);
		});
	}

	private async apiRequest(path: string, options: {
		method?: 'GET' | 'POST';
		params?: Record<string, string | undefined>;
		form?: Record<string, string>;
	} = {}): Promise<{ status: number; body: string }> {
		return this.page.evaluate(async ({ path, method, params, form }) => {
			const url = new URL(path, window.location.href);
			for (const [key, value] of Object.entries(params ?? {})) {
				if (value !== undefined) url.searchParams.set(key, value);
			}
			const headers: Record<string, string> = { Accept: 'application/json' };
			let body: string | undefined;
			if (form) {
				headers['Content-Type'] = 'application/x-www-form-urlencoded';
				body = new URLSearchParams(form).toString();
			}
			const response = await fetch(url, { method, headers, body });
			return { status: response.status, body: await response.text() };
		}, { path, method: options.method ?? 'GET', params: options.params ?? {}, form: options.form });
	}

	private ensureSuccessful(response: { status: number; body: string }, method: string, path: string): void {
		if (response.status < 200 || response.status >= 300) {
			throw new Error(`API ${method} ${path} failed with HTTP ${response.status}: ${response.body}`);
		}
	}

	private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
		let lastError: unknown;
		const maxAttempts = 6;
		for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
			try {
				return await operation();
			} catch (error) {
				lastError = error;
				if (!this.isTransientError(error) || attempt === maxAttempts - 1) {
					throw error;
				}
				await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs(error, attempt)));
			}
		}
		throw lastError;
	}

	private isTransientError(error: unknown): boolean {
		const message = error instanceof Error ? error.message : String(error);
		return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up|network timeout|failed to fetch|HTTP (?:429|5\d\d)/i.test(message);
	}

	private retryDelayMs(error: unknown, attempt: number): number {
		const message = error instanceof Error ? error.message : String(error);
		if (/HTTP 429/i.test(message)) {
			const retryAfterSeconds = Number(/"retry_after"\s*:\s*(\d+(?:\.\d+)?)/i.exec(message)?.[1] ?? 30);
			return Math.min(retryAfterSeconds * 1000 * (2 ** attempt), 120_000);
		}
		return 500 * (2 ** attempt);
	}
}
