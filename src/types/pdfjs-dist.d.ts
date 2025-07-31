declare module 'pdfjs-dist/build/pdf.worker.mjs' {
  // This module doesn't export anything directly, it just needs to be imported
  // to register the worker
  const worker: any;
  export default worker;
}
