CREATE TABLE "risk_library" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"cluster" text NOT NULL,
	"risk_description" text NOT NULL,
	"suggested_assertions" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "risk_library" ADD CONSTRAINT "risk_library_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;