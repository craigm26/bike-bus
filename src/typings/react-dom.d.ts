// typings/react-dom.d.ts or react-dom.d.ts
import 'react-dom';

declare module 'react-dom' {
  interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }

  function createRoot(container: Element, options?: RootOptions): Root;
}
