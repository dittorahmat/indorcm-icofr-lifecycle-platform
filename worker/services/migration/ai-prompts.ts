/**
 * This file contains structured prompt templates for AI-assisted migration.
 */

import { ALL_ASSERTIONS, ALL_IPOS } from '@shared/assertion-fields';

const quoted = (values: readonly string[]) => values.map((value) => `"${value}"`).join(', ');

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

Assertions: ${quoted(ALL_ASSERTIONS)}
IPO: ${quoted(ALL_IPOS)}

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
