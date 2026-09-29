import { ApiHelper, ApiTransaction } from './apiHelper';

export type TransactionSeedOptions = {
	volume: number;
	amounts?: number[];
	dates?: string[];
	delayMs?: number;
};

export class TransactionSeedingUtility {
	constructor(private readonly apiHelper: ApiHelper) {}

	async seed(options: TransactionSeedOptions, sourceAccountId: number, destinationAccountId: number): Promise<ApiTransaction[]> {
		if (options.volume < 1) {
			throw new Error('Transaction seed volume must be at least one.');
		}
		if (options.dates?.length) {
			throw new Error('The ParaBank transfer API does not support custom transaction dates.');
		}
		const delayMs = options.delayMs ?? 1000;
		if (!Number.isFinite(delayMs) || delayMs < 0) {
			throw new Error('Transaction seed delay must be a non-negative number.');
		}
		for (let index = 0; index < options.volume; index += 1) {
			if (index > 0 && delayMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
			const amount = options.amounts?.[index % options.amounts.length] ?? 1;
			await this.apiHelper.transfer(sourceAccountId, destinationAccountId, amount);
		}
		return this.apiHelper.getTransactions(sourceAccountId);
	}
}
