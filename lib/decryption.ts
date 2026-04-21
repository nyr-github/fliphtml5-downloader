import { FlipPage } from './types';

// Utility to load external scripts
export const loadScript = (src: string): Promise<void> => {
  if (typeof document === 'undefined') return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    // Basic check if already exists
    const basicSrc = src.split('?')[0];
    if (document.querySelector(`script[src^="${basicSrc}"]`)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
};

export const decryptPages = async (encrypted: string): Promise<FlipPage[]> => {
  try {
    await loadScript('https://static.fliphtml5.com/resourceFiles/html5_templates/js/jquery-4.0.0.min.js');
    await loadScript('https://static.fliphtml5.com/resourceFiles/html5_templates/js/deString.js?1773640800');

    return new Promise((resolve, reject) => {
      const start = Date.now();
      const poll = setInterval(() => {
        if (typeof window !== 'undefined' && window.allocateUTF8 && window.Module?._DeString && window.UTF8ToString) {
          clearInterval(poll);
          try {
            const q = window.allocateUTF8(encrypted);
            const p = window.Module._DeString(q);
            let y = window.UTF8ToString(p);
            const u = y.lastIndexOf("]");
            if(0 < u){
              y = y.substring(0, u + 1);
            }
            resolve(JSON.parse(y));
          } catch (err) {
            reject(new Error("Decryption execution failed."));
          }
        } else if (Date.now() - start > 15000) { // Increased timeout slightly for safer loading
          clearInterval(poll);
          reject(new Error("Decryption engine timed out. Please check your network and refresh."));
        }
      }, 100);
    });
  } catch (err) {
    throw new Error("Failed to initialize decryption engine.");
  }
};
