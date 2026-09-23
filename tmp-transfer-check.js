const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = 'https://parabank.parasoft.com/parabank';
  await page.goto(base + '/index.htm');
  await page.getByRole('link', { name: 'Register' }).click();
  const user = 'ft' + Date.now();
  for (const [key, value] of Object.entries({
    'customer.firstName': 'Test', 'customer.lastName': 'User', 'customer.address.street': '123 Main', 'customer.address.city': 'City', 'customer.address.state': 'ST', 'customer.address.zipCode': '12345', 'customer.phoneNumber': '1234567890', 'customer.ssn': '123456789', 'customer.username': user, 'customer.password': 'Password123', 'repeatedPassword': 'Password123'
  })) { await page.locator('input[name="' + key + '"]').fill(value); }
  await page.getByRole('button', { name: 'Register' }).click();
  await page.waitForSelector('text=Your account was created successfully', { timeout: 20000 });
  await page.goto(base + '/overview.htm');
  await page.waitForSelector('#accountTable tbody tr', { timeout: 30000 });
  console.log('loc count after wait', await page.locator('#accountTable tbody tr').count());
  console.log('texts', await page.locator('#accountTable tbody tr').allTextContents());
  await page.getByRole('link', { name: 'Open New Account' }).click();
  await page.locator('#type').selectOption('0');
  await page.locator('#fromAccountId').selectOption({ index: 0 });
  await page.getByRole('button', { name: 'Open New Account' }).click();
  await page.waitForSelector('#newAccountId', { state: 'visible', timeout: 20000 });
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  await page.waitForSelector('#accountTable tbody tr', { timeout: 30000 });
  console.log('loc count after second wait', await page.locator('#accountTable tbody tr').count());
  console.log('texts after second', await page.locator('#accountTable tbody tr').allTextContents());
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
