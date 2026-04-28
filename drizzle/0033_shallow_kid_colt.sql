CREATE TABLE "soc_evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"soc_report_id" text NOT NULL,
	"attr_a" boolean DEFAULT false,
	"attr_b" boolean DEFAULT false,
	"attr_c" boolean DEFAULT false,
	"attr_d" boolean DEFAULT false,
	"attr_e" boolean DEFAULT false,
	"attr_f" boolean DEFAULT false,
	"attr_g" boolean DEFAULT false,
	"auditor_opinion" text,
	"evaluated_by" text,
	"evaluated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soc_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"report_type" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"file_url" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"service_type" text,
	"contact_person" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "soc_evaluations" ADD CONSTRAINT "soc_evaluations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soc_evaluations" ADD CONSTRAINT "soc_evaluations_soc_report_id_soc_reports_id_fk" FOREIGN KEY ("soc_report_id") REFERENCES "public"."soc_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soc_evaluations" ADD CONSTRAINT "soc_evaluations_evaluated_by_user_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soc_reports" ADD CONSTRAINT "soc_reports_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soc_reports" ADD CONSTRAINT "soc_reports_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;