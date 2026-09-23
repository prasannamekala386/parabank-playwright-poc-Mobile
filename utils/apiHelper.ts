import { APIRequestContext, expect } from '@playwright/test';

export type ApiAccount = {
	accountId: number;
	balance: number;
};

export class ApiHelper {
	constructor(private readonly request: APIRequestContext) {}

	async getAccount(accountNumber: string): Promise<ApiAccount> {
		const response = await this.request.get(`services/bank/accounts/${accountNumber}`, {
			headers: { Accept: 'application/json' },
		});
		await expect(response).toBeOK();
		const payload = await response.json() as { id: number; balance: number | string };
		return { accountId: payload.id, balance: Number(payload.balance) };
	}
}
