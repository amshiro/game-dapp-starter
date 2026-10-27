import { readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

// Asset contract checks, not CSS snapshots. Replacing the supplied font requires
// rechecking coverage/axes and the documented Figma mapping.
const container = readFileSync(
  new URL(
    "../../public/fonts/harmonyos-sans/HarmonyOS_Sans_SC.woff2",
    import.meta.url,
  ),
);
// Read WOFF2's directory and Brotli stream using Node built-ins. Only
// untransformed OpenType tables are interpreted here; glyph reconstruction was
// verified separately against every source glyph with FontTools (asset README).
const tags =
  "cmap head hhea hmtx maxp name OS/2 post cvt_ fpgm glyf loca prep CFF_ VORG EBDT EBLC gasp hdmx kern LTSH PCLT VDMX vhea vmtx BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL SVG_ sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty just lcar mort morx opbd prop trak Zapf Silf Glat Gloc Feat Sill"
    .split(" ")
    .map((tag) => tag.replace("_", " "));
let cursor = 48;
function base128() {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = container[cursor++];
    if (byte === undefined || value > 0x1ffffff || (i === 0 && byte === 0x80))
      throw new Error("Invalid WOFF2 Base128 length");
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) return value;
  }
  throw new Error("Unterminated WOFF2 length");
}
const records: { tag: string; length: number; transformed: boolean }[] = [];
for (let i = 0; i < container.readUInt16BE(12); i++) {
  const flags = container[cursor++];
  const index = flags & 63;
  const tag =
    index === 63
      ? container.toString("ascii", cursor, (cursor += 4))
      : tags[index];
  if (!tag) throw new Error("Unexpected WOFF2 table tag");
  const originalLength = base128();
  const version = flags >> 6;
  const transformed = ["glyf", "loca"].includes(tag)
    ? version !== 3
    : version !== 0;
  records.push({
    tag,
    length: transformed ? base128() : originalLength,
    transformed,
  });
}
const font = brotliDecompressSync(
  container.subarray(cursor, cursor + container.readUInt32BE(20)),
);
const tables = new Map<string, number>();
const lengths = new Map<string, number>();
let offset = 0;
for (const record of records) {
  if (!record.transformed) {
    tables.set(record.tag, offset);
    lengths.set(record.tag, record.length);
  }
  offset += record.length;
}
if (offset !== font.length) throw new Error("Invalid WOFF2 stream length");
function table(name: string) {
  const offset = tables.get(name);
  if (offset === undefined) throw new Error(`Missing font table ${name}`);
  return offset;
}
function names() {
  const offset = table("name");
  const storage = offset + font.readUInt16BE(offset + 4);
  const result = new Map<number, string[]>();
  for (let i = 0; i < font.readUInt16BE(offset + 2); i++) {
    const record = offset + 6 + i * 12;
    if (font.readUInt16BE(record) !== 3) continue;
    const id = font.readUInt16BE(record + 6);
    const start = storage + font.readUInt16BE(record + 10);
    const bytes = Buffer.from(
      font.subarray(start, start + font.readUInt16BE(record + 8)),
    );
    const value = bytes.swap16().toString("utf16le");
    result.set(id, [...(result.get(id) ?? []), value]);
  }
  return result;
}

