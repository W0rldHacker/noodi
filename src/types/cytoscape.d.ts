import cytoscape, { Core } from 'cytoscape';

declare module 'cytoscape' {
  interface Core {
    graphml: (options?: any) => any;
  }
}