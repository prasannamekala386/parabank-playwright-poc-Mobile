import { test } from '../../fixtures/testFixtures';
import { generateRegistrationUser } from '../../utils/testDataGenerator';

function openRegistration(loginPage: { open(): Promise<void>; openRegistration(): Promise<void> }, registrationPage: { expectVisible(): Promise<void> }) {
  return (async () => {
    await loginPage.open();
    await loginPage.openRegistration();
    await registrationPage.expectVisible();
  })();
}

test('REG-011 @regression @registration - duplicate username is rejected', async ({ loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  await test.step('Register the first user', async () => {
    await openRegistration(loginPage, registrationPage);
    await registrationPage.register(user);
    await registrationPage.expectRegistrationSuccessful(user);
    await loginPage.logout();
  });
  await test.step('Attempt registration with the same username', async () => {
    await loginPage.openRegistration();
    await registrationPage.register(user);
    await registrationPage.expectValidationError();
  });
});

test('REG-012 @regression @registration - password confirmation mismatch blocks registration', async ({ loginPage, registrationPage }) => {
  const user = generateRegistrationUser();
  await test.step('Open the registration form', async () => {
    await openRegistration(loginPage, registrationPage);
  });
  await test.step('Submit mismatched passwords', async () => {
    await registrationPage.registerWithOverrides(user, { repeatedPassword: 'DifferentPassword123' });
  });
  await test.step('Verify registration remains blocked', async () => {
    await registrationPage.expectValidationError();
    await registrationPage.expectFormVisible();
  });
});
