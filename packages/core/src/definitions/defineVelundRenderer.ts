import { VelundRendererDescriptor } from '../types.js';

export const defineVelundRenderer = <
  T extends Record<string, any> | void = void,
>(
  factory: (options?: T) => VelundRendererDescriptor
): ((options?: T) => VelundRendererDescriptor) => {
  return factory;
};
