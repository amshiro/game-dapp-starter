import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./modal";

const base = {
  open: true,
  onOpenChange: vi.fn(),
  title: "TEST title",
} as const;
describe("Shared Modal design-system contract", () => {
  it("provides a native labelled modal, default header and canonical close asset", () => {
    const html = renderToStaticMarkup(
      <Modal {...base}>
        <p>TEST content</p>
      </Modal>,
    );
    const id = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain("/ui/modal/close.svg");
    expect(html).toContain("<p>TEST content</p>");
    expect(html).not.toMatch(/Wallet|ORE|Export|\/ori\//);
  });
  it("renders no dialog or children when the controlled state is closed", () => {
    expect(
      renderToStaticMarkup(
        <Modal {...base} open={false}>
          TEST body
        </Modal>,
      ),
    ).toBe("");
  });
  it("has bottom/center responsive defaults and supports independent overrides", () => {
    const html = renderToStaticMarkup(<Modal {...base}>TEST</Modal>);
    expect(html).toContain('data-mobile-placement="bottom"');
    expect(html).toContain('data-desktop-placement="center"');
    const custom = renderToStaticMarkup(
      <Modal {...base} mobilePlacement="center" desktopPlacement="bottom">
        TEST
      </Modal>,
    );
    expect(custom).toContain('data-mobile-placement="center"');
    expect(custom).toContain('data-desktop-placement="bottom"');
  });
  it("allows a headerless dialog only with its own accessible name", () => {
    const html = renderToStaticMarkup(
      <Modal
        open
        onOpenChange={vi.fn()}
        header="none"
        ariaLabel="TEST custom panel"
      >
        <button type="button">TEST content action</button>
      </Modal>,
    );
    expect(html).toContain('aria-label="TEST custom panel"');
    expect(html).not.toContain("<h2");
    expect(html).not.toContain("aria-labelledby");
    expect(html).not.toContain("/ui/modal/close.svg");
    expect(html).toContain("TEST content action");
  });
  it("supports explicit style and close-control overrides without changing content", () => {
    const html = renderToStaticMarkup(
      <Modal
        {...base}
        closeLabel="Close TEST"
        closeIcon={<span>TEST icon</span>}
        style={{
          "--modal-background": "navy",
          "--modal-border-color": "gold",
          "--modal-border-width": "1px",
        }}
      >
        TEST
      </Modal>,
    );
    expect(html).toContain("--modal-background:navy");
    expect(html).toContain("--modal-border-color:gold");
    expect(html).toContain("--modal-border-width:1px");
    expect(html).toContain('aria-label="Close TEST"');
    expect(html).toContain("TEST icon");
    expect(html).not.toContain("/ui/modal/close.svg");
  });
  it("keeps accessible IDs independent", () => {
    const html = renderToStaticMarkup(
      <>
        <Modal {...base}>One</Modal>
        <Modal {...base}>Two</Modal>
      </>,
    );
    const ids = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(new Set(ids).size).toBe(2);
  });
});
