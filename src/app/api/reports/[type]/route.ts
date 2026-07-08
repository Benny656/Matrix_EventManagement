import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateReportData } from "@/actions/report.actions";

// Dynamic import for xlsx and papaparse to avoid edge runtime issues
async function generateCSV(data: Record<string, unknown>[]): Promise<string> {
  const Papa = (await import("papaparse")).default;
  return Papa.unparse(data);
}

async function generateExcel(data: Record<string, unknown>[]): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";
    const eventId = searchParams.get("eventId") ?? undefined;
    const sessionId = searchParams.get("sessionId") ?? undefined;

    const validTypes = ["registrations", "attendance", "session-attendance"] as const;
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    const data = await generateReportData(
      type as "registrations" | "attendance" | "session-attendance",
      { eventId, sessionId }
    );

    if (format === "xlsx") {
      const buffer = await generateExcel(data);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${type}-report.xlsx"`,
        },
      });
    }

    // Default: CSV
    const csv = await generateCSV(data);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-report.csv"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
