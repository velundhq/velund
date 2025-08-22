import {
  VelundGeneratorDescriptor,
  VelundRendererDescriptor,
} from '@velund/core';

export interface iTwigPluginConfig {
  assetsUrl: string;
  generator: string;
  renderer: string;
  generators: VelundGeneratorDescriptor[];
  renderers: VelundRendererDescriptor[];
}
