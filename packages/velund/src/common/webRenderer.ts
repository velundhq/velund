const VelundRenderer = {
  async render(
    component: string,
    context?: Record<string, any>,
    meta?: boolean
  ) {
    //@ts-ignore
    const raw = await fetch(
      //@ts-ignore
      `${window.__RENDER_URL__}?${new URLSearchParams({
        component,
        context: JSON.stringify(context || {}),
      })}`
    );
    const res = await raw.json();
    return meta ? res : res.html;
  },
};

export default VelundRenderer;
