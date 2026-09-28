import { ApiHelper, ApiTransaction } from './apiHelper';

export type TransactionSeedOptions = {
	volume: number;
	amounts?: number[];
	dates?: string[];
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
		for (let index = 0; index < options.volume; index += 1) {
			const amount = options.amounts?.[index % options.amounts.length] ?? 1;
			await this.apiHelper.transfer(sourceAccountId, destinationAccountId, amount);
		}
		return this.apiHelper.getTransactions(sourceAccountId);
	}
}
