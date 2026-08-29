CREATE TABLE "activity_gallery" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"media_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_gallery" ADD CONSTRAINT "activity_gallery_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_gallery" ADD CONSTRAINT "activity_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "activity_gallery_activity_sort_idx" ON "activity_gallery" USING btree ("activity_id","sort_order");
