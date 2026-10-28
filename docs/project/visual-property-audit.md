# About / Points / Wallet — Property-Level Parity Audit

## Source and scope

Current Figma ORI-AI测试, file `M6P7gqrEDANm28YSfvOm93`. Re-read complete design contexts/screenshots and read-only Plugin API geometry, fills, strokes, dash pattern, opacity, effects, font metadata and direct/descendant nodes for About `2003:2235` / `2003:2359`, Points `2003:2101`, Wallet `2003:2487`. No Figma edits. This audit preserves the pre-existing uncommitted About/Points delivery; no transaction, polling, realtime, commit, push or deploy.

The Figma top 44px status bar and 34px simulated home-indicator area are device mockups, not application elements. Browser geometry uses real safe-area env values (0 in this test browser). Approved copy changes determine natural text heights; no fixed height truncates restored content. H5 remains 100%, main max500 centered; current approved Modal policy is H5 bottom / PC400 centered, full-page backdrop. These explicit user decisions override corresponding canvas examples.

## About: node mapping and corrections

| Nodes | Figma property | Implementation / computed evidence | Result |
| --- | --- | --- | --- |
| 2243 / 2421 title | HarmonyOS Sans SC, 28/700, AUTO, white, letterSpacing0 | Global font; 28px/700/normal; rgb(255,255,255); rendered height33 | PASS |
| 2244 / 2422 subtitle | 14/400, AUTO, #868789; 8px after title | 14px/400/normal; rgb(134,135,137); y121 at375, height16 | PASS |
| 2245/2254/2263/2272/2281 and 2423/2432/2441/2450/2459 rows | 347×60 at375; independent rectangle fill #0D0F13, no stroke/radius/effects | Explicit button background rgb(13,15,19); height60; content width347, left14; radius0, opacity1, shadow/filter/backdrop none | PASS; independent row fill restored |
| 2247 and corresponding row titles | 20/700, AUTO, white | 20px/700/normal, white; vertically centered, min-height60 permits longer approved translations | PASS |
| 2248 and corresponding dividers | Centered 1px vector, dash4/gap4, #25262A | Dedicated ::before, height1px, repeating gradient rgb(37,38,42) 0–4 / transparent4–8; top -0.5px represents centered stroke | PASS; divider is separate from row fill |
| 2249 and other chevrons | Exact16×16; collapsed right / expanded up | Existing exact local SVG; rendered16×16, x333 at375; expanded matrix(0,-1,1,0,0,0), equivalent -90deg | PASS |
| 2290 Intro lead | 14/500, line22; ORI accent #EFC462, remaining text secondary | Explicit lead 14px/500/22px; rgb(134,135,137); ORI span rgb(239,196,98) | PASS; lead weight/line and brand accent restored |
| 2291 / 2368–2369 body | 14/400, line20, #868789 | Computed14px/400/20px, rgb(134,135,137); natural height for restored copy | PASS |
| 2292 / 2370 / 2372 / 2373 subheadings | 18/500, AUTO, white | Computed18px/500/normal, white; 8px heading-to-paragraph; 24px normal section gaps | PASS |
| Expanded body → next row | 32px trailing spacing | Inner panel body padding-bottom32; grid animation wrapper collapses to0 | PASS |
| Last row / page bottom | Same row properties; content must clear nav | Same explicit fill/type/icon; at long-page end last row bottom736, nav top760 on375×812 | PASS |
| Links content | No expanded Links design in these two frames | Current user-approved recovered links; existing accent/underline/focus styling retained, not claimed as Figma link evidence | APPROVED CONTENT EXCEPTION |

Figma's Solana/BURY placeholder copy and its purple Solana span do not return to the page. Current restored copy and longer section labels remain the explicitly approved exception; no matching Solana text exists to apply its styling to. Browser reports zero letter spacing as `normal` for these elements even with explicit `letter-spacing:0`; rendered zero tracking is preserved.

### Accordion motion and accessibility

