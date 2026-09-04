ALTER TABLE "books" ADD COLUMN "activity_type_id" text;
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_activity_type_id_activity_types_id_fk" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_types"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "books_activity_type_idx" ON "books" USING btree ("activity_type_id");
