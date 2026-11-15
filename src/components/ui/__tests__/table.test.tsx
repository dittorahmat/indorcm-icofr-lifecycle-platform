import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../table"

describe("Table accessibility and keyboard scroll region (#168)", () => {
  it("renders with role='region', tabindex='0', and container query attributes on wrapper", () => {
    const { container } = render(
      <Table aria-label="Sample Compliance Table">
        <TableCaption id="caption-1">Audit List</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Control ID</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>CTL-01</TableCell>
            <TableCell>Journal Authorization</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    const region = screen.getByRole("region", { name: "Sample Compliance Table" })
    expect(region).toBeDefined()
    expect(region.getAttribute("tabindex")).toBe("0")
    expect(region.className).toContain("overflow-x-auto")
    expect(region.className).toContain("@container")
    expect(region.className).toContain("touch-pan-x")
    expect(region.className).toContain("overscroll-x-contain")
    expect(region.className).toContain("focus-visible:ring-ring")

    const table = container.querySelector("table")
    expect(table).toBeDefined()
    // Verify aria-label was assigned to region wrapper and not duplicated onto raw table
    expect(table?.getAttribute("aria-label")).toBeNull()
  })

  it("links aria-labelledby to caption when provided via wrapperProps or captionId without duplicate on table", () => {
    const { container } = render(
      <Table
        aria-labelledby="compliance-caption"
        wrapperProps={{ "data-testid": "table-wrapper" }}
      >
        <TableCaption id="compliance-caption">Compliance Matrix</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Item 1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    const region = screen.getByTestId("table-wrapper")
    expect(region.getAttribute("role")).toBe("region")
    expect(region.getAttribute("aria-labelledby")).toBe("compliance-caption")
    expect(region.getAttribute("tabindex")).toBe("0")

    const table = container.querySelector("table")
    expect(table?.getAttribute("aria-labelledby")).toBeNull()
  })

  it("renders pure table without wrapper when noWrapper is set", () => {
    const { container } = render(
      <Table noWrapper data-testid="raw-table">
        <TableBody>
          <TableRow>
            <TableCell>Raw Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.queryByRole("region")).toBeNull()
    const table = screen.getByTestId("raw-table")
    expect(table.tagName.toLowerCase()).toBe("table")
    expect(container.firstChild).toBe(table)
  })

  it("supports sticky column headers (thead) with solid opaque surface and top-0 positioning (#170)", () => {
    const { container } = render(
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Header 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data 1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    const thead = container.querySelector("thead")
    expect(thead).toBeDefined()
    expect(thead?.className).toContain("sticky")
    expect(thead?.className).toContain("top-0")
    expect(thead?.className).toContain("z-10")
    expect(thead?.className).toContain("bg-slate-50")
  })

  it("supports sticky left column freeze on TableHead and TableCell with proper z-indices (#169, #170)", () => {
    render(
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead stickyLeft data-testid="sticky-th">
              Primary ID
            </TableHead>
            <TableHead>Other Info</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell stickyLeft data-testid="sticky-td">
              CTL-001
            </TableCell>
            <TableCell>Description Text</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    const stickyTh = screen.getByTestId("sticky-th")
    expect(stickyTh.className).toContain("sticky")
    expect(stickyTh.className).toContain("left-0")
    expect(stickyTh.className).toContain("z-20") // Intersection cell requires higher z-index than sticky thead (z-10)
    expect(stickyTh.className).toContain("bg-slate-50")

    const stickyTd = screen.getByTestId("sticky-td")
    expect(stickyTd.className).toContain("sticky")
    expect(stickyTd.className).toContain("left-0")
    expect(stickyTd.className).toContain("z-[2]") // Body sticky column above regular cells
    expect(stickyTd.className).toContain("bg-white")
  })
})
