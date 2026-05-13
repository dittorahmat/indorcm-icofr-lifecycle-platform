ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_objective" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_objective" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_timing" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_timing" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_authority" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_authority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_reliability" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_reliability" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_coverage" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_coverage" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_evidence" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "pilar_evidence" DROP DEFAULT;