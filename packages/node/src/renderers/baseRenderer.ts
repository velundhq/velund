import type { VelundComponentDescriptor } from '@velund/core';

export interface RendererConfig {
  components: VelundComponentDescriptor<any, any>[];
  outDir: string;
}

export interface IRenderer {
  generate(config: RendererConfig): void;
}
