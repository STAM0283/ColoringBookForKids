const allowedTags=new Set(["svg","g","path","rect","circle","ellipse","polygon","polyline","line"]);
const allowedAttributes=new Set(["viewBox","xmlns","width","height","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","d","points","transform","fill","fill-rule","stroke","stroke-width","stroke-linecap","stroke-linejoin","opacity"]);
const shapes=new Set(["path","rect","circle","ellipse","polygon"]);

export function sanitizeColoringSvg(source:string){
 if(Buffer.byteLength(source,"utf8")>500_000)throw new Error("Le SVG dépasse 500 Ko.");
 if(!/<svg\b/i.test(source))throw new Error("Le fichier ne contient pas de dessin SVG.");
 if(/<(script|foreignObject|image|use|iframe|object|embed|style|text)\b|\bon[a-z]+\s*=|\b(?:href|xlink:href)\s*=|url\s*\(|javascript:|data:/i.test(source))throw new Error("Le SVG contient un élément non autorisé.");
 let zone=0;
 const cleaned=source.replace(/<\?xml[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>|<!--[\s\S]*?-->/gi,"").replace(/<\/?([a-zA-Z][\w:-]*)([^>]*)>/g,(whole,rawTag:string,rawAttributes:string)=>{
  const closing=whole.startsWith("</"),tag=rawTag.toLowerCase();
  if(!allowedTags.has(tag))return "";
  if(closing)return `</${tag}>`;
  const attributes:string[]=[];
  for(const match of rawAttributes.matchAll(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*')/g)){
   const name=match[1],value=match[2];if(!allowedAttributes.has(name)||/[<>]|url\s*\(|javascript:|data:/i.test(value))continue;attributes.push(`${name}=${value}`);
  }
  if(tag==="svg"){if(!attributes.some(value=>value.startsWith("viewBox=")))throw new Error("Le SVG doit posséder un viewBox.");attributes.push('role="img"','aria-label="Coloriage interactif"');}
  const colorable=shapes.has(tag)&&!attributes.some(value=>/^fill=["']none/i.test(value))&&(tag!=="path"||attributes.some(value=>/^d=["'][\s\S]*[zZ]\s*["']$/.test(value)));
  if(colorable){zone++;attributes.push(`data-color-zone="${zone}"`);if(!attributes.some(value=>value.startsWith("fill=")))attributes.push('fill="#FFFFFF"');}
  return `<${tag}${attributes.length?` ${attributes.join(" ")}`:""}${whole.endsWith("/>")?"/>":">"}`;
 });
 if(zone<2)throw new Error("Le dessin doit contenir au moins deux zones fermées à colorier.");
 if(zone>250)throw new Error("Le dessin contient trop de zones (250 maximum).");
 return {svg:cleaned.trim(),zoneCount:zone};
}
