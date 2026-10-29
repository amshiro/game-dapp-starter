import { EmptyState } from "../../shared/ui/empty-state/empty-state";
import { SectionLoading } from "../../shared/ui/section-loading/section-loading";
import {
  Pagination,
  type PaginationState,
} from "../../shared/ui/pagination/pagination";
import type { Locale } from "../../shared/i18n/locale";
import type { PointsDisplay } from "./model/points-display";
import en from "./locales/en.json";
import zh from "./locales/zh-CN.json";
import styles from "./components/points.module.css";

export function PointsPage({
  locale,
  model = { total: "—", records: [] },
  status = model.records.length ? "populated" : "unavailable",
  pagination,
  onPageChange,
}: Readonly<{
  locale: Locale;
  model?: PointsDisplay;
  status?: "loading" | "empty" | "error" | "unavailable" | "populated";
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
}>) {
  const copy = locale === "zh-CN" ? zh : en;
  return (
    <div className={styles.page}>
      <h1 className="text-page-title font-bold">{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>
      <section className={styles.balance} aria-label={copy.myPoints}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ori/points/points.svg" width={40} height={40} alt="" />
        <dl>
          <dt>{copy.myPoints}</dt>
          <dd>{model.total}</dd>
        </dl>
      </section>
      <section
        className={styles.records}
        aria-labelledby="points-records-title"
      >
        <h2 id="points-records-title">{copy.records}</h2>
        <p>{copy.rule}</p>
        <table
          className={styles.table}
          aria-busy={status === "loading" || undefined}
        >
          <caption className="sr-only">{copy.records}</caption>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{copy.time}</th>
              <th scope="col">{copy.stake}</th>
              <th scope="col">{copy.value}</th>
              <th scope="col">{copy.earned}</th>
            </tr>
          </thead>
          <tbody>
            {(status === "populated" ? model.records : []).map((record) => (
              <tr key={record.id}>
                <td>{record.time}</td>
                <td>{record.stake}</td>
                <td>{record.value}</td>
                <td>{record.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {status !== "populated" && (
          <div className={styles.readState}>
            {status === "loading" ? (
              <SectionLoading label={copy.loading} />
            ) : status === "empty" ? (
              <EmptyState label={copy.empty} />
            ) : (
              <p role={status === "error" ? "alert" : "status"}>
                {copy[status]}
              </p>
            )}
          </div>
        )}
        <Pagination
          page={pagination}
          busy={status === "loading" || status === "error"}
          onPageChange={onPageChange}
          labels={{
            title: `${copy.records} ${copy.pagination}`,
            previous: copy.previous,
            next: copy.next,
            page: copy.page,
          }}
        />
      </section>
    </div>
  );
}
