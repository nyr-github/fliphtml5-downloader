import React from 'react';
import { getBookById } from '@/lib/actions';
import { notFound } from 'next/navigation';
import BookReaderClient from '@/components/BookReaderClient';

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  return (
    <div className="bg-black min-h-screen">
      <BookReaderClient 
        dbId={id}
        id1={book.id1} 
        id2={book.id2} 
        title={book.title} 
      />
    </div>
  );
}
