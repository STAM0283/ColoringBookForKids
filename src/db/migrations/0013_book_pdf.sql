ALTER TABLE "books" ADD COLUMN "pdf_media_id" text;
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_pdf_media_id_media_id_fk" FOREIGN KEY ("pdf_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
