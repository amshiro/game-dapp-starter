"use client";

import { ExploreStatistics } from "./components/explore-statistics";
import { ExploreTableSection } from "./components/explore-table-section";
import {
  unavailableExplore,
  type ExploreDisplay,
  type ExploreSectionId,
} from "./model/explore-display";
import { exploreCopy as copy } from "./copy";
import styles from "./components/explore.module.css";

export function ExplorePage({
  model = unavailableExplore,
  onPageChange,
}: Readonly<{
  model?: ExploreDisplay;
  onPageChange?: (section: ExploreSectionId, page: number) => void;
}>) {
  return (
    <div className={styles.page}>
      <h1 className="text-page-title font-bold">{copy.title}</h1>
      <ExploreStatistics values={model.statistics} />
      {(["mining", "motherlodes", "buybacks"] as const).map((kind) => (
        <ExploreTableSection
          key={kind}
          kind={kind}
          {...model[kind]}
          onPageChange={
            onPageChange ? (page) => onPageChange(kind, page) : undefined
          }
        />
      ))}
    </div>
  );
}
