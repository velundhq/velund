import { TwigRenderer } from './twigRenderer.js';
import { HtmlRenderer } from './htmlRenderer.js';
import { JinjaRenderer } from './jinjaRenderer.js';
export const renderers = {
  twig: new TwigRenderer(),
  jinja: new JinjaRenderer(),
  html: new HtmlRenderer(),
} as const;
