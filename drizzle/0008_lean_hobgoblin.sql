ALTER TABLE "controls" ADD COLUMN "level" text DEFAULT 'TLC';--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "related_control_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "attachment_url" text;