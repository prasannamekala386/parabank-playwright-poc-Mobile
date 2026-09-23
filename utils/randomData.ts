export function uniqueValue(prefix: string): string {
	return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}
