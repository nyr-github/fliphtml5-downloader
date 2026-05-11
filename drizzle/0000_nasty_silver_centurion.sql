CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"id1" text NOT NULL,
	"id2" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tags" varchar[] DEFAULT '{}',
	"thumbnail" text NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"download_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
