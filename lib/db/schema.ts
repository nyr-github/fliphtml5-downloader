import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  id: text("id").primaryKey(), // Using id1_id2 as unique identifier
  id1: text("id1").notNull(),
  id2: text("id2").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail").notNull(),
  pageCount: integer("page_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
