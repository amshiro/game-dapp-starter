/** Neutral empty-state content; the Feature decides when a read is successfully empty. */
export function EmptyState({ label }: Readonly<{ label: string }>) {
  return <p role="status">{label}</p>;
}
