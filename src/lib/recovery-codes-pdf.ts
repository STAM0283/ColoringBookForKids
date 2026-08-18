function pdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function recoveryCodesPdf(codes: string[]) {
  const commands: string[] = [];
  const text = (value: string, x: number, y: number, size = 11, bold = false, color = "0.10 0.15 0.23") => commands.push(`${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`);
  const fill = (x: number, y: number, width: number, height: number, color: string) => commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
  const stroke = (x: number, y: number, width: number, height: number, color: string) => commands.push(`${color} RG 1 w ${x} ${y} ${width} ${height} re S`);

  fill(0, 722, 595, 120, "0.09 0.25 0.20");
  text("LE PETIT CRAYON", 48, 790, 11, true, "1 1 1");
  text("Codes de récupération", 48, 754, 25, true, "1 1 1");
  text("Accès de secours au back-office", 48, 735, 11, false, "0.82 0.94 0.88");

  text("À conserver dans un endroit sûr", 48, 683, 17, true);
  text("Ces codes permettent de choisir un nouveau mot de passe si vous perdez", 48, 659, 10);
  text("l'accès à votre compte. Aucun e-mail n'est nécessaire.", 48, 643, 10);

  codes.forEach((code, index) => {
    const column = index % 2, row = Math.floor(index / 2);
    const x = 48 + column * 257, y = 575 - row * 67;
    fill(x, y, 238, 48, "0.96 0.98 0.97"); stroke(x, y, 238, 48, "0.78 0.87 0.83");
    text(String(index + 1).padStart(2, "0"), x + 14, y + 18, 9, true, "0.18 0.47 0.37");
    text(code, x + 46, y + 16, 13, true);
  });

  text("Comment les utiliser", 48, 294, 16, true);
  const instructions = [
    "1. Ouvrez la page de connexion du back-office.",
    "2. Cliquez sur « Utiliser un code de récupération ».",
    "3. Saisissez votre e-mail, un code ci-dessus et votre nouveau mot de passe.",
    "4. Connectez-vous avec le nouveau mot de passe.",
  ];
  instructions.forEach((line, index) => text(line, 48, 267 - index * 22, 10));

  fill(48, 144, 499, 56, "1.00 0.96 0.88");
  text("Important", 64, 178, 10, true, "0.60 0.35 0.04");
  text("Chaque code est utilisable une seule fois. Une nouvelle génération annule", 64, 160, 9, false, "0.45 0.29 0.08");
  text("tous les anciens codes. Ne partagez jamais ce document.", 64, 147, 9, false, "0.45 0.29 0.08");
  text(`Document généré le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date())}`, 48, 72, 8, false, "0.45 0.50 0.57");
  text("Le Petit Crayon - Document confidentiel", 362, 72, 8, false, "0.45 0.50 0.57");

  const stream = Buffer.from(commands.join("\n"), "latin1");
  const objects = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "latin1"),
    Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>", "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "latin1"),
    Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, "latin1"), stream, Buffer.from("\nendstream", "latin1")]),
  ];
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary"), parts = [header], offsets = [0];
  let offset = header.length;
  objects.forEach((object, index) => { offsets.push(offset); const wrapped = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`, "latin1"), object, Buffer.from("\nendobj\n", "latin1")]); parts.push(wrapped); offset += wrapped.length; });
  const xrefOffset = offset;
  parts.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(value => `${String(value).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`, "latin1"));
  return Buffer.concat(parts);
}