**Human-approved interaction override, accepted by human review and not a blocker:** 240ms natural-height grid transition and arrow rotation, 180ms opacity. This is not claimed as Figma motion metadata. Panels remain mounted for both directions; collapsed `inert` and `aria-hidden=true` take effect immediately, visibility hides after the closing transition. Only one expanded ID exists; no timeout, fixed max-height, global store or duplicate state. `prefers-reduced-motion:reduce` disables transitions. Browser verified expanded height290 → collapsed0, final opacity1/0, visibility visible/hidden; Links collapse + Tab moves directly to Mine nav, never hidden links. Enter/Space and switch-item behavior remain intact. The browser tooling does not expose reduced-motion emulation; OS reduced-motion behavior was not separately toggled.

## Points: node mapping and corrections

| Nodes | Figma property | Implementation / computed evidence | Result |
| --- | --- | --- | --- |
| 2111/2112 title/subtitle | 28/700 and14/400, AUTO; white/secondary | Same global font, normal line-height; y80 / y121 excluding status bar | PASS |
| 2114 My Points surface | 347×88 at x14/y205; bg#0D0F13, inside2px#25262A, radius8, opacity1, effects[] | Browser x14/y161,347×88; bg rgb(13,15,19),2px solid rgb(37,38,42),8px; opacity1; blur/filter/shadow none | PASS; independent background restored |
| 2117 icon | Exact40×40, x30/y229 | Exact local points.svg loaded,40×40, x30/y185 | PASS |
| 2116 label / 2115 value | 12/400 and24/500, AUTO; #868789 / white | Correct computed fonts/colors; label y181, value y201; gap6; global typography only | PASS |
| 2122/2121 Records and caption | 20/500 and12/400 AUTO; gap8; 24px after card | Correct normal line-height and colors; section y273; no invented business calculation | PASS |
| 2159–2170 header and helper backplates | 38px high, own #0D0F13 fills,12/500 #868789; column starts14/124/224/303 | Semantic table/head/row/cells each retain explicit background; header38; proportional columns based110/100/79/58 content widths | PASS |
| 2166 divider | Centered1px, dash4/gap4, #191B1F | Separate thead::after, height1, bottom0.5px; repeating gradient rgb(25,27,31)4/4 | PASS; wrong #25262A and browser-default dash corrected |
| 2123–2158 six record rows | 38px each; own bg#0D0F13;12/400 AUTO; white | Six38px rows, explicit tbody/tr/td backgrounds, right-aligned final value; table266px high | PASS |
| Row background extent | Figma backplates width361, content width347 | Explicit row paint plus14px right bleed; content stays inside14px main inset, no viewport overflow | PASS |
| All effects / opacity | No shadows, filter, backdrop blur; opacity1 | Computed none/none/none and1 on audited surfaces | PASS |
| SOL placeholder / demo marker | Current user overrides original sample | BNB text replaces SOL; no token icon exists in the Figma table and none is invented. Static demo badge/data owner remain approved additional UI | APPROVED PRODUCT EXCEPTION |

All example values remain centralized in points-demo-data.ts. No API, transaction, wallet query or inferred timestamp/year was introduced.

## Wallet: node mapping and corrections

| Nodes | Figma property | Implementation / computed evidence | Result |
| --- | --- | --- | --- |
| 2489 backdrop | Black paint alpha0.65, full viewport | dialog background rgba(0,0,0,0.65),375×812 /500×900 | PASS |
| 2491 modal surface | bg#191B1F, top radius16, no stroke/effects | rgb(25,27,31),16px16px0 0 at375; PC400 wide, four16px corners per user override | PASS |
| 2493 header surface | Independent bg#191B1F,48px height, full surface width | Explicit background rgb(25,27,31);375×48 at375,400×48 onPC; own surface retained | PASS; missing header fill restored |
| 2494 title / 2498–2503 close |16/500 AUTO white;24×24 close at right16 | Computed16px/500/normal/white; exact default close SVG24×24, x335 at375 | PASS |
| 2505 asset card | bg#191B1F, inside1px#303135, radius12; exported CSS backdrop blur6px | Explicit rgb(25,27,31);1px solid rgb(48,49,53);12px; backdrop-filter blur(6px);343×123 at375 | PASS; background and blur restored |
| 2506 balance surface | bg#25262A, inside1px#303135 on all sides; top radius12;83px height; exported CSS blur25.95px | rgb(37,38,42);1px solid rgb(48,49,53);12px12px0 0;83px;blur(25.95px); same x16 / width343 as outer card | PASS; blur/full border/geometry corrected |
| 2531 label |12/400, line15, white paint alpha0.35 | Computed12px/400/15px, rgba(255,255,255,0.35); node opacity remains1 | PASS |
| 2530 amount |24/700 AUTO white, ss02 enabled | Computed24px/700/normal, white, font-feature-settings "ss02"; unavailable — ORE retained | PASS; missing OpenType feature restored |
| 2517 address |13/400 AUTO #868789 | Same font/color; shortened current identity remains SDK-owned | PASS |
| 2518/2512/2507 icons |16px wallet /14px copy /20px disconnect | Exact local assets loaded;16×16 /14×14 /20×20 | PASS |
| Card geometry / address alignment | Outer343×123, upper343×83; address area40px | Overlapping inside strokes share card bounds; negative1px margins account for CSS border box; total remains123px, proper icon alignment | PASS |
| Modal spacing / safe-area |8px top,48px header,8px gap,40px plus actual bottom safe-area | Computed8px16px40px panel padding at env0; height227 vs canvas261 including simulated34px home area | PASS; responsive/device adaptation |

