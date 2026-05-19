/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_WORKFLOW_APPROVAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}