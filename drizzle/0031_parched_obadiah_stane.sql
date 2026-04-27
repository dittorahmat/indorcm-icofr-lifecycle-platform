CREATE TABLE "simulation_account_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"simulation_id" text NOT NULL,
	"account_code" text NOT NULL,
	"application_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "is_significant" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "simulation_account_applications" ADD CONSTRAINT "simulation_account_applications_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_account_applications" ADD CONSTRAINT "simulation_account_applications_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_account_applications" ADD CONSTRAINT "simulation_account_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;