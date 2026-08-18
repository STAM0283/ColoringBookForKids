import { ImageResponse } from "next/og";
export const alt = "Le Petit Crayon - Livres et activités créatives pour enfants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, color: "#172033", background: "linear-gradient(135deg,#f9f5ed 0%,#dcecdf 58%,#f6dfce 100%)" }}><div style={{ display: "flex", color: "#28765f", fontSize: 28, fontWeight: 800, letterSpacing: 5 }}>LE PETIT CRAYON</div><div style={{ display: "flex", maxWidth: 930, marginTop: 28, fontSize: 72, lineHeight: 1.05, fontWeight: 900 }}>Colorier, jouer et apprendre en s’amusant</div><div style={{ display: "flex", marginTop: 32, fontSize: 30, color: "#526071" }}>Livres créatifs et activités gratuites pour enfants</div></div>, size); }
