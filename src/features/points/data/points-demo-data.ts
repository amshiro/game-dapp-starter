export type PointsDisplay = Readonly<{
  total: string;
  records: readonly Readonly<{
    id: string;
    time: string;
    stake: string;
    value: string;
    earned: string;
  }>[];
}>;

// Static demo data mirrors the approved Figma state; no production Points contract is currently available.
// Figma’s SOL placeholder is replaced by the confirmed BNB label; values remain demo-only, not wallet balances.
export const pointsDemoData: PointsDisplay = {
  total: "32,308.56",
  records: Array.from({ length: 6 }, (_, index) => ({
    id: `figma-record-${index + 1}`,
    time: "Oct 22, 2:35",
    stake: "2.3456 BNB",
    value: "$388.26",
    earned: "388.26",
  })),
};
