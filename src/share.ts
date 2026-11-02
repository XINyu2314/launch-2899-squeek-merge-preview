/** Share image: a 1200×630 PNG drawn on a canvas in the browser, signed @xinchne_eth. */
import { SITE } from "./config";

type ShareInput = { title: string; lines: string[]; artSvg: SVGSVGElement | null; footer: string };

/** Wrap against measured canvas width, keeping English words intact when possible. */
function wrapText(g: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const part of text.match(/\S+\s*|\s+/gu) ?? []) {
    if (g.measureText(line + part).width <= width) {
      line += part;
      continue;
    }
    if (line.trim()) lines.push(line.trimEnd());
    line = "";
    // A long token or Chinese sentence still needs character-level wrapping.
    for (const char of part) {
      if (line && g.measureText(line + char).width > width) {
        lines.push(line.trimEnd());
        line = "";
      }
      line += char;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

async function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml.includes("xmlns=") ? xml : xml.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
  await img.decode();
  return img;
}

export async function shareImage(input: ShareInput): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 630;
  const g = c.getContext("2d")!;
  g.fillStyle = "#16130f";
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = "#f2a93b";
  g.fillRect(0, 0, 1200, 8);
  if (input.artSvg) {
    try {
      g.drawImage(await svgToImage(input.artSvg), 72, 96, 300, 300);
    } catch {
      /* the portrait is decorative; the text carries the content */
    }
  }
  const font = '"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif';
  g.fillStyle = "#f4efe6";
  g.font = `600 44px ${font}`;
  g.fillText(input.title, 420, 140);
  g.font = `400 28px ${font}`;
  g.fillStyle = "#d8cfbf";
  const lines = input.lines.flatMap((line) => wrapText(g, line, 708));
  const lineHeight = Math.min(36, 300 / Math.max(1, lines.length - 1));
  let y = 200;
  for (const line of lines) {
    g.fillText(line, 420, y);
    y += lineHeight;
  }
  g.fillStyle = "#f2a93b";
  g.font = `600 28px ${font}`;
  g.fillText(`${SITE.name} · ${SITE.author}`, 72, 560);
  g.fillStyle = "#a99f8e";
  g.font = `400 22px ${font}`;
  g.fillText(input.footer, 72, 598);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}
