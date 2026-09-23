import { test } from '../../fixtures/testFixtures';
import { RegistrationPage, RegistrationField } from '../../pages/RegistrationPage';
import { generateRegistrationUser } from '../../utils/testDataGenerator';

const registrationNegativeData = require('../../data/registrationNegativeData.json') as Array<{
  id: string;
  field: RegistrationField;
  title: string;
}>;

for (const scenario of registrationNegativeData) {
  test(`${scenario.id} @regression @registration - ${scenario.title} is mandatory`, async ({ loginPage, registrationPage }) => {
    const user = generateRegistrationUser();
    await test.step('Open the registration form', async () => {
      await loginPage.open();
      await loginPage.openRegistration();
      await registrationPage.expectVisible();
    });
    await test.step(`Submit registration with ${scenario.title} blank`, async () => {
      await registrationPage.registerWithOverrides(user, { [scenario.field]: '' });
    });
    await test.step('Verify field validation is displayed', async () => {
      await registrationPage.expectFieldBlank(scenario.field);
      await registrationPage.expectValidationError();
    });
  });
}
