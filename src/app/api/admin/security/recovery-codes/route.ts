import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { recoveryCodes } from "@/db/schema";
import { generateRecoveryCode, recoveryCodeHash, writeSecurityLog } from "@/lib/security";
import { recoveryCodesPdf } from "@/lib/recovery-codes-pdf";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN" || !session.user.id) return Response.json({ message: "Non autorisé." }, { status: 401 });

  const codes = Array.from({ length: 8 }, generateRecoveryCode);
  await db.transaction(async tx => {
    await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, session.user.id));
    await tx.insert(recoveryCodes).values(codes.map(code => ({ id: crypto.randomUUID(), userId: session.user.id, codeHash: recoveryCodeHash(code) })));
  });
  await writeSecurityLog("RECOVERY_CODES_GENERATED", request.headers, { userId: session.user.id, details: "8 nouveaux codes générés" });
  const pdf = recoveryCodesPdf(codes);
  return Response.json({ codes, pdfBase64: pdf.toString("base64"), filename: "codes-recuperation-petits-crayons.pdf" });
}
