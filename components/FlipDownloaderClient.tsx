'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Download, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  X,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FlipPage, FlipConfig } from '@/lib/types';
import { decryptPages, loadScript } from '@/lib/decryption';

interface DownloadTask {
  id: string; // unique timestamp based ID
  url: string;
  status: 'idle' | 'loading' | 'processing' | 'done' | 'error';
  progress: number;
  currentPage: number;
  totalPages: number;
  title: string;
  errorMessage?: string;
  pdfData?: jsPDF;
  imageUrls?: string[];
  pdfBlobUrl?: string; // Add blob URL for more reliable downloads
  id1?: string;
  id2?: string;
}

// Helper for concurrency
async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<any>[] = [];
  for (const [index, item] of array.entries()) {
    const p = iteratorFn(item, index);
    ret.push(p);
    if (poolLimit <= array.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

export default function FlipDownloaderClient({ initialUrl, autoStart = true }: { initialUrl?: string, autoStart?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [readerTask, setReaderTask] = useState<DownloadTask | null>(null);
  const [readerPageIndex, setReaderPageIndex] = useState(0);
  const searchParams = useSearchParams();
  const initialUrlProcessed = React.useRef(false);

  const updateTask = useCallback((id: string, updates: Partial<DownloadTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const extractIds = useCallback((urlStr: string) => {
    try {
      const urlObj = new URL(urlStr.trim());
      const pathParts = urlObj.pathname.split('/').filter(p => p !== '');
      if (pathParts.length >= 2) {
        return { id1: pathParts[0], id2: pathParts[1] };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const loadConfig = useCallback((id1: string, id2: string): Promise<FlipConfig> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://online.fliphtml5.com/${id1}/${id2}/javascript/config.js?t=${Date.now()}`;
      script.async = true;
      const timeout = setTimeout(() => {
        if (script.parentNode) document.body.removeChild(script);
        reject(new Error("Loading timed out."));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        const config = (window as any).htmlConfig;
        if (config) resolve(config);
        else reject(new Error("Failed to parse config."));
        if (script.parentNode) document.body.removeChild(script);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load script. Check URL or restrictions."));
        if (script.parentNode) document.body.removeChild(script);
      };
      document.body.appendChild(script);
    });
  }, []);

  const fetchImageWithMeta = useCallback((imgUrl: string): Promise<{ data: string; w: number; h: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous'; 
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0);
        try {
          resolve({ data: canvas.toDataURL('image/jpeg', 0.95), w: img.width, h: img.height });
        } catch (e) {
          reject(new Error('CORS fail'));
        }
      };
      img.onerror = () => reject(new Error(`Failed to load: ${imgUrl}`));
      img.src = imgUrl;
    });
  }, []);

  const recordDownloadSuccess = useCallback(async (id1: string, id2: string, title: string, thumbnail: string, pageCount: number) => {
    try {
      await fetch('/api/books/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id1, id2, title, thumbnail, pageCount })
      });
    } catch (e) {
      console.error('Failed to record download in database');
    }
  }, []);

  const startDownload = useCallback(async (url: string, existingTaskId?: string) => {
    const ids = extractIds(url);
    if (!ids) {
      alert('Invalid URL format');
      return;
    }

    const taskId = existingTaskId || `${Date.now()}`;
    
    if (!existingTaskId) {
      const newTask: DownloadTask = {
        id: taskId,
        url,
        status: 'loading',
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        title: ids.id2,
        id1: ids.id1,
        id2: ids.id2
      };
      setTasks(prev => [newTask, ...prev]);
      setUrlInput('');
    } else {
      updateTask(taskId, { status: 'loading', errorMessage: undefined });
    }

    try {
      const config = await loadConfig(ids.id1, ids.id2);
      let pages: FlipPage[] = [];
      
      if (typeof config.fliphtml5_pages === 'string') {
        updateTask(taskId, { errorMessage: "Decrypting content structure..." });
        pages = await decryptPages(config.fliphtml5_pages);
      } else {
        pages = config.fliphtml5_pages;
      }

      const bookTitle = config.meta?.title || ids.id2;
      const metaWidth = config.meta?.pageWidth ? Number(config.meta.pageWidth) : null;
      const metaHeight = config.meta?.pageHeight ? Number(config.meta.pageHeight) : null;
      const firstPageThumb = pages[0].t;

      updateTask(taskId, { 
        status: 'processing', 
        totalPages: pages.length, 
        title: bookTitle 
      });

      const baseUrl = `https://online.fliphtml5.com/${ids.id1}/${ids.id2}/`;
      const imageUrls = pages.map(p => {
        const relativePath = p.n[0].replace(/\\/g, '/');
        return baseUrl + (relativePath.startsWith('./') ? relativePath.substring(2) : "files/large/"+relativePath);
      });

      let completed = 0;
      const results = await asyncPool(5, imageUrls, async (imgUrl) => {
        try {
          const res = await fetchImageWithMeta(imgUrl);
          completed++;
          updateTask(taskId, { 
            progress: (completed / pages.length) * 100,
            currentPage: completed 
          });
          return res;
        } catch (err) {
          return null;
        }
      });

      const validResults = results.filter(r => r !== null) as { data: string; w: number; h: number }[];
      if (validResults.length === 0) throw new Error("No pages could be downloaded.");

      const first = validResults[0];
      const initialWidth = metaWidth || first.w;
      const initialHeight = metaHeight || first.h;

      const pdf = new jsPDF({
        orientation: initialWidth > initialHeight ? 'l' : 'p',
        unit: 'px',
        format: [initialWidth, initialHeight]
      });

      for (let i = 0; i < validResults.length; i++) {
        const page = validResults[i];
        const pWidth = metaWidth || page.w;
        const pHeight = metaHeight || page.h;
        if (i > 0) pdf.addPage([pWidth, pHeight], pWidth > pHeight ? 'l' : 'p');
        pdf.addImage(page.data, 'JPEG', 0, 0, pWidth, pHeight);
      }

      // Record success in DB
      recordDownloadSuccess(ids.id1, ids.id2, bookTitle, firstPageThumb, pages.length);

      // Create a blob for manual download support
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      updateTask(taskId, { 
        status: 'done', 
        progress: 100, 
        pdfData: pdf,
        pdfBlobUrl: blobUrl,
        imageUrls: imageUrls
      });
      
      // Auto save on first completion
      const safeTitle = bookTitle.replace(/[/\\?%*:|"<>]/g, '_') || 'book';
      const finalFileName = `${safeTitle}.pdf`;
      
      const autoLink = document.createElement('a');
      autoLink.href = blobUrl;
      autoLink.download = finalFileName;
      autoLink.style.display = 'none';
      document.body.appendChild(autoLink);
      autoLink.click();
      setTimeout(() => {
        document.body.removeChild(autoLink);
      }, 100);
      
    } catch (err: any) {
      updateTask(taskId, { status: 'error', errorMessage: err.message });
    }
  }, [extractIds, loadConfig, fetchImageWithMeta, recordDownloadSuccess, updateTask]);

  useEffect(() => {
    const urlParam = searchParams.get('url') || initialUrl;
    if (urlParam && mounted && !initialUrlProcessed.current) {
      initialUrlProcessed.current = true;
      setUrlInput(urlParam);
      
      if (autoStart) {
        setTimeout(() => startDownload(urlParam), 0);
      } else {
        // Create idle task
        const ids = extractIds(urlParam);
        if (ids) {
          const taskId = `${Date.now()}`;
          const idleTask: DownloadTask = {
            id: taskId,
            url: urlParam,
            status: 'idle',
            progress: 0,
            currentPage: 0,
            totalPages: 0,
            title: ids.id2,
            id1: ids.id1,
            id2: ids.id2
          };
          setTimeout(() => setTasks([idleTask]), 0);
        }
      }
    }
  }, [mounted, searchParams, startDownload, initialUrl, autoStart, extractIds]);

  if (!mounted) {
    return <div className="p-3 md:p-4 bg-white/50 rounded-3xl min-h-[100px] animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      {/* Input Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-3 md:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white mb-8"
      >
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Paste FlipHTML5 book link here..."
            className="w-full pl-6 pr-14 py-4 md:py-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF6B35]/30 focus:ring-4 focus:ring-[#FF6B35]/5 transition-all outline-none text-base md:text-lg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startDownload(urlInput)}
          />
          <button
            onClick={() => startDownload(urlInput)}
            disabled={!urlInput}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center hover:bg-[#333] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Dynamic Task List */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm relative overflow-hidden group"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm md:text-base truncate pr-4">{task.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {task.status === 'loading' || task.status === 'processing' ? (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#FF6B35]">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing {task.currentPage}/{task.totalPages}</span>
                      </div>
                    ) : task.status === 'idle' ? (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Ready to Process</span>
                      </div>
                    ) : task.status === 'done' ? (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Complete</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeTask(task.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${task.status === 'error' ? 'bg-red-400' : 'bg-[#FF6B35]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

               {task.status === 'idle' && (
                 <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => startDownload(task.url, task.id)}
                      className="flex-1 min-w-[200px] px-6 py-4 bg-[#1A1A1A] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
                    >
                      <Download className="w-5 h-5 text-[#FF6B35]" />
                      Start PDF Conversion
                    </button>
                    <Link 
                      href={`/read/${extractIds(task.url)?.id1}_${extractIds(task.url)?.id2}`} // Temporary link if dbId unknown, but in details page we won't show root downloader mostly
                      className="px-6 py-4 bg-white border border-gray-100 text-[#004E98] text-sm font-bold rounded-xl flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all"
                    >
                       <Eye className="w-5 h-5" />
                       Read Online
                    </Link>
                 </div>
              )}

              {task.status === 'done' && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => {
                      if (task.pdfBlobUrl) {
                        const link = document.createElement('a');
                        link.href = task.pdfBlobUrl;
                        const safe = task.title.replace(/[/\\?%*:|"<>]/g, '_') || 'book';
                        link.download = `${safe}.pdf`;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        setTimeout(() => {
                          document.body.removeChild(link);
                        }, 100);
                      } else if (task.pdfData) {
                        const safe = task.title.replace(/[/\\?%*:|"<>]/g, '_') || 'book';
                        task.pdfData.save(`${safe}.pdf`);
                      }
                    }}
                    className="flex-1 min-w-[140px] px-6 py-3 bg-[#1A1A1A] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button 
                    onClick={() => {
                      setReaderTask(task);
                      setReaderPageIndex(0);
                    }}
                    className="flex-1 min-w-[140px] px-6 py-3 bg-white border border-gray-100 text-[#004E98] text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Read Online
                  </button>
                </div>
              )}

              {task.status === 'error' && (
                <p className="mt-3 text-xs text-red-500 font-medium leading-relaxed">
                  {task.errorMessage}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 grayscale">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm italic">Enter a book link to begin conversion</p>
          </motion.div>
        )}
      </div>

      {/* Online Reader Modal */}
      <AnimatePresence>
        {readerTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          >
            <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
              <span className="text-white/60 text-sm font-bold uppercase tracking-widest hidden md:inline">
                {readerPageIndex + 1} / {readerTask.totalPages}
              </span>
              <button 
                onClick={() => setReaderTask(null)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center">
              {/* Preloading Layer */}
              <div className="hidden">
                {readerTask.imageUrls?.slice(readerPageIndex + 1, readerPageIndex + 6).map((url, i) => (
                  <img key={`preload-${i}`} src={url} alt="" referrerPolicy="no-referrer" />
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={readerPageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative w-full h-full"
                >
                  {readerTask.imageUrls && (
                    <div className="relative w-full h-full">
                      <Image 
                        src={readerTask.imageUrls[readerPageIndex]}
                        alt={`Page ${readerPageIndex + 1}`}
                        fill
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              <button 
                onClick={() => setReaderPageIndex(p => Math.max(0, p - 1))}
                disabled={readerPageIndex === 0}
                className="absolute left-0 h-full w-1/4 flex items-center justify-start group disabled:opacity-0"
              >
                <div className="w-12 h-12 ml-4 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
                  <ChevronLeft className="w-6 h-6" />
                </div>
              </button>
              <button 
                onClick={() => setReaderPageIndex(p => Math.min(readerTask.totalPages - 1, p + 1))}
                disabled={readerPageIndex === readerTask.totalPages - 1}
                className="absolute right-0 h-full w-1/4 flex items-center justify-end group disabled:opacity-0"
              >
                <div className="w-12 h-12 mr-4 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </button>
            </div>

            <div className="mt-8 flex items-center gap-8 md:hidden">
               <span className="text-white/60 text-sm font-bold uppercase tracking-widest ">
                {readerPageIndex + 1} / {readerTask.totalPages}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
