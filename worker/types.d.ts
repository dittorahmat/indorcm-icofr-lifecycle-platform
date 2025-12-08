/**
 * Ambient module declarations to allow dynamic importing of the `xlsx` library
 * from either the ESM entry ('xlsx/xlsx.mjs') or the default package path ('xlsx').
 *
 * This silences TypeScript errors (TS7016) when using dynamic import(...) on these paths
 * in the worker code (see worker/user-routes.ts export logic).
 *
 * Note: These are lightweight declarations intended only to satisfy the compiler.
 * Runtime behavior is provided by the installed 'xlsx' package (loaded dynamically).
 */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* tslint:disable:interface-name */
declare module 'xlsx/xlsx.mjs' {
  const content: any;
  export default content;
}
declare module 'xlsx' {
  const content: any;
  export default content;
}