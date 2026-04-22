DROP TABLE "risk_library" CASCADE;--> statement-breakpoint
ALTER TABLE "rcms" ADD COLUMN "is_fraud_related" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "rcms" ADD COLUMN "risk_rating" text;