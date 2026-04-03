import { NextResponse } from "next/server";
import { readSubmissions } from "@/lib/submissions";

export async function GET() {
  try {
    const data = await readSubmissions();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[submissions]", err);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}
