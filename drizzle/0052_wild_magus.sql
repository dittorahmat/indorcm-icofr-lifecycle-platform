CREATE INDEX "controls_org_year_idx" ON "icofr"."controls" USING btree ("organization_id","year");--> statement-breakpoint
CREATE INDEX "csa_records_org_control_idx" ON "icofr"."csa_records" USING btree ("organization_id","control_id");--> statement-breakpoint
CREATE INDEX "deficiencies_org_control_idx" ON "icofr"."deficiencies" USING btree ("organization_id","control_id");--> statement-breakpoint
CREATE INDEX "deficiencies_org_period_idx" ON "icofr"."deficiencies" USING btree ("organization_id","period");--> statement-breakpoint
CREATE INDEX "test_records_org_control_idx" ON "icofr"."test_records" USING btree ("organization_id","control_id");--> statement-breakpoint
CREATE INDEX "test_records_org_period_idx" ON "icofr"."test_records" USING btree ("organization_id","period");