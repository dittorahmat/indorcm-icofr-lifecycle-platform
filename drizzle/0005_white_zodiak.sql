CREATE TABLE "document_departments" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"document_id" text NOT NULL,
	"department_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_fslis" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"document_id" text NOT NULL,
	"fsli_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_gls" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"document_id" text NOT NULL,
	"gl_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"content" text,
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "document_departments" ADD CONSTRAINT "document_departments_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_departments" ADD CONSTRAINT "document_departments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_departments" ADD CONSTRAINT "document_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_fslis" ADD CONSTRAINT "document_fslis_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_fslis" ADD CONSTRAINT "document_fslis_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_gls" ADD CONSTRAINT "document_gls_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_gls" ADD CONSTRAINT "document_gls_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;