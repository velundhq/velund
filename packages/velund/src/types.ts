import {
  VelundGeneratorDescriptor,
  VelundRendererDescriptor,
} from '@velund/core';
import { VelundNodeGeneratorOptions } from '@velund/node';

export interface iTwigPluginConfig {
  assetsUrl: string;
  generator: 'node' | string;
  renderer: 'html' | string;
  strictTemplateExtensions: boolean;
  generators: VelundGeneratorDescriptor[];
  renderers: VelundRendererDescriptor[];
  nodeConfig?: VelundNodeGeneratorOptions;
}