Figma Plugin API reports BACKGROUND_BLUR radii12 and51.9; the fresh design_context export explicitly supplies CSS blur6 and25.95 respectively. CSS values are taken from that export, not guessed. -webkit-backdrop-filter is supplied as the compatible counterpart; no effect was dropped.

Current external-wallet model intentionally has no Export/Receive buttons per the user's higher-priority confirmed decision. No embedded wallet or sample balance was introduced. Wallet computed/keyboard evidence used a temporary controlled visual fixture and a clearly synthetic test identity, not a live SDK session; the fixture route is removed before final QA. Wallet identity/auth/query logic is unchanged.

## Validation

Final command results and responsive browser checks are appended after QA. No raw address, provider, token or secret is logged in this report. Motion and fixture evidence are not presented as real-wallet behavior verification.

Final validation: env:check PASS; typecheck PASS; lint PASS; format:check PASS; test PASS (38 files /442 tests); build PASS; git diff --check PASS. Existing vinext/RSC sourcemap warnings remain; no new build failure. Temporary app/parity-check is absent before build.

Browser PASS:375px and500px, HarmonyOS Sans SC, About collapsed/expanded and all five items, Enter/Space, single expanded ID, hidden Links skipped by Tab, long-page24px bottom clearance; Points full card/four-column/six-row layout,38px header/rows, no fake pagination, correct active nav; Wallet375px bottom surface and500px viewport/400px centered panel, complete backdrop, both blur layers, close/reopen/ESC, focus return and scroll unlock. No horizontal overflow. No console warning/error observed. Reduced-motion media rule is implemented but OS emulation was NOT RUN because the available browser capabilities expose only viewport and visibility.

## 后续人工资产修正

用户确认 Wallet 余额应为 BSC native BNB，Figma 的 ORE 标注错误。runtime 用 Wagmi useBalance / eth_getBalance，18 decimals；97为测试网原生币（Registry symbol仍tBNB），UI按确认标BNB，不修改 chain registry。此项是明确产品覆盖，原先 — ORE / 未确认余额 owner 的审计说明仅为当时状态。surface / blur / border / spacing 均保持本次 parity 修复。

BNB correction verification: Development97 real eth_getBalance against a public synthetic test account returned4925025853580438326 wei; the same runtime Wallet query displayed4.925025 BNB and retained4.925025853580438326 as exact text.375/500 browser checks and reopen passed; prior card surfaces/blur remain intact. Account/chain/disconnect/loading/error/zero/tiny/large-value guards have deterministic tests; this is not a new live-wallet account-switch acceptance claim. Temporary wallet-balance-check route removed. Full seven QA commands PASS,39 test files /450 tests. Production56 has not gained new runtime verification; no commit/push/deploy.

## Checkpoint review

About、Points、Wallet property-level parity 已通过人工审核。Accordion 240ms expand/collapse、180ms fade、arrow transition 已明确签收；其与 Figma 静态稿的差异不是 blocker，不移除。BNB 为人工修正后的余额资产，Surface / blur 等独立属性继续保留。
