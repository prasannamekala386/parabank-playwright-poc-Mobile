export type Schema = {
	type?: 'object' | 'array' | 'string' | 'number';
	required?: string[];
	properties?: Record<string, Schema>;
	items?: Schema;
};

export function validateSchema(value: unknown, schema: Schema, path = '$'): string[] {
	const errors: string[] = [];
	if (schema.type === 'object') {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) return [`${path} must be an object`];
		for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${path}.${key} is required`);
		for (const [key, child] of Object.entries(schema.properties ?? {})) if (key in value) errors.push(...validateSchema((value as Record<string, unknown>)[key], child, `${path}.${key}`));
	} else if (schema.type === 'array') {
		if (!Array.isArray(value)) return [`${path} must be an array`];
		if (schema.items) value.forEach((item, index) => errors.push(...validateSchema(item, schema.items as Schema, `${path}[${index}]`)));
	} else if (schema.type === 'string' && typeof value !== 'string') errors.push(`${path} must be a string`);
	else if (schema.type === 'number' && typeof value !== 'number') errors.push(`${path} must be a number`);
	return errors;
}