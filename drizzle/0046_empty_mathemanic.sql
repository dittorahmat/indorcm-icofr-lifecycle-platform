CREATE TABLE "bpm_process_gl_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"bpm_process_id" text NOT NULL,
	"no_gl" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gl_rows" ADD COLUMN "fsli_balance" double precision;--> statement-breakpoint
ALTER TABLE "bpm_process_gl_codes" ADD CONSTRAINT "bpm_process_gl_codes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_process_gl_codes" ADD CONSTRAINT "bpm_process_gl_codes_bpm_process_id_bpm_processes_id_fk" FOREIGN KEY ("bpm_process_id") REFERENCES "public"."bpm_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bpm_process_gl_codes_process_idx" ON "bpm_process_gl_codes" USING btree ("bpm_process_id");--> statement-breakpoint
CREATE INDEX "bpm_process_gl_codes_no_gl_idx" ON "bpm_process_gl_codes" USING btree ("no_gl");