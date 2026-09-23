import { randomUUID } from 'node:crypto';
import { uniqueValue } from './randomData';

export interface RegistrationUser {
	firstName: string;
	lastName: string;
	address: string;
	city: string;
	state: string;
	zipCode: string;
	phoneNumber: string;
	ssn: string;
	username: string;
	password: string;
}

export function generateRegistrationUser(): RegistrationUser {
	const username = `smoke${Date.now().toString().slice(-8)}${randomUUID().replace(/-/g, '').slice(0, 7)}`;
	return {
		firstName: 'Smoke',
		lastName: 'Tester',
		address: '1 Test Street',
		city: 'Austin',
		state: 'Texas',
		zipCode: '78701',
		phoneNumber: '5125550100',
		ssn: uniqueValue('ssn').slice(-9),
		username,
		password: 'SmokePassword123',
	};
}
