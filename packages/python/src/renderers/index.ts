import { HtmlRenderer } from './htmlRenderer.js';
import { JinjaRenderer } from './jinjaRenderer.js';
export const renderers = {
  jinja: new JinjaRenderer(),
  html: new HtmlRenderer(),
} as const;
