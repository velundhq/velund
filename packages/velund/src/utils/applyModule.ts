export function applyModule(
  ctx: Record<string, any>,
  module: Function,
  args: any[]
) {
  const moduleResult = module.apply(ctx, args);
  Object.entries(moduleResult).forEach(([key, val]) => (ctx[key] = val));
}
