import type { Metadata } from "next";
import { QrCodeGenerator } from "@/components/admin/qr-code-generator";

export const metadata: Metadata = { title: "Générateur de QR code | Administration" };

export default function QrCodeAdminPage() { return <QrCodeGenerator/>; }
