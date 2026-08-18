import { RecoveryForm } from "@/components/recovery-form";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Récupération du compte", robots: { index: false, follow: false, noarchive: true } };
export default function RecoveryPage() { return <RecoveryForm/>; }
