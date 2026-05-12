CREATE TABLE "document_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"document_id" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"fts_tokens" "tsvector",
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_samples" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"test_record_id" text NOT NULL,
	"sample_ref" text,
	"attr_a" boolean DEFAULT false,
	"attr_b" boolean DEFAULT false,
	"attr_c" boolean DEFAULT false,
	"attr_d" boolean DEFAULT false,
	"status" text DEFAULT 'Pass' NOT NULL,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE "tod_evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"csa_id" text NOT NULL,
	"control_id" text NOT NULL,
	"evaluator_id" text,
	"pilar_objective" boolean DEFAULT false,
	"pilar_timing" boolean DEFAULT false,
	"pilar_authority" boolean DEFAULT false,
	"pilar_reliability" boolean DEFAULT false,
	"pilar_coverage" boolean DEFAULT false,
	"pilar_evidence" boolean DEFAULT false,
	"kk_reference" text,
	"conclusion" text,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "test_records" ADD COLUMN "tod_pilar_objective" boolean;--> statement-breakpoint
ALTER TABLE "test_records" ADD COLUMN "tod_pilar_timing" boolean;--> statement-breakpoint
ALTER TABLE "test_records" ADD COLUMN "tod_pilar_authority" boolean;--> statement-breakpoint
ALTER TABLE "test_records" ADD COLUMN "tod_pilar_reliability" boolean;--> statement-breakpoint
ALTER TABLE "test_records" ADD COLUMN "tod_pilar_coverage" boolean;--> statement-breakpoint
ALTER TABLE "test_records" ADD COLUMN "tod_pilar_evidence" boolean;--> statement-breakpoint
ALTER TABLE "test_records" ADD COLUMN "tod_pilar_comments" jsonb;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_samples" ADD CONSTRAINT "test_samples_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_samples" ADD CONSTRAINT "test_samples_test_record_id_test_records_id_fk" FOREIGN KEY ("test_record_id") REFERENCES "public"."test_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ADD CONSTRAINT "tod_evaluations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ADD CONSTRAINT "tod_evaluations_csa_id_csa_records_id_fk" FOREIGN KEY ("csa_id") REFERENCES "public"."csa_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ADD CONSTRAINT "tod_evaluations_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ADD CONSTRAINT "tod_evaluations_evaluator_id_user_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunk_embedding_idx" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "chunk_fts_idx" ON "document_chunks" USING gin ("fts_tokens");