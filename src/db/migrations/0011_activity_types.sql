CREATE TABLE "activity_types" (
	"id" text PRIMARY KEY NOT NULL,
	"language" text DEFAULT 'FR' NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#0F8A68' NOT NULL,
	"badge" text DEFAULT '🎨' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "activity_type_id" text;
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_activity_type_id_activity_types_id_fk" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_types"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "activity_types_language_slug_idx" ON "activity_types" USING btree ("language","slug");
--> statement-breakpoint
CREATE INDEX "activity_types_language_sort_idx" ON "activity_types" USING btree ("language","sort_order");
--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "activities" USING btree ("activity_type_id");
