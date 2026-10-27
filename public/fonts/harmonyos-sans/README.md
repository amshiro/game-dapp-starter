# HarmonyOS Sans SC asset

The user supplied `HarmonyOS_Sans_SC.ttf` as an official font asset. No font was downloaded. The supplied TrueType font was converted locally to WOFF2 without subsetting or instancing. It is a Starter-wide asset, independent of ORI.

Metadata read directly from the supplied OpenType tables:

- Family: HarmonyOS Sans SC / 鸿蒙黑体; subfamily: Regular; version 2.040; PostScript name: HarmonyOS_Sans_SC.
- TrueType variable outlines (`glyf`, `gvar`, `fvar`); one `wght` axis, minimum 40, default 400, maximum 900. Normal style; no italic axis is exposed.
- Named instances: Thin 100, UltraLight 173, Light 247, Regular 400, Medium 500, SemiBold 603, Bold 706, Heavy 772, Black 844.
- 29,824 glyphs. Unicode cmap contains all 20,992 basic CJK unified codepoints U+4E00–U+9FFF, plus the Latin/digit/SC UI samples checked by `src/styles/font-metadata.test.ts`. This is not a claim of coverage for every Unicode character.
- Original TTF: 20,617,156 bytes (kept outside the repository; never committed). SHA-256: `8978e05044e7089ad6a9de38c505c8148305607983487435a916d2610700a7ca`.

`src/styles/fonts.css` is the sole font registration and fallback-stack owner. It registers one normal variable face over 40–900 with `font-display: swap`; `app/globals.css` loads it and applies `--font-family-sans`. The root layout preloads the same URL with anonymous CORS; it does not register another face. No remote CDN, font library, runtime conversion or per-feature registration is used.

CSS 400/500/700 are supported variable coordinates, independently of the named-instance labels. In particular, CSS 700 is a real interpolated coordinate, not the named Bold instance at 706 and not synthetic bold. Current Figma numeric weights remain the mapping authority for the project.

## Web delivery and verification

Runtime and preload both use only `HarmonyOS_Sans_SC.woff2` (`font/woff2`). Size: **12,431,000 bytes**, 60.29% of the original, a **39.71% reduction**. SHA-256: `40e3744ead7af2cb7ae3d737963745d4016a1d390b44dd68c6d0e67152aa1482`.

Converted with isolated local FontTools 4.60.2 / Brotli 1.2.1, not project/runtime dependencies. Equivalent conversion, using the externally retained source:

```python
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import WOFF2FlavorData

font = TTFont(source_path, lazy=True, recalcTimestamp=False, recalcBBoxes=False)
font.flavor = "woff2"
font.flavorData = WOFF2FlavorData(transformedTables={"glyf", "loca"})
font.save(output_path, reorderTables=False)
```

Validation decoded every output table and compared all 29,824 glyphs against the source: coordinates, contour endpoints/flags, bounds, composite transforms and hint instructions are equal. All 29,508 best-cmap mappings and glyph order are unchanged. Coverage, variation (`fvar`, `gvar`), horizontal/vertical metrics, naming and layout tables are byte-identical. WOFF2 reversibly transforms `glyf`/`loca`, updates the container checksum and lossless-transform flag, and removes the original empty DSIG (zero signatures). These container differences do not alter glyph metrics or the continuous 40–900 axis. No glyph or weight was removed, including 800/900.

The Node asset tests decode the WOFF2 Brotli stream and check source-table hashes, family, full axis and SC/Latin mappings without a runtime font library. They do not claim to reconstruct transformed glyphs; the exhaustive source comparison above is the conversion validation. Local request measurements do not prove slow-network first-load performance; the complete CJK font remains 12.43 MB.

## License evidence

The user supplied `LICENSE-update.txt`; preserve this file unchanged alongside the font. It contains the Huawei HarmonyOS Sans license/usage notice and is the local licensing evidence (SHA-256 `7d7acf8e3ac928ae7f34aaa9f8e348dd0476dbb52caaa058e402894d4f6efe73`). HarmonyOS Sans is used as this Starter's default UI font. Retain its copyright and license notice with redistribution; consult the supplied agreement for its conditions. This README does not grant rights or replace that agreement.

The font name table itself has copyright but no full license URL/text; OS/2 `fsType=8` alone is not a license. Q-05 retains review of applicable Web/Starter template release conditions, including format conversion and redistribution; receipt of the license is confirmed, final release interpretation is not silently closed.
