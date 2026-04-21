import { db } from '@/lib/db';
import { books } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export interface ExploreBook {
  id: string;
  title: string;
  thumbnail: string;
  pageCount: number;
  downloadCount: number;
  id1: string;
  id2: string;
}

export const getExploreBooks = unstable_cache(
  async (): Promise<ExploreBook[]> => {
    try {
      const results = await db.select().from(books).orderBy(desc(books.downloadCount)).limit(50);
      return results.map(b => ({
        id: b.id,
        title: b.title,
        thumbnail: b.thumbnail,
        pageCount: b.pageCount,
        downloadCount: b.downloadCount,
        id1: b.id1,
        id2: b.id2
      }));
    } catch (error) {
      console.error('Error fetching explore books:', error);
      return [];
    }
  },
  ['explore-books'],
  { revalidate: 86400 } // 24 hours
);

export async function getBookById(id: string): Promise<ExploreBook | null> {
  try {
    const result = await db.query.books.findFirst({
      where: eq(books.id, id)
    });
    
    if (!result) return null;
    
    return {
      id: result.id,
      title: result.title,
      thumbnail: result.thumbnail,
      pageCount: result.pageCount,
      downloadCount: result.downloadCount,
      id1: result.id1,
      id2: result.id2
    };
  } catch (error) {
    console.error('Error fetching book by id:', error);
    return null;
  }
}
