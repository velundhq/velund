/**
 * Генерация PHP DTO с @property и @param PHPDoc
 * @param {object} schema — JSON Schema объекта
 * @param {string} className — имя PHP класса
 * @param {string} namespace — Название namespace для PHP класса
 * @returns {string} — PHP-класс как строка
 */
export function generatePhpDtoWithPhpDoc(schema, className, namespace = '') {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    throw new Error('Schema должен быть объектом с properties');
  }

  const required = new Set(schema.required || []);
  const props = schema.properties || {};

  const classDoc = [];
  const ctorParams = [];
  const ctorBody = [];
  const lines = [`<?php`, ``, `namespace ${namespace};`, ``];

  // Генерация @property и свойств класса
  classDoc.push('/**');
  for (const [name, prop] of Object.entries(props)) {
    const isOptional = !required.has(name);
    const typeStr = generatePhpDocType(prop, isOptional);
    classDoc.push(` * @property ${typeStr} $${name}`);
  }
  classDoc.push(' */');
  lines.push(...classDoc);

  lines.push(`class ${className}`);
  lines.push('{');

  // Свойства класса
  for (const [name, prop] of Object.entries(props)) {
    const isOptional = !required.has(name);
    const { typeHint, varDoc } = mapTypeWithPhpVar(prop, isOptional);
    if (varDoc) lines.push(`    ${varDoc}`);
    lines.push(`    public ${typeHint} $${name};`);
    ctorParams.push(
      `        ${typeHint} $${name}${isOptional ? ' = null' : ''}`
    );
    ctorBody.push(`        $this->${name} = $${name};`);
  }

  // Генерация конструктора с @param
  lines.push('');
  lines.push('    /**');
  for (const [name, prop] of Object.entries(props)) {
    const isOptional = !required.has(name);
    const typeStr = generatePhpDocType(prop, isOptional);
    lines.push(`     * @param ${typeStr} $${name}`);
  }
  lines.push('     */');
  lines.push('    public function __construct(');
  lines.push(ctorParams.join(',\n'));
  lines.push('    ) {');
  lines.push(ctorBody.join('\n'));
  lines.push('    }');

  lines.push('}');
  return lines.join('\n');
}

function mapTypeWithPhpVar(prop, isOptional) {
  switch (prop.type) {
    case 'string':
      return { typeHint: isOptional ? '?string' : 'string', varDoc: null };
    case 'number':
      return { typeHint: isOptional ? '?float' : 'float', varDoc: null };
    case 'integer':
      return { typeHint: isOptional ? '?int' : 'int', varDoc: null };
    case 'boolean':
      return { typeHint: isOptional ? '?bool' : 'bool', varDoc: null };
    case 'array':
      if (prop.items?.type === 'object') {
        const doc = generatePhpDocType(prop.items, false, true);
        return {
          typeHint: isOptional ? '?array' : 'array',
          varDoc: `/** @var ${doc}${isOptional ? '|null' : ''} */`,
        };
      } else if (prop.items?.type) {
        const primitive = mapPrimitiveType(prop.items.type);
        return {
          typeHint: isOptional ? '?array' : 'array',
          varDoc: `/** @var ${primitive}[]${isOptional ? '|null' : ''} */`,
        };
      } else {
        return { typeHint: isOptional ? '?array' : 'array', varDoc: null };
      }
    case 'object':
      const doc = generatePhpDocType(prop, isOptional);
      return {
        typeHint: isOptional ? '?array' : 'array',
        varDoc: `/** @var ${doc} */`,
      };
    default:
      return { typeHint: isOptional ? '?mixed' : 'mixed', varDoc: null };
  }
}

function generatePhpDocType(prop, isOptional = false, isArrayItem = false) {
  switch (prop.type) {
    case 'string':
      return isOptional ? 'string|null' : 'string';
    case 'number':
      return isOptional ? 'float|null' : 'float';
    case 'integer':
      return isOptional ? 'int|null' : 'int';
    case 'boolean':
      return isOptional ? 'bool|null' : 'bool';
    case 'array':
      if (prop.items?.type === 'object') {
        const inner = generatePhpDocType(prop.items, false);
        return `${inner}[]${isOptional ? '|null' : ''}`;
      } else if (prop.items?.type) {
        const primitive = mapPrimitiveType(prop.items.type);
        return `${primitive}[]${isOptional ? '|null' : ''}`;
      } else {
        return `array${isOptional ? '|null' : ''}`;
      }
    case 'object':
      if (!prop.properties) return `array${isOptional ? '|null' : ''}`;
      const parts = [];
      for (const [key, p] of Object.entries(prop.properties)) {
        const optionalSign = (prop.required || []).includes(key) ? '' : '|null';
        parts.push(
          `${key}: ${generatePhpDocType(
            p,
            !(prop.required || []).includes(key)
          )}`
        );
      }
      return `array{${parts.join(', ')}}${isOptional ? '|null' : ''}`;
    default:
      return isOptional ? 'mixed|null' : 'mixed';
  }
}

function mapPrimitiveType(type) {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'float';
    case 'integer':
      return 'int';
    case 'boolean':
      return 'bool';
    default:
      return 'mixed';
  }
}
