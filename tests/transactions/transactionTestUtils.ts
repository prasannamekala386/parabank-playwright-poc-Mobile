import { ApiTransaction } from '../../utils/apiHelper';
import { TransactionSeedingUtility } from '../../utils/transactionSeedingUtility';
import { ensureTransferAccounts } from '../transfers/transferTestUtils';

export async function prepareTransactions({ loginPage, accountsOverviewPage, openAccountPage, apiHelper, transactionSeedingUtility, accountUser, volume = 1 }: any): Promise<{ source: { accountNumber: string; balance: number }; destination: { accountNumber: string; balance: number }; transactions: ApiTransaction[] }> {
	const accounts = await ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser });
	const source = accounts[0];
	const destination = accounts[1];
	const sourceAccount = await apiHelper.getAccount(source.accountNumber);
	const destinationAccount = await apiHelper.getAccount(destination.accountNumber);
	if (!Number.isInteger(sourceAccount.accountId) || sourceAccount.accountId <= 0 || !Number.isInteger(destinationAccount.accountId) || destinationAccount.accountId <= 0) {
		throw new Error('Transaction precondition failed: account numbers did not resolve to valid API account IDs.');
	}
	const transactions = await transactionSeedingUtility.seed({ volume, amounts: [1] }, sourceAccount.accountId, destinationAccount.accountId);
	return { source, destination, transactions: transactions.slice(-volume) };
}

export function toUiDate(date: string): string {
	const trimmedDate = date.trim();
	const timestamp = /^\d+$/.test(trimmedDate) ? Number(trimmedDate) : Number.NaN;
	const parsed = new Date(Number.isFinite(timestamp) ? timestamp : date);
	if (Number.isNaN(parsed.getTime())) return date;
	return `${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}-${parsed.getFullYear()}`;
}
