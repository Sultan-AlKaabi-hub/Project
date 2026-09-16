// Generates public/icons/icon.svg and PNG icons (192, 512, 512 maskable) from the Faris pixel map. No dependencies.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "public", "icons");
fs.mkdirSync(OUT, { recursive: true });

const MAP = [ "..RR............", ".RrR............", "..RR....HHH.....", "..s....HHHHH....", "..s...HHHHHHH...", "..s..HHHHHHHHH..", "..s.PPPPPPPPPPP.", "..s.HHHHHHHHHHH.", "..s..FFFFFFFFF..", "..s..FEFFFFEFF..", "..s..FFFnnFFFF..", "..s..WWWWWWWWW..", "..s..WWWWWWWWW..", ".ks.BBWWWWWWWBB.", "..s.BBBBWWWBBBB.", "..s.BBBBBWBBBBB.", "..s.BBBBBBBBBBB.", "..s.BBDBBBBDBBB.", "..s.BBBBBBBBBBB.", "..s..BBBBBBBBB..", "..s..DD.....DD.." ];
const COLORS = { R: "#D93A2E", r: "#FF8A7A", s: "#6B3A2A", H: "#5B5FA6", P: "#7E5CC0", F: "#E8B79A", E: "#2A2730", n: "#D28A6A", W: "#F4F4F6", B: "#4A4E96", D: "#363A78", k: "#E8B79A" };
const BG = "#ECE9E4";
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// SVG
const rects = MAP.flatMap((row, y) => [...row].map((ch, x) => COLORS[ch] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[ch]}"/>` : "")).join("");
fs.writeFileSync(path.join(OUT, "icon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges"><rect width="24" height="24" rx="5" fill="${BG}"/><g transform="translate(4 1.5)">${rects}</g></svg>`);

// PNG encoder
function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(size, pad) {
  const px = Buffer.alloc(size * size * 3);
  const [br, bg, bb] = hex(BG);
  px.fill(0); for (let i = 0; i < size * size; i++) { px[i * 3] = br; px[i * 3 + 1] = bg; px[i * 3 + 2] = bb; }
  const W = MAP[0].length, Hh = MAP.length;
  const cell = Math.floor((size - 2 * pad) / Hh);
  const ox = Math.floor((size - cell * W) / 2), oy = Math.floor((size - cell * Hh) / 2);
  MAP.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!COLORS[ch]) return; const [r, g, b] = hex(COLORS[ch]);
    for (let yy = 0; yy < cell; yy++) for (let xx = 0; xx < cell; xx++) { const i = ((oy + y * cell + yy) * size + (ox + x * cell + xx)) * 3; px[i] = r; px[i + 1] = g; px[i + 2] = b; }
  }));
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 3 + 1)] = 0; px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
fs.writeFileSync(path.join(OUT, "icon-192.png"), png(192, 20));
fs.writeFileSync(path.join(OUT, "icon-512.png"), png(512, 56));
fs.writeFileSync(path.join(OUT, "icon-512-maskable.png"), png(512, 110));
console.log("icons written to", OUT);
