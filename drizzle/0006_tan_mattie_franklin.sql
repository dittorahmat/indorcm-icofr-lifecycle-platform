CREATE TABLE "system_licenses" (
	"id" text PRIMARY KEY NOT NULL,
	"license_key" text NOT NULL,
	"machine_code" text NOT NULL,
	"activated_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_heartbeat" timestamp NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_departments" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "document_fslis" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "document_gls" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "document_departments" DROP CONSTRAINT "document_departments_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "document_fslis" DROP CONSTRAINT "document_fslis_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "document_gls" DROP CONSTRAINT "document_gls_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "document_departments" ADD CONSTRAINT "document_departments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_fslis" ADD CONSTRAINT "document_fslis_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_gls" ADD CONSTRAINT "document_gls_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;