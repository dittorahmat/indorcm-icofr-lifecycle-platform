import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const ICOFR_TOOLS: FunctionDeclaration[] = [
  {
    name: "get_rcm_mapping",
    description: "Retrieves Risk Control Matrix (RCM) mappings, including risks and their associated controls.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        subProcess: {
          type: SchemaType.STRING,
          description: "Optional sub-process name to filter by (e.g., 'Payroll', 'Procure to Pay')."
        },
        riskRating: {
          type: SchemaType.STRING,
          description: "Filter by risk rating (Low, Medium, High).",
          enum: ["Low", "Medium", "High"],
          format: "enum"
        },
        isFraudRelated: {
          type: SchemaType.BOOLEAN,
          description: "Filter for fraud-related risks."
        }
      }
    }
  },
  {
    name: "analyze_bpm_flow",
    description: "Analyzes the business process flow (BPM) for a specific process, describing the sequence of nodes and risks.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        processId: {
          type: SchemaType.STRING,
          description: "The ID of the BPM process to analyze."
        }
      },
      required: ["processId"]
    }
  },
  {
    name: "get_csa_tasks",
    description: "Retrieves the current user's CSA (Control Self-Assessment) tasks, including overdue and upcoming schedules.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: "Filter by status (Not Started, In Progress, Completed).",
          enum: ["Not Started", "In Progress", "Completed"],
          format: "enum"
        },
        timeframe: {
          type: SchemaType.STRING,
          description: "Timeframe to look for tasks (e.g., 'next month', '3 months')."
        }
      }
    }
  },
  {
    name: "get_test_history",
    description: "Retrieves the testing history (TOD/TOE) for a specific control.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        controlId: {
          type: SchemaType.STRING,
          description: "The ID or Code of the control."
        },
        testType: {
          type: SchemaType.STRING,
          description: "Type of test (TOD or TOE).",
          enum: ["TOD", "TOE"],
          format: "enum"
        }
      },
      required: ["controlId"]
    }
  },
  {
    name: "get_remediation_deadlines",
    description: "Retrieves action plans and remediation activities that are approaching their deadlines.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        timeframe: {
          type: SchemaType.STRING,
          description: "Filter deadlines within this timeframe (e.g., 'next month')."
        }
      }
    }
  },
  {
    name: "get_bpm_node_details",
    description: "Retrieves detailed metadata for a specific node in a BPM diagram.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        nodeId: {
          type: SchemaType.STRING,
          description: "The ID of the node within the BPM diagram."
        },
        processId: {
          type: SchemaType.STRING,
          description: "The ID of the BPM process/diagram."
        }
      },
      required: ["nodeId", "processId"]
    }
  },
  {
    name: "get_csa_missing_evidence",
    description: "Identifies CSA samples that are missing required evidence/documentation.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        csaRecordId: {
          type: SchemaType.STRING,
          description: "The ID of the CSA record."
        }
      },
      required: ["csaRecordId"]
    }
  },
  {
    name: "get_action_plan_details",
    description: "Retrieves full details of a specific remediation action plan.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        planId: {
          type: SchemaType.STRING,
          description: "The ID of the action plan."
        }
      },
      required: ["planId"]
    }
  },
  {
    name: "get_icofr_executive_summary",
    description: "Generates a high-level executive summary. Use this to answer questions about overall ICOFR health, materiality thresholds, deficiency counts, and to identify significant accounts that are missing controls.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "check_year_end_readiness",
    description: "Analyzes if all significant financial accounts have been covered by effective control testing.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "calculate_deficiency_magnitude",
    description: "Automatically evaluates the quantitative severity of a deficiency by comparing its exposure to the Performance Materiality (PM).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        deficiencyId: {
          type: SchemaType.STRING,
          description: "The ID of the deficiency to evaluate."
        }
      },
      required: ["deficiencyId"]
    }
  },
  {
    name: "get_wbs_fraud_indicators",
    description: "Retrieves whistleblowing reports and fraud indicators relevant to ICOFR risk assessment.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        departmentId: {
          type: SchemaType.STRING,
          description: "Optional department ID to filter indicators."
        }
      }
    }
  },
  {
    name: "draft_audit_narrative",
    description: "Assists in drafting professional audit rationales for Ineffective controls or other findings.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        contextId: {
          type: SchemaType.STRING,
          description: "The ID of the control, test, or deficiency."
        },
        type: {
          type: SchemaType.STRING,
          description: "The type of narrative (e.g., 'ineffective_rationale', 'homogeneity_justification').",
          enum: ["ineffective_rationale", "homogeneity_justification"],
          format: "enum"
        }
      },
      required: ["contextId", "type"]
    }
  },
  {
    name: "search_bpm_processes",
    description: "Searches for BPM processes by name to find their unique IDs. Use this when a user refers to a process by name but you need the processId for other actions.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "The name or keyword of the process to search for (e.g., 'Payroll', 'Setoran Tunai')."
        }
      },
      required: ["query"]
    }
  },
  {
    name: "create_csa_schedule",
    description: "Schedules a new CSA or testing activity. (Requires user confirmation).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        processId: { type: SchemaType.STRING, description: "ID of the sub-process." },
        type: { type: SchemaType.STRING, enum: ["CSA", "TOD", "TOE"], format: "enum" },
        plannedDate: { type: SchemaType.STRING, description: "Target date (ISO format)." },
        assignedTo: { type: SchemaType.STRING, description: "User ID to assign the task." }
      },
      required: ["processId", "type", "plannedDate"]
    }
  }
];
