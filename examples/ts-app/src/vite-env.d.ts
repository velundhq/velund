/// <reference types="vite/client" />

declare module '*.twig' {
  const content: string;
  export default content;
}

declare module '*.html' {
  const content: string;
  export default content;
}

declare module '*.j2' {
  const content: string;
  export default content;
}
