ALTER TABLE "books" ADD COLUMN "access_level" text DEFAULT 'PUBLIC' NOT NULL;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "access_book_id" text REFERENCES "books"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "club_codes" ADD COLUMN "book_id" text REFERENCES "books"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_access_level_check" CHECK ("access_level" IN ('PUBLIC', 'CLUB', 'BUYER'));
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_access_level_check" CHECK ("access_level" IN ('PUBLIC', 'CLUB', 'BUYER'));
--> statement-breakpoint
CREATE INDEX "activities_access_book_idx" ON "activities" ("access_book_id");
