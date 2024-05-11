declare module 'cytoscape-graphml' {
  const ext: (cy: typeof cytoscape, jquery: typeof jquery) => void;
  export = ext;
}