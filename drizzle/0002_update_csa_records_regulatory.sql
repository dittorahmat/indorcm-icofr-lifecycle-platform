ALTER TABLE "csa_records" ADD COLUMN "trans_reference" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "attr_a" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "attr_b" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "attr_c" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "attr_d" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "gps_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "timestamp_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "captured_at" timestamp;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "hash" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "biometric_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "itac_scenario" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "itac_method" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "itac_sample_info" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "itac_expected_result" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "itac_actual_result" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "line2_status" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "line2_comments" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "line2_validated_by" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "line2_validated_date" timestamp;--> statement-breakpoint
ALTER TABLE "csa_records" ADD CONSTRAINT "csa_records_line2_validated_by_user_id_fk" FOREIGN KEY ("line2_validated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;