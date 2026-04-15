CREATE TABLE "bpm_diagrams" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"sub_process" text,
	"nodes" jsonb,
	"edges" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "bpm_node_rcms" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"diagram_id" text NOT NULL,
	"node_id" text NOT NULL,
	"rcm_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rcm_controls" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"rcm_id" text NOT NULL,
	"control_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rcms" ADD COLUMN "diagram_id" text;--> statement-breakpoint
ALTER TABLE "bpm_diagrams" ADD CONSTRAINT "bpm_diagrams_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_diagrams" ADD CONSTRAINT "bpm_diagrams_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_node_rcms" ADD CONSTRAINT "bpm_node_rcms_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_node_rcms" ADD CONSTRAINT "bpm_node_rcms_diagram_id_bpm_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."bpm_diagrams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_node_rcms" ADD CONSTRAINT "bpm_node_rcms_rcm_id_rcms_id_fk" FOREIGN KEY ("rcm_id") REFERENCES "public"."rcms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD CONSTRAINT "rcm_controls_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD CONSTRAINT "rcm_controls_rcm_id_rcms_id_fk" FOREIGN KEY ("rcm_id") REFERENCES "public"."rcms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD CONSTRAINT "rcm_controls_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcms" ADD CONSTRAINT "rcms_diagram_id_bpm_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."bpm_diagrams"("id") ON DELETE no action ON UPDATE no action;