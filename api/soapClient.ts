import { APIRequestContext, Page } from '@playwright/test';

export class ParaBankSoapClient {
	constructor(private readonly request: APIRequestContext, private readonly fallbackPage?: Page) {}

	async initializeDatabase(): Promise<void> {
		const response = await this.call('initializeDB');
		if (response.status < 200 || response.status >= 300) throw new Error(`SOAP initializeDB failed: ${response.status} ${response.body}`);
	}

	async call(operation: string, parameters: Record<string, string | number> = {}): Promise<{ status: number; body: string }> {
		const parameterXml = Object.entries(parameters).map(([name, value]) => `<tns:${name}>${this.escape(String(value))}</tns:${name}>`).join('');
		const envelope = `<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://service.parabank.parasoft.com/"><soap:Body><tns:${operation}>${parameterXml}</tns:${operation}></soap:Body></soap:Envelope>`;
		try {
			const response = await this.request.post('services/ParaBank', {
				data: envelope,
				headers: { Accept: 'text/xml', 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
			});
			return { status: response.status(), body: await response.text() };
		} catch (error) {
			if (!this.fallbackPage || !/ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(error instanceof Error ? error.message : String(error))) throw error;
			const result = await this.fallbackPage.evaluate(async ({ envelope, operation }) => {
				const response = await fetch(new URL('services/ParaBank', window.location.href), { method: 'POST', body: envelope, headers: { Accept: 'text/xml', 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' } });
				return { status: response.status, body: await response.text() };
			}, { envelope, operation });
			return result;
		}
	}

	async login(username: string, password: string): Promise<number> {
		return this.numberFrom(await this.call('login', { username, password }), 'return');
	}

	async getCustomer(customerId: number): Promise<{ id: number; firstName: string; lastName: string }> {
		const response = await this.call('getCustomer', { customerId });
		return { id: this.numberFrom(response, 'id'), firstName: this.value(response.body, 'firstName'), lastName: this.value(response.body, 'lastName') };
	}

	async getAccount(accountId: number): Promise<{ id: number; customerId: number; balance: number }> {
		const response = await this.call('getAccount', { accountId });
		return { id: this.numberFrom(response, 'id'), customerId: this.numberFrom(response, 'customerId'), balance: Number(this.value(response.body, 'balance')) };
	}

	async getTransactions(accountId: number): Promise<string> {
		return (await this.call('getTransactions', { accountId })).body;
	}

	private numberFrom(response: { body: string }, tag: string): number {
		const value = this.value(response.body, tag);
		if (!/^[-+]?\d+(\.\d+)?$/.test(value)) throw new Error(`SOAP response did not contain numeric ${tag}: ${response.body}`);
		return Number(value);
	}

	private value(body: string, tag: string): string {
		return body.match(new RegExp(`<(?:[^:>]+:)?${tag}(?:\s[^>]*)?>([^<]*)</(?:[^:>]+:)?${tag}>`))?.[1] ?? '';
	}

	private escape(value: string): string {
		return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
	}
}