describe("Starter HarmonyOS Sans SC asset", () => {
  it("retains every source coverage, metrics and variation table byte-for-byte", () => {
    const sourceHashes = {
      GDEF: "77833a1bb57aaaf35f674160f3f47902af0bfaaa35cb0e3c88c083b18c62eed3",
      GPOS: "eadd57f922d2e63833c31865abc54db3ed2004a20dbf356081f2cdb132da9009",
      GSUB: "a1cc91a63c153ada48c531f665d2349fdcec0c79b8b23a4cf47d79dd2a99b97d",
      "OS/2":
        "d0782fb7530f6b564320e3296a2b45435506cef982339d704b61e373b1cf3664",
      STAT: "f5297a4bcba181a7bf27d301ead46272b767f340f60c17c6b7088732dfa856a8",
      cmap: "5223345ada4001b206fe0720871e2c93fde07d22da0bc93c9f2b87aa34a72244",
      fvar: "584812f5c060ffb246dce70da457ec737f21287dd23b15b6bf0ba85c7b3b7d2a",
      gvar: "99a6dc6808f96f9e6e72eb6eebcbffdb7b188be0c12b0e4f42cfe58f097700c2",
      hhea: "7bda749fa7307637bb80589675f5954414ca251a25f0b7711d6fe0acf5b4b79d",
      hmtx: "c71fd4f6c78ade972dd563d0bfba9b967f72958a88114fe6dca928708ff2310b",
      maxp: "d6a129400d5577069da08067c05654a4a20da0690f115407ae0e4b3c6288c91e",
      name: "a6d91c5e2e2efe2d1ff933a5d47e06238a1e50a56afdf9d66d4608e4c47cfff1",
      post: "c5ef35fc6623e14b12eb204878949dbf76ab659ddb7124f43debbb9a64b63f77",
      prep: "fb77114241d5b31d0cd90f624b84ebb22114d559d233c54f0f81be58acde421d",
      vhea: "2fed38584e4d22acc7e553abe8db97384ca4cbf2d4799ed4927249e435a3c16e",
      vmtx: "694f8083c414e23b8dd1cac5f2e7ed2a2dbc8270e23a503ba1cf3debd0e9fc2f",
    };
    for (const [tag, hash] of Object.entries(sourceHashes)) {
      const start = table(tag);
      expect(
        createHash("sha256")
          .update(font.subarray(start, start + lengths.get(tag)!))
          .digest("hex"),
      ).toBe(hash);
    }
    expect(font.readUInt16BE(table("maxp") + 4)).toBe(29824);
  });

  it("is the expected normal TrueType family, with real variation outlines", () => {
    expect(container.toString("ascii", 0, 4)).toBe("wOF2");
    expect(container.readUInt32BE(4)).toBe(0x00010000);
    expect(container.readUInt32BE(8)).toBe(container.length);
    expect(names().get(1)).toContain("HarmonyOS Sans SC");
    expect(names().get(2)).toContain("Regular");
    expect(tables.has("gvar")).toBe(true);
    expect(font.readInt32BE(table("post") + 4)).toBe(0);
  });
  it("preserves the complete 40–900 axis, including future 800/900 values", () => {
    const fvar = table("fvar");
    expect(font.readUInt16BE(fvar + 8)).toBe(1);
    const axis = fvar + font.readUInt16BE(fvar + 4);
    expect(font.toString("ascii", axis, axis + 4)).toBe("wght");
    const minimum = font.readInt32BE(axis + 4) / 65536;
    const defaultWeight = font.readInt32BE(axis + 8) / 65536;
    const maximum = font.readInt32BE(axis + 12) / 65536;
    expect([minimum, defaultWeight, maximum]).toEqual([40, 400, 900]);
    for (const weight of [40, 100, 400, 500, 700, 800, 900]) {
      expect(weight).toBeGreaterThanOrEqual(minimum);
      expect(weight).toBeLessThanOrEqual(maximum);
    }
    const instanceStart =
      axis + font.readUInt16BE(fvar + 8) * font.readUInt16BE(fvar + 10);
    const instances = new Map<string, number>();
    for (let i = 0; i < font.readUInt16BE(fvar + 12); i++) {
      const record = instanceStart + i * font.readUInt16BE(fvar + 14);
      const label = names().get(font.readUInt16BE(record))?.[0];
      if (label) instances.set(label, font.readInt32BE(record + 4) / 65536);
    }
    expect(instances.get("Regular")).toBe(400);
    expect(instances.get("Medium")).toBe(500);
    expect(instances.get("Bold")).toBe(706);
  });
  it("contains nonempty Unicode mappings for Latin and representative SC UI characters", () => {
    const cmap = table("cmap");
    const unicodeMaps: number[] = [];
    for (let i = 0; i < font.readUInt16BE(cmap + 2); i++) {
      const record = cmap + 4 + i * 8;
      const platform = font.readUInt16BE(record);
      const encoding = font.readUInt16BE(record + 2);
      if (platform === 0 || (platform === 3 && [1, 10].includes(encoding)))
        unicodeMaps.push(cmap + font.readUInt32BE(record + 4));
    }
    const hasGlyph = (code: number) =>
      unicodeMaps.some((offset) => {
        if (font.readUInt16BE(offset) === 12) {
          for (let i = 0; i < font.readUInt32BE(offset + 12); i++) {
            const group = offset + 16 + i * 12;
            const first = font.readUInt32BE(group),
              last = font.readUInt32BE(group + 4);
            if (first <= code && code <= last)
              return font.readUInt32BE(group + 8) + code - first !== 0;
          }
        }
        if (font.readUInt16BE(offset) === 4 && code <= 0xffff) {
          const count = font.readUInt16BE(offset + 6) / 2;
          const ends = offset + 14,
            starts = ends + count * 2 + 2,
            deltas = starts + count * 2,
            ranges = deltas + count * 2;
          for (let i = 0; i < count; i++) {
            const first = font.readUInt16BE(starts + i * 2),
              last = font.readUInt16BE(ends + i * 2);
            if (first > code || code > last) continue;
            const range = font.readUInt16BE(ranges + i * 2),
              delta = font.readUInt16BE(deltas + i * 2);
            if (!range) return ((code + delta) & 0xffff) !== 0;
            return (
              font.readUInt16BE(ranges + i * 2 + range + (code - first) * 2) !==
              0
            );
          }
        }
        return false;
      });
    for (const char of "Aa09中文简体汉字钱包质押积分导出起源矿")
      expect(hasGlyph(char.codePointAt(0)!)).toBe(true);
  });
});
