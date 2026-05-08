CREATE TABLE "bpm_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"diagram_id" text NOT NULL,
	"filename" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_details" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"no_gl" text NOT NULL,
	"bpm_process_id" text,
	"ref_no" text,
	"trans_date" timestamp,
	"description" text,
	"currency" text,
	"dc_flag" text,
	"amount" double precision
);
--> statement-breakpoint
CREATE TABLE "transaction_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"no_gl" text NOT NULL,
	"filename" text,
	"row_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "csa_samples" DROP CONSTRAINT "csa_samples_gl_row_id_gl_rows_id_fk";
--> statement-breakpoint
ALTER TABLE "csa_samples" ALTER COLUMN "csa_record_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "csa_schedules" ALTER COLUMN "bpm_process_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bpm_processes" ADD COLUMN "standard_test_procedure" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "schedule_id" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "is_draft" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "test_procedure" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "archive_location" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" text DEFAULT 'info';--> statement-breakpoint
ALTER TABLE "bpm_exports" ADD CONSTRAINT "bpm_exports_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_exports" ADD CONSTRAINT "bpm_exports_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_exports" ADD CONSTRAINT "bpm_exports_diagram_id_bpm_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."bpm_diagrams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_uploads" ADD CONSTRAINT "transaction_uploads_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_uploads" ADD CONSTRAINT "transaction_uploads_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trans_no_gl_idx" ON "transaction_details" USING btree ("no_gl");--> statement-breakpoint
CREATE INDEX "trans_bpm_process_idx" ON "transaction_details" USING btree ("bpm_process_id");--> statement-breakpoint
ALTER TABLE "csa_records" ADD CONSTRAINT "csa_records_schedule_id_csa_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."csa_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bpm_processes_org_code_idx" ON "bpm_processes" USING btree ("organization_id","bpm_code");--> statement-breakpoint
CREATE INDEX "bpm_processes_no_gl_idx" ON "bpm_processes" USING btree ("no_gl");