export async function ensureTransferAccounts({ loginPage, accountsOverviewPage, openAccountPage, accountUser, registeredUser }: {
	loginPage: { open(): Promise<void>; login(username: string, password: string): Promise<void> };
	accountsOverviewPage: { open(): Promise<void>; accountSummaries(): Promise<Array<{ accountNumber: string; balance: number }>> };
	openAccountPage: { open(): Promise<void>; createCheckingAccount(): Promise<void>; expectCreated(): Promise<void> };
	accountUser?: { username: string; password: string };
	registeredUser?: { username: string; password: string };
}) {
	const credentials = accountUser ?? registeredUser;
	if (!credentials) {
		throw new Error('Transfer precondition failed: no valid user credentials were provided.');
	}
	await loginPage.open();
	await loginPage.login(credentials.username, credentials.password);
	await accountsOverviewPage.open();
	let accounts = await accountsOverviewPage.accountSummaries();

	for (let attempt = 0; accounts.length < 2 && attempt < 3; attempt += 1) {
		await openAccountPage.open();
		await openAccountPage.createCheckingAccount();
		await openAccountPage.expectCreated();
		await accountsOverviewPage.open();
		accounts = await accountsOverviewPage.accountSummaries();
	}

	if (accounts.length < 2) {
		throw new Error('Transfer precondition failed: expected at least two accounts after setup.');
	}

	const fundedSource = [...accounts].sort((left, right) => right.balance - left.balance)[0];
	const destination = accounts.find((account) => account.accountNumber !== fundedSource.accountNumber);
	return destination ? [fundedSource, destination, ...accounts.filter((account) => account.accountNumber !== fundedSource.accountNumber && account.accountNumber !== destination.accountNumber)] : accounts;
}
