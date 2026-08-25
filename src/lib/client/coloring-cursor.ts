function svgCursor(svg:string,hotspotX:number,hotspotY:number) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspotX} ${hotspotY}, pointer`;
}

export function coloringToolCursor(eraser:boolean,color:string) {
  if(eraser) {
    return svgCursor(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><g transform="rotate(-42 18 18)"><rect x="10" y="3" width="16" height="27" rx="5" fill="#fb7185" stroke="#fff" stroke-width="2"/><path d="M10 20h16v5a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5z" fill="#f8fafc"/><path d="M10 20h16" stroke="#0f172a" stroke-opacity=".25" stroke-width="1.5"/></g></svg>`,7,29);
  }

  const safeColor=/^#[0-9A-F]{6}$/i.test(color)?color:"#22C55E";
  return svgCursor(`<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38"><g transform="rotate(-42 19 19)"><rect x="15" y="2" width="9" height="22" rx="4" fill="${safeColor}" stroke="#fff" stroke-width="2"/><path d="M14 21h11l2 7c.8 3-1.4 6-4.6 6h-5.8c-3.2 0-5.4-3-4.6-6z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/><path d="M15 25h9" stroke="#94a3b8" stroke-width="1.5"/></g></svg>`,8,31);
}
