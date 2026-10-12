CREATE TABLE "icofr"."ai_cache_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"cache_key" text NOT NULL,
	"layer" text NOT NULL,
	"payload" jsonb NOT NULL,
	"kb_version" text DEFAULT '' NOT NULL,
	"simulation_id" text DEFAULT '' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "icofr"."ai_cache_entries" ADD CONSTRAINT "ai_cache_entries_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "icofr"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_cache_org_key_idx" ON "icofr"."ai_cache_entries" USING btree ("organization_id","cache_key");--> statement-breakpoint
CREATE INDEX "ai_cache_expiry_idx" ON "icofr"."ai_cache_entries" USING btree ("expires_at");