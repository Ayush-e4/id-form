import { NextRequest, NextResponse } from "next/server";
import { deleteSubmission } from "@/lib/submissions";

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await deleteSubmission(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delete]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
