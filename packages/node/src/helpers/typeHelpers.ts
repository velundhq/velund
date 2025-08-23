import type { TSchema } from '@sinclair/typebox';

type Seen = Set<TSchema>;
export function toTsType(
  schema: TSchema | undefined,
  seen: Seen = new Set()
): string {
  if (!schema) return 'any';
  if (seen.has(schema)) return 'any';
  seen.add(schema);

  const { type } = schema as any;
  if ('const' in (schema as any)) {
    const v = (schema as any).const;
    return typeof v === 'string' ? JSON.stringify(v) : String(v);
  }
  if ('enum' in (schema as any) && Array.isArray((schema as any).enum)) {
    return (
      (schema as any).enum
        .map((v: any) =>
          typeof v === 'string' ? JSON.stringify(v) : String(v)
        )
        .join(' | ') || 'never'
    );
  }
  if ('oneOf' in (schema as any))
    return (schema as any).oneOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' | ');
  if ('anyOf' in (schema as any))
    return (schema as any).anyOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' | ');
  if ('allOf' in (schema as any))
    return (schema as any).allOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' & ');
  if (type === 'array') return `${toTsType((schema as any).items, seen)}[]`;
  if (type === 'object' || (schema as any).properties) {
    const props = (schema as any).properties ?? {};
    const required: string[] = (schema as any).required ?? [];
    const entries = Object.entries(props).map(
      ([key, s]) =>
        `${key}${required.includes(key) ? '' : '?'}: ${toTsType(s as TSchema, seen)};`
    );
    const ap = (schema as any).additionalProperties;
    if (ap)
      entries.push(
        `[k: string]: ${ap === true ? 'any' : toTsType(ap as TSchema, seen)};`
      );
    return `{\n${entries.map((l) => '  ' + l).join('\n')}\n}`;
  }
  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'null') return 'null';
  if ((schema as any).format === 'date-time') return 'string';
  if ((schema as any).nullable) {
    const clone = { ...(schema as any) };
    delete (clone as any).nullable;
    return `${toTsType(clone as TSchema, seen)} | null`;
  }
  return 'any';
}

export function schemaToInterface(name: string, schema?: TSchema): string {
  if (!schema) return `export interface ${name} { [k: string]: any }`;
  const body = toTsType(schema);
  if (body.trim().startsWith('{')) return `export interface ${name} ${body}`;
  return `export type ${name} = ${body};`;
}
