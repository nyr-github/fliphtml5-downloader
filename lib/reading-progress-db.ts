/**
 * IndexedDB 工具类 - 用于存储和检索书籍阅读进度
 */

const DB_NAME = "FlipbookReaderDB";
const DB_VERSION = 1;
const STORE_NAME = "readingProgress";

// 检测浏览器是否支持 IndexedDB
export function isIndexedDBSupported(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
  title?: string;
  id1?: string;
  id2?: string;
  thumbnail?: string;
}

class ReadingProgressDB {
  private db: IDBDatabase | null = null;
  private supported: boolean;
  private initialized: boolean = false;

  constructor() {
    this.supported = isIndexedDBSupported();
  }

  isSupported(): boolean {
    return this.supported;
  }

  async init(): Promise<void> {
    // 如果不支持 IndexedDB，直接返回
    if (!this.supported) {
      console.warn("IndexedDB is not supported in this browser");
      return;
    }

    if (this.initialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "bookId" });
          store.createIndex("lastReadAt", "lastReadAt", { unique: false });
        }
      };
    });
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    // 如果不支持 IndexedDB，直接返回
    if (!this.supported) {
      return;
    }

    if (!this.db) {
      await this.init();
    }

    // 如果初始化失败，直接返回
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        ...progress,
        lastReadAt: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save progress"));
    });
  }

  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    // 如果不支持 IndexedDB，直接返回 null
    if (!this.supported) {
      return null;
    }

    if (!this.db) {
      await this.init();
    }

    // 如果初始化失败，直接返回 null
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(bookId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error("Failed to get progress"));
    });
  }

  async deleteProgress(bookId: string): Promise<void> {
    // 如果不支持 IndexedDB，直接返回
    if (!this.supported) {
      return;
    }

    if (!this.db) {
      await this.init();
    }

    // 如果初始化失败，直接返回
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(bookId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete progress"));
    });
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    // 如果不支持 IndexedDB，直接返回空数组
    if (!this.supported) {
      return [];
    }

    if (!this.db) {
      await this.init();
    }

    // 如果初始化失败，直接返回空数组
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as ReadingProgress[];
        // 按最后阅读时间排序
        results.sort(
          (a, b) =>
            new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime(),
        );
        resolve(results);
      };
      request.onerror = () => reject(new Error("Failed to get all progress"));
    });
  }
}

// 创建单例实例
export const readingProgressDB = new ReadingProgressDB();

// 初始化数据库
readingProgressDB.init().catch((err) => {
  console.error("Failed to initialize reading progress database:", err);
});
