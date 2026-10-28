import type { Locale } from "../../shared/i18n/locale";
import { pointsDemoData, type PointsDisplay } from "./data/points-demo-data";
import en from "./locales/en.json";
import zh from "./locales/zh-CN.json";
import styles from "./components/points.module.css";

export function PointsPage({
  locale,
  model = pointsDemoData,
}: Readonly<{ locale: Locale; model?: PointsDisplay }>) {
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
        <span className={styles.demo}>{copy.demo}</span>
      </section>
      <section
        className={styles.records}
        aria-labelledby="points-records-title"
      >
        <h2 id="points-records-title">{copy.records}</h2>
        <p>{copy.rule}</p>
        <table className={styles.table}>
          <caption className="sr-only">
            {copy.records} — {copy.demo}
          </caption>
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
            {model.records.map((record) => (
              <tr key={record.id}>
                <td>{record.time}</td>
                <td>{record.stake}</td>
                <td>{record.value}</td>
                <td>{record.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
