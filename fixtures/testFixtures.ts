import { chromium, test as base, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { AccountActivityPage } from '../pages/AccountActivityPage';
import { AccountsOverviewPage } from '../pages/AccountsOverviewPage';
import { BillPayPage } from '../pages/BillPayPage';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';
import { LoginPage } from '../pages/LoginPage';
import { LoanPage } from '../pages/LoanPage';
import { OpenAccountPage } from '../pages/OpenAccountPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { ApiHelper } from '../utils/apiHelper';
import { generateRegistrationUser } from '../utils/testDataGenerator';
import { TransactionSeedingUtility } from '../utils/transactionSeedingUtility';
export type TestCredentials = {
	username: string;
	password: string;
};

type Fixtures = {
	loginPage: LoginPage;
	registrationPage: RegistrationPage;
	accountsOverviewPage: AccountsOverviewPage;
	openAccountPage: OpenAccountPage;
	transferFundsPage: TransferFundsPage;
	accountActivityPage: AccountActivityPage;
	billPayPage: BillPayPage;
	findTransactionsPage: FindTransactionsPage;
	loanPage: LoanPage;
	transactionSeedingUtility: TransactionSeedingUtility;
	registeredUser: TestCredentials;
	apiHelper: ApiHelper;
	accountUser: TestCredentials;
};

type WorkerFixtures = {
	androidSession: { browser: Browser; context: BrowserContext } | undefined;
	workerUser: TestCredentials;
};

function adb(serial: string, ...args: string[]): string {
	return execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8' });
}

async function waitForAndroidBoot(serial: string): Promise<void> {
	const deadline = Date.now() + 120000;
	while (Date.now() < deadline) {
		try {
			if (adb(serial, 'get-state').trim() === 'device' && adb(serial, 'shell', 'getprop', 'sys.boot_completed').trim() === '1') {
				adb(serial, 'shell', 'am', 'get-current-user');
				return;
			}
		} catch {
			// ADB may reconnect before Android finishes booting.
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	throw new Error(`Android device ${serial} did not finish booting within 120 seconds.`);
}

async function ensureAndroidActivityManager(serial: string): Promise<void> {
	try {
		adb(serial, 'shell', 'am', 'get-current-user');
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (!/Can't find service: activity/i.test(message)) {
			throw error;
		}
		adb(serial, 'reboot');
		await waitForAndroidBoot(serial);
	}
}

async function findFreePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const port = (server.address() as import('node:net').AddressInfo).port;
	await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
	return port;
}

function configureBaseURL(page: Page): void {
	const baseURL = process.env.BASE_URL?.trim().replace(/\/index\.htm$/i, '/');
	if (!baseURL) {
		throw new Error('BASE_URL is required in .env');
	}

	const originalGoto = page.goto.bind(page);
	page.goto = (url, options) => originalGoto(new URL(String(url), baseURL).toString(), options);
}

async function dismissChromeStartupDialog(serial: string): Promise<boolean> {
	try {
		adb(serial, 'shell', 'uiautomator', 'dump', '/sdcard/window.xml');
		const hierarchy = adb(serial, 'shell', 'cat', '/sdcard/window.xml');
		const dismissIds = new Set([
			'com.android.chrome:id/signin_fre_dismiss_button',
			'com.android.chrome:id/negative_button',
		]);
		const button = hierarchy.match(/<node\b[^>]*>/g)?.find((node) => {
			const resourceId = node.match(/\bresource-id="([^"]+)"/)?.[1];
			return resourceId ? dismissIds.has(resourceId) : false;
		});
		const bounds = button?.match(/\bbounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
		if (!bounds) {
			return false;
		}

		const x = Math.floor((Number(bounds[1]) + Number(bounds[3])) / 2);
		const y = Math.floor((Number(bounds[2]) + Number(bounds[4])) / 2);
		adb(serial, 'shell', 'input', 'tap', String(x), String(y));
		return true;
	} catch {
		return false;
	}
}

async function waitForChrome(serial: string, port: number): Promise<void> {
	const endpoint = `http://127.0.0.1:${port}/json/list`;
	const deadline = Date.now() + 45000;
	let nextDialogCheck = 0;

	while (Date.now() < deadline) {
		if (Date.now() >= nextDialogCheck) {
			nextDialogCheck = Date.now() + 2000;
			if (await dismissChromeStartupDialog(serial)) {
				await new Promise((resolve) => setTimeout(resolve, 500));
				continue;
			}
		}

		try {
			const response = await fetch(endpoint);
			if (response.ok) {
				const targets = await response.json() as Array<{ type?: string }>;
				if (targets.some((target) => target.type === 'page')) {
					return;
				}
			}
		} catch {
			// Chrome may not have opened its first tab yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}

	throw new Error(`Android Chrome did not expose a DevTools page at ${endpoint}; check Chrome startup prompts on ${serial}.`);
}

export const test = base.extend<Fixtures, WorkerFixtures>({
	androidSession: [async ({}, use, workerInfo) => {
		const serial = String(workerInfo.project.metadata.androidSerial ?? '');
		if (!serial) {
			await use(undefined);
			return;
		}

		try {
			const state = adb(serial, 'get-state').trim();
			if (state !== 'device') {
				throw new Error(`Android device ${serial} is not online (ADB state: ${state}).`);
			}
		} catch (error) {
			throw new Error(`Cannot use Android device ${serial}. Check that it is listed as "device" in adb devices.`, { cause: error });
		}
		await ensureAndroidActivityManager(serial);

		const port = await findFreePort();
		let browser: Browser | undefined;
		let portForwarded = false;
		try {
			adb(serial, 'shell', 'am', 'force-stop', 'com.android.chrome');
			adb(serial, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'about:blank', 'com.android.chrome');
			adb(serial, 'forward', `tcp:${port}`, 'localabstract:chrome_devtools_remote');
			portForwarded = true;
			await waitForChrome(serial, port);

			browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
			const context = browser.contexts()[0];
			if (!context) {
				throw new Error(`Android Chrome on ${serial} did not expose a browser context over CDP.`);
			}

			await use({ browser, context });
		} finally {
			await browser?.close();
			if (portForwarded) {
				try {
					adb(serial, 'forward', '--remove', `tcp:${port}`);
				} catch {
					// The ADB forward may already be removed if the device disconnected.
				}
			}
		}
	}, { scope: 'worker', timeout: 180000 }],
	page: async ({ context, androidSession }, use) => {
		const activeContext = androidSession?.context ?? context;
		if (androidSession) {
			for (const existingPage of activeContext.pages()) {
				await existingPage.close();
			}
			await activeContext.clearCookies();
		}
		const page = await activeContext.newPage();
		page.setDefaultTimeout(15000);
		page.setDefaultNavigationTimeout(30000);
		if (androidSession) {
			configureBaseURL(page);
		}
		try {
			await use(page);
		} finally {
			if (!androidSession) {
				await page.close();
			}
		}
	},
	workerUser: [async ({ browser, androidSession }, use) => {
		if (androidSession) {
			await androidSession.context.clearCookies();
		}
		const page = androidSession
			? await androidSession.context.newPage()
			: await browser.newPage();
		if (androidSession) {
			configureBaseURL(page);
		}
		const user = generateRegistrationUser();
		const loginPage = new LoginPage(page);
		const registrationPage = new RegistrationPage(page);
		try {
			await loginPage.open();
			await loginPage.openRegistration();
			await registrationPage.register(user);
			await registrationPage.expectRegistrationSuccessful(user);
			await loginPage.logout();
			await use({ username: user.username, password: user.password });
		} finally {
			if (!page.isClosed()) {
				await page.close();
			}
		}
	}, { scope: 'worker' }],
	loginPage: async ({ page }, use) => use(new LoginPage(page)),
	registrationPage: async ({ page }, use) => use(new RegistrationPage(page)),
	accountsOverviewPage: async ({ page }, use) => use(new AccountsOverviewPage(page)),
	openAccountPage: async ({ page }, use) => use(new OpenAccountPage(page)),
	transferFundsPage: async ({ page }, use) => use(new TransferFundsPage(page)),
	accountActivityPage: async ({ page }, use) => use(new AccountActivityPage(page)),
	billPayPage: async ({ page }, use) => use(new BillPayPage(page)),
	findTransactionsPage: async ({ page }, use) => use(new FindTransactionsPage(page)),
	loanPage: async ({ page }, use) => use(new LoanPage(page)),
	transactionSeedingUtility: async ({ apiHelper }, use) => use(new TransactionSeedingUtility(apiHelper)),
	apiHelper: async ({ page }, use) => use(new ApiHelper(page)),
	registeredUser: async ({ workerUser }, use) => use(workerUser),
	accountUser: async ({ page }, use) => {
		const user = generateRegistrationUser();
		const loginPage = new LoginPage(page);
		const registrationPage = new RegistrationPage(page);
		await loginPage.open();
		await loginPage.openRegistration();
		await registrationPage.register(user);
		await registrationPage.expectRegistrationSuccessful(user);
		await loginPage.logout();
		await use({ username: user.username, password: user.password });
	},
});

export { expect } from '@playwright/test';
