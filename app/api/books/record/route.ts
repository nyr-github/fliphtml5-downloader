import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { id1, id2, title, thumbnail, pageCount } = await req.json();
    const id = `${id1}_${id2}`;

    const existing = await db.query.books.findFirst({
      where: eq(books.id, id),
    });

    if (existing) {
      await db.update(books).set({
        downloadCount: sql`${books.downloadCount} + 1`,
        updatedAt: new Date(),
      }).where(eq(books.id, id));
    } else {
      await db.insert(books).values({
        id,
        id1,
        id2,
        title,
        thumbnail,
        pageCount,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording download:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
