export type PlainObject = Record<string | number | symbol, any>;

/**
 * Глубокое слияние объектов и массивов
 */
export function deepMerge<T extends PlainObject, U extends PlainObject>(
  target: T,
  source: U
): T & U {
  if (!isObject(target) || !isObject(source)) {
    return source as T & U;
  }

  const result: PlainObject = Array.isArray(target)
    ? [...target]
    : { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      // массивы мержим как concat
      result[key] = Array.isArray(result[key])
        ? [...result[key], ...value]
        : [...value];
    } else if (isObject(value)) {
      result[key] = deepMerge(
        (result[key] as PlainObject) ?? {},
        value as PlainObject
      );
    } else {
      result[key] = value;
    }
  }

  return result as T & U;
}

function isObject(value: unknown): value is PlainObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
