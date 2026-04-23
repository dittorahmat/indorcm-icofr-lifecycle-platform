CREATE TABLE "account_assertions" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"fsli_name" text NOT NULL,
	"no_gl" text NOT NULL,
	"assertion_e" text,
	"assertion_c" text,
	"assertion_a" text,
	"assertion_co" text,
	"assertion_ro" text,
	"assertion_va" text,
	"assertion_pd" text,
	"updated_at" timestamp,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "account_assertions" ADD CONSTRAINT "account_assertions_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_assertions" ADD CONSTRAINT "account_assertions_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;