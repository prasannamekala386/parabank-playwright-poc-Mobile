import { expect, test } from '../../fixtures/testFixtures';
import { generateRegistrationUser } from '../../utils/testDataGenerator';

const boundaryData = require('../../data/registrationBoundaryData.json') as {
  maximumLength: string;
};
const securityPayloads = require('../../data/securityPayloads.json') as {
  sqlInjection: string;
  xss: string;
  specialCharacters: string;
};

async function openRegistration(loginPage: { open(): Promise<void>; openRegistration(): Promise<void> }, registrationPage: { expectVisible(): Promise<void> }) {
  await loginPage.open();
  await loginPage.openRegistration();
  await registrationPage.expectVisible();
}

test('REG-013 @regression @registration - maximum length first name is handled safely', async ({ loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  await openRegistration(loginPage, registrationPage);
  await registrationPage.registerWithOverrides(user, { firstName: boundaryData.maximumLength });
  await registrationPage.expectNoServerError();
});

test('REG-014 @regression @registration - maximum length last name is handled safely', async ({ loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  await openRegistration(loginPage, registrationPage);
  await registrationPage.registerWithOverrides(user, { lastName: boundaryData.maximumLength });
  await registrationPage.expectNoServerError();
});

test('REG-015 @regression @security - SQL injection in username is safely handled', async ({ loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  await openRegistration(loginPage, registrationPage);
  await registrationPage.registerWithOverrides(user, { username: securityPayloads.sqlInjection });
  await registrationPage.expectNoServerError();
  await registrationPage.expectRegistrationNotSuccessful();
});

test('REG-016 @regression @security - SQL injection in first name is safely handled', async ({ loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  await openRegistration(loginPage, registrationPage);
  await registrationPage.registerWithOverrides(user, { firstName: securityPayloads.sqlInjection });
  await registrationPage.expectNoServerError();
  await registrationPage.expectRegistrationNotSuccessful();
});

test('REG-017 @regression @security - XSS in username does not execute', async ({ page, loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  let dialogShown = false;
  page.on('dialog', async (dialog) => {
    dialogShown = true;
    await dialog.dismiss();
  });
  await openRegistration(loginPage, registrationPage);
  await registrationPage.registerWithOverrides(user, { username: securityPayloads.xss });
  await registrationPage.expectNoServerError();
  await registrationPage.expectRegistrationNotSuccessful();
  expect(dialogShown).toBe(false);
});

test('REG-018 @regression @security - special characters are handled safely', async ({ loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  await openRegistration(loginPage, registrationPage);
  await registrationPage.registerWithOverrides(user, { firstName: securityPayloads.specialCharacters });
  await registrationPage.expectNoServerError();
  await registrationPage.expectRegistrationSuccessful(user);
});
