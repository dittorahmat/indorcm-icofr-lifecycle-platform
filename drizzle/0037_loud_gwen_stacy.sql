ALTER TABLE "gl_rows" DROP CONSTRAINT "gl_rows_assigned_department_id_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "gl_rows" ADD COLUMN "assigned_department_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "gl_rows" DROP COLUMN "assigned_department_id";