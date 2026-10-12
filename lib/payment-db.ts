/**
 * 付费授权存储 - 使用 IndexedDB 保存已解锁文件的许可，localStorage 记录每日免费额度。
 *
 * 说明：凭证仅存在于当前浏览器，切换浏览器/设备、清除站点数据或使用无痕模式会丢失，
 * 届时需要重新支付解锁。
 */

const DB_NAME = "FlipbookPaymentDB";
const DB_VERSION = 1;
const STORE_NAME = "licenses";

// 每日免费额度（localStorage）
const FREE_DATE_KEY = "fbl_freeDate";
const FREE_BOOK_KEY = "fbl_freeBookKey";

// 周卡（localStorage）：ISO 时间戳，当前时间小于此时间即视为有效
const WEEK_PASS_KEY = "fbl_weekPassUntil";
export const WEEK_PASS_DAYS = 7;

export function isIndexedDBSupported(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window;
}

export interface PaymentLicense {
    bookKey: string;
    orderNumber: string;
    transactionId?: string;
    paidAt: string;
}

function todayString(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

class PaymentDB {
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
        if (!this.supported || this.initialized) {
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("Failed to open payment IndexedDB");
                reject(new Error("Failed to open payment IndexedDB"));
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.initialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "bookKey" });
                }
            };
        });
    }

    async hasLicense(bookKey: string): Promise<boolean> {
        if (!this.supported) {
            return false;
        }
        if (!this.db) {
            await this.init();
        }
        if (!this.db) {
            return false;
        }

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(bookKey);
            request.onsuccess = () => resolve(Boolean(request.result));
            request.onerror = () => resolve(false);
        });
    }

    async saveLicense(license: PaymentLicense): Promise<void> {
        if (!this.supported) {
            return;
        }
        if (!this.db) {
            await this.init();
        }
        if (!this.db) {
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ ...license, paidAt: license.paidAt || new Date().toISOString() });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error("Failed to save license"));
        });
    }
}

export const paymentDB = new PaymentDB();

// 初始化数据库
paymentDB.init().catch((err) => {
    console.error("Failed to initialize payment database:", err);
});

/**
 * 周卡：一次支付后 7 天内（从当前时间或从现有到期时间取较大者开始算）所有下载免费。
 * 与单书授权相互独立，不会抹除已有 licenses；也不会自动消费每日免费额度。
 */
export function hasActiveWeeklyPass(): boolean {
    if (typeof window === "undefined") return false;
    const until = localStorage.getItem(WEEK_PASS_KEY);
    if (!until) return false;
    const ts = Date.parse(until);
    if (!Number.isFinite(ts)) return false;
    return ts > Date.now();
}

export function getWeeklyPassExpiresAt(): string | null {
    if (typeof window === "undefined") return null;
    const until = localStorage.getItem(WEEK_PASS_KEY);
    if (!until) return null;
    const ts = Date.parse(until);
    if (!Number.isFinite(ts) || ts <= Date.now()) return null;
    return until;
}

export function activateWeeklyPass(days: number = WEEK_PASS_DAYS): string {
    const now = Date.now();
    const existingRaw =
        typeof window !== "undefined" ? localStorage.getItem(WEEK_PASS_KEY) : null;
    const existingTs = existingRaw ? Date.parse(existingRaw) : NaN;
    const base =
        Number.isFinite(existingTs) && existingTs > now ? existingTs : now;
    const until = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
    if (typeof window !== "undefined") {
        localStorage.setItem(WEEK_PASS_KEY, until);
    }
    return until;
}

/**
 * 判断并消费「今日免费额度」。
 * - 今日尚未使用免费额度：放行，记录今日免费文件为 bookKey。
 * - 今日免费额度已用于同一 bookKey：仍放行（当天重复下载同一本免费）。
 * - 今日免费额度已用于其他文件：不放行（需付费）。
 */
export function consumeOrCheckFreeToday(bookKey: string): boolean {
    if (typeof window === "undefined") {
        return false;
    }
    const today = todayString();
    const savedDate = localStorage.getItem(FREE_DATE_KEY);
    const savedBook = localStorage.getItem(FREE_BOOK_KEY);

    // 新的一天，重置
    if (savedDate !== today) {
        localStorage.setItem(FREE_DATE_KEY, today);
        localStorage.setItem(FREE_BOOK_KEY, bookKey);
        return true;
    }

    // 同一天，且免费额度给了同一本
    if (savedBook === bookKey) {
        return true;
    }

    // 同一天，免费额度已给别的书
    return false;
}
