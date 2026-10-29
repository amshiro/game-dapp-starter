import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExplorePage } from "./explore-page";
import { ExploreTableSection } from "./components/explore-table-section";
import { ExplorePagination } from "./components/explore-pagination";
import {
  adjacentPage,
  unavailableExplore,
  type ExploreDisplay,
} from "./model/explore-display";

describe("Explore read presentation", () => {
  it("ships only unavailable slots, three unavailable table bodies without pagination", () => {
    const html = renderToStaticMarkup(<ExplorePage />);
    expect(html.match(/<table /g)).toHaveLength(3);
    expect(html.match(/<tbody><\/tbody>/g)).toHaveLength(3);
    expect(html.match(/Data unavailable/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).not.toContain("<nav");
    expect(html.match(/<dd /g)).toHaveLength(4);
    expect(html).not.toMatch(
      /28,000,000|827,239|2,896|16,327|35,683|24,520,466|0xAB|SOL|oriGame|originGame/,
    );
    expect(html).not.toContain('aria-current="page"');
  });
  it.each(["loading", "empty", "error", "unavailable"] as const)(
    "represents %s without fabricating rows",
    (status) => {
      const html = renderToStaticMarkup(
        <ExploreTableSection kind="mining" data={{ status }} />,
      );
      expect(html).toContain("<tbody></tbody>");
      const text = {
        loading: "Loading…",
        empty: "No data",
        error: "Could not load data",
        unavailable: "Data unavailable",
      }[status];
      expect(html).toContain(text);
      expect(html).toContain(
        status === "error" ? 'role="alert"' : 'role="status"',
      );
      if (status === "loading") expect(html).toContain('aria-busy="true"');
    },
  );
  it("renders only caller-owned precision-safe text and keeps section pagination independent", () => {
    const model: ExploreDisplay = {
      ...unavailableExplore,
      mining: {
        data: {
          status: "populated",
          value: [
            {
              id: "fixture-row",
              cells: [
                "900719925474099312345",
                "TEST",
                "<unsafe>",
                "TEST",
                "TEST",
              ],
            },
          ],
        },
        pagination: {
          currentPage: 3,
          total: 21,
          hasPrevious: true,
          hasNext: false,
        },
      },
    };
    const html = renderToStaticMarkup(
      <ExplorePage model={model} onPageChange={() => {}} />,
    );
    expect(html).toContain("900719925474099312345");
    expect(html).toContain("&lt;unsafe&gt;");
    expect(html).not.toContain("<unsafe>");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/disabled=""/g)).toHaveLength(1);
    expect(html).toContain('scope="col"');
    expect(html).toContain('type="button"');
  });
  it("treats a known empty populated result as empty, not unavailable", () => {
    const html = renderToStaticMarkup(
      <ExploreTableSection
        kind="buybacks"
        data={{ status: "populated", value: [] }}
      />,
    );
    expect(html).toContain("No data");
    expect(html).not.toContain("Data unavailable");
  });
});

describe("Explore controlled pagination", () => {
  it("cannot invent a current/next page without valid metadata", () => {
    for (const currentPage of [
      0,
      -1,
      1.2,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      const page = { currentPage, hasPrevious: true, hasNext: true };
      expect(adjacentPage(page, "next")).toBeUndefined();
      expect(adjacentPage(page, "previous")).toBeUndefined();
      expect(
        renderToStaticMarkup(<ExplorePagination title="TEST" page={page} />),
      ).not.toContain('aria-current="page"');
    }
    expect(adjacentPage(undefined, "next")).toBeUndefined();
  });
  it("honors both boundaries without total-page guesses", () => {
    expect(
      adjacentPage(
        { currentPage: 1, hasPrevious: true, hasNext: false },
        "previous",
      ),
    ).toBeUndefined();
    expect(
      adjacentPage(
        { currentPage: 1, hasPrevious: false, hasNext: false },
        "next",
      ),
    ).toBeUndefined();
    expect(
      adjacentPage(
        { currentPage: 2, hasPrevious: true, hasNext: true },
        "previous",
      ),
    ).toBe(1);
    expect(
      adjacentPage(
        { currentPage: 2, hasPrevious: true, hasNext: true },
        "next",
      ),
    ).toBe(3);
    expect(
      adjacentPage(
        {
          currentPage: Number.MAX_SAFE_INTEGER,
          hasPrevious: true,
          hasNext: true,
        },
        "next",
      ),
    ).toBeUndefined();
  });
  it("disables navigation while loading or without an owner callback", () => {
    for (const props of [{ busy: true, onPageChange: () => {} }, {}]) {
      const html = renderToStaticMarkup(
        <ExplorePagination
          title="TEST"
          page={{ currentPage: 2, total: 60, hasPrevious: true, hasNext: true }}
          {...props}
        />,
      );
      expect(html.match(/disabled=""/g)).toHaveLength(2);
    }
  });
});
