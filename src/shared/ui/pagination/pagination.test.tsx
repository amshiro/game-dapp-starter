import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pagination } from "./pagination";
const labels = {
  title: "Records pagination",
  previous: "Previous",
  next: "Next",
  page: "Page",
};
describe("Controlled pagination", () => {
  it.each([0, 1, 20])("hides controls for %i records", (total) => {
    expect(
      renderToStaticMarkup(
        <Pagination
          labels={labels}
          page={{ currentPage: 1, total, pageSize: 20 }}
        />,
      ),
    ).toBe("");
  });
  it("shows controls only above 20 and respects page boundaries", () => {
    for (const currentPage of [1, 2]) {
      const html = renderToStaticMarkup(
        <Pagination
          labels={labels}
          page={{ currentPage, total: 21, pageSize: 20 }}
          onPageChange={() => {}}
        />,
      );
      expect(html.match(/disabled=""/g)).toHaveLength(1);
      expect(html).toContain('aria-current="page"');
    }
  });
  it("disables navigation during a request", () => {
    const html = renderToStaticMarkup(
      <Pagination
        labels={labels}
        page={{ currentPage: 2, total: 60, pageSize: 20 }}
        busy
        onPageChange={() => {}}
      />,
    );
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });
});
