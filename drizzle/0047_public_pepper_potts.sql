CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"layout" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_assertions" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "change_category" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "gl_snapshots" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;