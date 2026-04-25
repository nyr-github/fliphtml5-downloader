export interface FlipPage {
  n: string[];
  t: string;
}

export interface FlipConfig {
  fliphtml5_pages: FlipPage[] | string;
  meta?: {
    title?: string;
    pageWidth?: number;
    pageHeight?: number;
  };
  loadingConfig?: {
    isEncryptionBook?: boolean;
  };
  isEncryptionBook?: boolean;
}

declare global {
  interface Window {
    htmlConfig: FlipConfig;
    allocateUTF8?: (str: string) => any;
    Module?: { _DeString: (ptr: any) => any };
    UTF8ToString?: (ptr: any) => string;
  }
}
