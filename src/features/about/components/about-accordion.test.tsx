import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AboutAccordion, type AboutAccordionItem } from "./about-accordion";

const items: readonly AboutAccordionItem[] = [
  { id: "one", title: "Fixture one", content: <p>Fixture body one</p> },
  { id: "two", title: "Fixture two", content: <p>Fixture body two</p> },
];

describe("About accordion presentation contract", () => {
  it("starts entirely collapsed and keeps real labelled button/panel relationships", () => {
    const html = renderToStaticMarkup(<AboutAccordion items={items} />);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2);
    expect(html).not.toContain('aria-expanded="true"');
    expect(html.match(/inert=""/g)).toHaveLength(2);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(html).not.toContain(" hidden=");
    expect(html.match(/type="button"/g)).toHaveLength(2);
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(
      (match) => match[1],
    );
    for (const id of controls)
      expect(html).toContain(`id="${id}" role="region"`);
    const labels = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(
      (match) => match[1],
    );
    for (const id of labels) expect(html).toContain(`id="${id}" type="button"`);
    expect(html.match(/<h2/g)).toHaveLength(2);
  });
  it("uses independent IDs for multiple instances", () => {
    const html = renderToStaticMarkup(
      <>
        <AboutAccordion items={items} />
        <AboutAccordion items={items} />
      </>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("renders caller-owned text safely without inventing product copy, links or defaults", () => {
    const html = renderToStaticMarkup(
      <AboutAccordion
        items={[
          {
            id: "escaped",
            title: "<script>fixture</script>",
            content: <p>Fixture content only</p>,
          },
        ]}
      />,
    );
    expect(html).toContain("&lt;script&gt;fixture&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/<a\b/);
    expect(renderToStaticMarkup(<AboutAccordion items={[]} />)).not.toMatch(
      /Intro|Mining|Solana|BURY|%/,
    );
  });
  it("preserves supplied nested content rather than flattening it to a text string", () => {
    const html = renderToStaticMarkup(
      <AboutAccordion
        items={[
          {
            id: "nested",
            title: "Fixture",
            content: (
              <>
                <h3>Fixture subheading</h3>
                <p>
                  Long fixture <em>emphasis</em>
                </p>
              </>
            ),
          },
        ]}
      />,
    );
    expect(html).toContain("<h3>Fixture subheading</h3>");
    expect(html).toContain("<em>emphasis</em>");
  });
  it("preserves long caller-owned content inside an initially inert panel", () => {
    const longText = "UNBROKEN".repeat(100);
    const html = renderToStaticMarkup(
      <AboutAccordion
        items={[
          {
            id: "long",
            title: "Long content",
            content: <p>{longText}</p>,
          },
        ]}
      />,
    );
    expect(html).toContain(longText);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('inert=""');
    expect(html).not.toMatch(/<a\b/);
  });
});
