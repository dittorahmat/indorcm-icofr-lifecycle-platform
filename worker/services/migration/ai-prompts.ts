/**
 * This file contains structured prompt templates for AI-assisted migration.
 */

export const NORMALIZATION_PROMPT = `
As an ICOFR compliance expert, normalize the following free-text values into the system's standard Enums.

Standard Enums:
- ControlNature: "Manual", "Automated", "ITDM - IPE", "ITDM - EUC", "MRC"
- ControlType: "Preventive", "Detective"
- ControlFrequency: "Annual", "Semi-Annual", "Quarterly", "Monthly", "Weekly", "Daily", "Ad-hoc"

Input Data:
{{input}}

Output JSON format:
{ "originalValue": "...", "normalizedValue": "...", "confidence": 0.95 }
`;

export const REGULATORY_GUESSING_PROMPT = `
As a GRC Auditor specialized in BUMN SK-5/2024, derive missing metadata based on the Control Description.

Assertions: "Completeness", "Accuracy", "Existence/Occurrence", "Cut-Off", "Rights and Obligation", "Valuation and Allocation", "Presentation and Disclosure"
IPO: "Completeness", "Accuracy", "Validity", "Restricted Access"

Control: {{title}}
Description: {{description}}

Output JSON format:
{ 
  "suggestedAssertions": ["..."], 
  "suggestedIPO": ["..."], 
  "suggestedType": "Preventive/Detective",
  "reasoning": "..."
}
`;
