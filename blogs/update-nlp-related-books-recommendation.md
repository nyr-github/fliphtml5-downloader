---
title: "NLP-Powered Related Books Recommendation"
description: "Added intelligent book recommendation system using NLP entity extraction to help users discover similar content"
date: "2026-04-24"
---

# NLP-Powered Related Books Recommendation

## Introduction

We've enhanced the book discovery experience by integrating Natural Language Processing (NLP) technology. This new feature intelligently analyzes book titles to recommend related content, helping users find books on similar topics effortlessly.

## What's New

- **NLP Entity Extraction**: Integrated the `compromise` library to extract key entities (proper nouns, noun phrases) from book titles using advanced natural language processing
- **Smart Related Books Display**: Automatically shows 4 related books on each book detail page based on semantic similarity of title entities
- **Dedicated Related Books Page**: Created a new paginated view (`/book/[id]/related`) to browse all related books with 24 books per page
- **Intelligent Search Algorithm**: Uses the primary extracted entity to perform database-wide fuzzy matching (ILIKE) for finding topically similar books
- **Graceful Fallback**: When no entities can be extracted, the system defaults to showing popular books by download count
- **Performance Optimized**: All database queries are cached for 1 day (86400 seconds) using Next.js `unstable_cache` for optimal performance
- **Responsive UI**: Related books section features responsive grid layout (2-6 columns) with pagination controls and smooth navigation

## Technical Implementation

### NLP Processing Pipeline
1. Extract proper nouns and noun phrases from book titles
2. Identify the primary entity for search matching
3. Perform case-insensitive database search using ILIKE
4. Rank results by download count for relevance
5. Cache results for 24 hours to optimize performance

### New Files
- `lib/nlp-utils.ts`: NLP entity extraction utilities using compromise library
- `components/RelatedBooks.tsx`: Related books display component with "View All" functionality
- `app/book/[id]/related/page.tsx`: Full pagination view for related books

### Enhanced Files
- `lib/actions.ts`: Added `getRelatedBooks()` and `getAllRelatedBooks()` functions with caching
- `app/book/[id]/page.tsx`: Integrated related books section into book detail page
- `package.json`: Added `compromise` NLP library dependency

## How to Use

1. Navigate to any book detail page
2. Scroll down to see the "Related Books" section below the page thumbnails
3. View up to 4 automatically recommended books based on title similarity
4. Click "View All" to see all related books in a dedicated paginated view
5. Browse through pages using the pagination controls (24 books per page)

## Improvements

- Enhanced content discoverability through AI-powered recommendations
- Reduced database load with intelligent caching strategy
- Better user engagement with contextual book suggestions
- Improved SEO with dynamic metadata on related books pages
- Responsive design works seamlessly across all device sizes
- Clean, intuitive UI with clear visual hierarchy

## Summary

This update transforms how users discover new content by leveraging NLP technology to understand book topics and suggest relevant reads. The intelligent caching ensures fast load times while maintaining fresh recommendations. Thank you for using our platform to explore amazing FlipHTML5 books!
