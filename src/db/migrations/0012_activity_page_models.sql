ALTER TABLE "activity_gallery" ADD COLUMN "model_media_id" text;
--> statement-breakpoint
ALTER TABLE "activity_gallery" ADD CONSTRAINT "activity_gallery_model_media_id_media_id_fk" FOREIGN KEY ("model_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "activity_gallery_model_idx" ON "activity_gallery" USING btree ("model_media_id");
