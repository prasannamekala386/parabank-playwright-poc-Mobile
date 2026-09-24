import { readFile } from 'node:fs/promises';

export async function readCsvRecords<T extends Record<string, string>>(filePath: string): Promise<T[]> {
	const content = await readFile(filePath, 'utf8');
	const [headerLine, ...dataLines] = content.trim().split(/\r?\n/);
	const headers = headerLine.split(',').map((header) => header.trim());
	return dataLines.filter(Boolean).map((line) => {
		const values = line.split(',').map((value) => value.trim());
		return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])) as T;
	});
}
