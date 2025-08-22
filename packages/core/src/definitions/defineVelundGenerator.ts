import { VelundGeneratorDescriptor } from '../types.js';

export const defineVelundGenerator = <
  T extends Record<string, any> | void = void,
>(
  factory: (options?: T) => VelundGeneratorDescriptor
): ((options?: T) => VelundGeneratorDescriptor) => {
  return factory;
};
