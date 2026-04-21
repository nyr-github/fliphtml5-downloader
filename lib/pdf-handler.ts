// 动态导入 pdfjs-dist 以避免 Next.js SSR 问题
let pdfjsLib: any = null;

async function ensurePdfjsLoaded() {
  if (!pdfjsLib && typeof window !== "undefined") {
    const pdfjs = await import("pdfjs-dist");
    pdfjsLib = pdfjs;
    // 使用相同版本的 worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

/**
 * 从加密的 ZIP/PDF 文件中获取 URL 和密码
 * 基于提供的 getBlob 函数逻辑
 */
export async function getBlob(
  url: string,
): Promise<{ url: string; password: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";

    xhr.onload = function () {
      if (this.readyState === 4 && this.status === 200) {
        const response = this.response as Blob;
        const now = new Date().getTime();
        (window as any).response = response;

        const fileReader1 = new FileReader();
        fileReader1.onload = function () {
          const arrayBuffer = new Uint8Array(this.result as ArrayBuffer);
          (window as any).arrayBuffer = arrayBuffer;

          // 提取 PDF 数据部分
          const pdfData = response.slice(
            1083,
            response.size - 1003,
            "application/pdf",
          );

          // 提取密码相关的数据
          let password = "";
          const part1 = response.slice(1080, 1083);
          const part2 = response.slice(
            response.size - 1003,
            response.size - 1000,
          );

          const fileReader2 = new FileReader();
          fileReader2.onload = function () {
            password = (this.result as string) + password;

            const fileReader3 = new FileReader();
            fileReader3.onload = function () {
              password += this.result as string;

              // 解密 PDF 数据
              const encryptedPart = pdfData.slice(0, 4000);
              const fileReader4 = new FileReader();
              fileReader4.onload = function () {
                const decrypted = new Uint8Array(this.result as ArrayBuffer);
                // 对每个字节进行取反操作 (255 - value)
                for (let i = 0; i < decrypted.byteLength; i++) {
                  decrypted[i] = 255 - decrypted[i];
                }

                // 组合解密后的部分和剩余部分
                const decryptedPdf = new Blob(
                  [
                    new Blob([decrypted.buffer]),
                    pdfData.slice(4000, pdfData.size),
                  ],
                  { type: "application/pdf" },
                );

                // 创建 object URL
                const pdfUrl = window.URL.createObjectURL(decryptedPdf);
                resolve({ url: pdfUrl, password });
              };
              fileReader4.readAsArrayBuffer(encryptedPart);
            };
            fileReader3.readAsText(part2);
          };
          fileReader2.readAsText(part1);
        };
        fileReader1.readAsArrayBuffer(response);
      } else {
        reject(new Error(`Failed to load ZIP file: ${this.status}`));
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error while loading ZIP file"));
    };

    xhr.send();
  });
}

/**
 * 从 PDF 文件中提取所有页面为图片
 * @param pdfUrl PDF 文件的 URL
 * @param password 密码（如果需要）
 * @param onProgress 进度回调
 * @returns 图片数据数组
 */
export async function extractPdfPages(
  pdfUrl: string,
  password: string,
  onProgress?: (currentPage: number, totalPages: number) => void,
): Promise<Array<{ data: string; w: number; h: number }>> {
  const lib = await ensurePdfjsLoaded();
  if (!lib) {
    throw new Error("Failed to load PDF.js library");
  }

  const loadingTask = lib.getDocument({
    url: pdfUrl,
    password: password,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const results: Array<{ data: string; w: number; h: number }> = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x 缩放以获得更好的质量

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context failed");
    }

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    results.push({
      data: imageData,
      w: viewport.width,
      h: viewport.height,
    });

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return results;
}

/**
 * 检查 URL 是否以 .zip 结尾
 */
export function isZipUrl(url: string): boolean {
  return url.toLowerCase().endsWith(".zip");
}
