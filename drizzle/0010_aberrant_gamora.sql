CREATE TABLE "csa_samples" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"csa_record_id" text NOT NULL,
	"sample_ref" text,
	"attr_a" boolean DEFAULT false,
	"attr_b" boolean DEFAULT false,
	"attr_c" boolean DEFAULT false,
	"attr_d" boolean DEFAULT false,
	"itac_expected_result" text,
	"itac_actual_result" text,
	"itac_match" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "csa_samples" ADD CONSTRAINT "csa_samples_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_samples" ADD CONSTRAINT "csa_samples_csa_record_id_csa_records_id_fk" FOREIGN KEY ("csa_record_id") REFERENCES "public"."csa_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_records" DROP COLUMN "trans_reference";--> statement-breakpoint
ALTER TABLE "csa_records" DROP COLUMN "itac_expected_result";--> statement-breakpoint
ALTER TABLE "csa_records" DROP COLUMN "itac_actual_result";