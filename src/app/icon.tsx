import { ImageResponse } from "next/og";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";
export default function Icon() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 110, background: "#173f34", color: "#fff", fontSize: 150, fontWeight: 900, letterSpacing: -8 }}>LPC</div>, size); }
