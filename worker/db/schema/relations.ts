import { relations } from "drizzle-orm";
import { user, member, organization, businessEntities } from "./auth";
import { glSnapshots, glRows, simulations, simulationAccountApplications } from "./gl-scoping";
import { applications } from "./applications";
import { bpmProcesses, bpmDiagrams, rcms, controls, rcmControls } from "./rcm-bpm";
import { csaRecords, csaSamples, csaSchedules, testRecords, testSamples, todEvaluations } from "./csa-testing";
import { vendors, socReports, socEvaluations, userPreferences } from "./knowledge-soc";

export const userRelations = relations(user, ({ many }) => ({
	members: many(member),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	glSnapshots: many(glSnapshots),
	businessEntities: many(businessEntities),
}));

export const businessEntityRelations = relations(businessEntities, ({ one, many }) => ({
	organization: one(organization, { fields: [businessEntities.organizationId], references: [organization.id] }),
	parent: one(businessEntities, { fields: [businessEntities.parentId], references: [businessEntities.id], relationName: "subEntities" }),
	children: many(businessEntities, { relationName: "subEntities" }),
	glRows: many(glRows),
}));

export const glSnapshotRelations = relations(glSnapshots, ({ many }) => ({
	rows: many(glRows),
}));

export const glRowRelations = relations(glRows, ({ one }) => ({
	snapshot: one(glSnapshots, { fields: [glRows.snapshotId], references: [glSnapshots.id] }),
	businessEntity: one(businessEntities, { fields: [glRows.entityId], references: [businessEntities.id] }),
}));

export const bpmProcessRelations = relations(bpmProcesses, ({ many }) => ({
	schedules: many(csaSchedules),
}));

export const csaScheduleRelations = relations(csaSchedules, ({ one }) => ({
	bpmProcess: one(bpmProcesses, { fields: [csaSchedules.bpmProcessId], references: [bpmProcesses.id] }),
	assignee: one(user, { fields: [csaSchedules.assignedTo], references: [user.id] }),
}));

export const simulationAccountApplicationsRelations = relations(simulationAccountApplications, ({ one }) => ({
	simulation: one(simulations, { fields: [simulationAccountApplications.simulationId], references: [simulations.id] }),
	application: one(applications, { fields: [simulationAccountApplications.applicationId], references: [applications.id] }),
}));

export const csaRecordRelations = relations(csaRecords, ({ many, one }) => ({
	samples: many(csaSamples),
	control: one(controls, { fields: [csaRecords.controlId], references: [controls.id] }),
	assessedByUser: one(user, { fields: [csaRecords.assessedBy], references: [user.id] }),
}));

export const csaSampleRelations = relations(csaSamples, ({ one }) => ({
	csaRecord: one(csaRecords, { fields: [csaSamples.csaRecordId], references: [csaRecords.id] }),
}));

export const vendorRelations = relations(vendors, ({ many }) => ({
	reports: many(socReports),
}));

export const socReportRelations = relations(socReports, ({ one, many }) => ({
	vendor: one(vendors, { fields: [socReports.vendorId], references: [vendors.id] }),
	evaluations: many(socEvaluations),
}));

export const socEvaluationRelations = relations(socEvaluations, ({ one }) => ({
	report: one(socReports, { fields: [socEvaluations.socReportId], references: [socReports.id] }),
	evaluator: one(user, { fields: [socEvaluations.evaluatedBy], references: [user.id] }),
}));

export const testRecordRelations = relations(testRecords, ({ many, one }) => ({
	samples: many(testSamples),
	control: one(controls, { fields: [testRecords.controlId], references: [controls.id] }),
	testedByUser: one(user, { fields: [testRecords.testedBy], references: [user.id] }),
}));

export const testSampleRelations = relations(testSamples, ({ one }) => ({
	testRecord: one(testRecords, { fields: [testSamples.testRecordId], references: [testRecords.id] }),
}));

export const todEvaluationRelations = relations(todEvaluations, ({ one }) => ({
	csaRecord: one(csaRecords, { fields: [todEvaluations.csaId], references: [csaRecords.id] }),
	control: one(controls, { fields: [todEvaluations.controlId], references: [controls.id] }),
	evaluator: one(user, { fields: [todEvaluations.evaluatorId], references: [user.id] }),
}));

export const rcmRelations = relations(rcms, ({ many }) => ({
	mappings: many(rcmControls),
}));

export const rcmControlRelations = relations(rcmControls, ({ one }) => ({
	rcm: one(rcms, { fields: [rcmControls.rcmId], references: [rcms.id] }),
	control: one(controls, { fields: [rcmControls.controlId], references: [controls.id] }),
}));

export const controlRelations = relations(controls, ({ many }) => ({
	rcmMappings: many(rcmControls),
	todEvaluations: many(todEvaluations),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
	user: one(user, { fields: [userPreferences.userId], references: [user.id] }),
}));
