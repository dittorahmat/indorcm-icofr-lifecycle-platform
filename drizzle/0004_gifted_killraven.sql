CREATE TABLE "aggregate_deficiencies" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"deficiency_ids" jsonb,
	"affected_accounts" jsonb,
	"affected_assertions" jsonb,
	"combined_magnitude" double precision,
	"aggregate_likelihood" text,
	"final_severity" text NOT NULL,
	"conclusion_rationale" text,
	"created_at" timestamp NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "aggregate_deficiencies" ADD CONSTRAINT "aggregate_deficiencies_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aggregate_deficiencies" ADD CONSTRAINT "aggregate_deficiencies_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;