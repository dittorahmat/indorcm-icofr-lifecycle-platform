import { describe, it, expect } from "vitest";
import { formatCsaReference } from "@/lib/csa-utils";

describe("formatCsaReference", () => {
  it("generates reference with bpmCode when provided", () => {
    const ref = formatCsaReference({
      bpmCode: "FIN-01",
      year: 2025,
      period: "Q1",
    });
    expect(ref).toBe("CSA-FIN-01-2025-Q1");
  });

  it("sanitizes spaces in bpmCode", () => {
    const ref = formatCsaReference({
      bpmCode: "FIN 02",
      year: "2026",
      period: "Q3",
    });
    expect(ref).toBe("CSA-FIN02-2026-Q3");
  });

  it("falls back to noGL when bpmCode is missing", () => {
    const ref = formatCsaReference({
      bpmCode: null,
      noGL: "110100",
      year: 2025,
      period: "Q2",
    });
    expect(ref).toBe("CSA-GL110100-2025-Q2");
  });

  it("falls back to bpmProcessId when bpmCode and noGL are missing", () => {
    const ref = formatCsaReference({
      bpmCode: "",
      noGL: "",
      bpmProcessId: "proc-998877",
      year: 2025,
      period: "Q4",
    });
    expect(ref).toBe("CSA-PROC-PROC-9-2025-Q4");
  });

  it("extracts year and quarter if period has composite format", () => {
    const ref = formatCsaReference({
      bpmCode: "OPS-01",
      period: "2025-Q1",
    });
    expect(ref).toBe("CSA-OPS-01-2025-Q1");
  });
});
