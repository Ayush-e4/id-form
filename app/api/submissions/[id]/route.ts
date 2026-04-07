import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { jsonNoStore } from "@/lib/http";
import { deleteSubmission, SubmissionNotFoundError } from "@/lib/submissions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isValidAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return jsonNoStore({ error: "Missing ID" }, { status: 400 });
    }

    await deleteSubmission(id);
    return jsonNoStore({ ok: true });
  } catch (err) {
    if (err instanceof SubmissionNotFoundError) {
      return jsonNoStore({ error: "Submission not found" }, { status: 404 });
    }
    console.error("[delete]", err);
    return jsonNoStore({ error: "Delete failed" }, { status: 500 });
  }
}
