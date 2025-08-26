import { TSchema } from '@sinclair/typebox';
import {
  DefineComponentOptions,
  VelundComponentDescriptor,
} from '@velund/core';

export function defineComponent<
  TFinal extends TSchema = any,
  TProps extends TSchema = any,
>(
  opts: DefineComponentOptions<TFinal, TProps>
): VelundComponentDescriptor<TFinal, TProps> {
  if (!opts || typeof opts !== 'object') throw new Error('Options required');
  if (!opts.name || typeof opts.name !== 'string')
    throw new Error('Option "name" is required');

  const descriptor: VelundComponentDescriptor<TFinal, TProps> = {
    name: opts.name,
    template: opts.template || 'Empty template',
    propsSchema: opts.propsSchema,
    contextSchema: opts.contextSchema,
    prepare: opts.prepare,
    __raw: opts,
  };

  return descriptor;
}

export default defineComponent;
