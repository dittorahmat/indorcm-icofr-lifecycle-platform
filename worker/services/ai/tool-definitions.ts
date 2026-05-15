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
  }
];
