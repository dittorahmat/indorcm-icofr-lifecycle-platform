ALTER TABLE "controls" RENAME COLUMN "business_process_lvl1" TO "business_process";--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "sampling_methodology" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "document_list" text;