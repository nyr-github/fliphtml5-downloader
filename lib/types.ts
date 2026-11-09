export interface FlipPage {
  n: string[];
  t?: string;
}

export interface FlipConfig {
  fliphtml5_pages: FlipPage[] | string;
  meta?: {
    title?: string;
    pageWidth?: number;
    pageHeight?: number;
  };
  loadingConfig?: { isEncryptionBook?: boolean };
}

declare global {
  interface Window {
    allocateUTF8?: (str: string) => number;
    Module?: { isReady?: boolean; _DeString: (ptr: number) => number };
    UTF8ToString?: (ptr: number) => string;
  }
}
