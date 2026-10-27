import {
  AboutAccordion,
  type AboutAccordionItem,
} from "../components/about-accordion";
import styles from "../components/about-accordion.module.css";

// TEST FIXTURE ONLY. No ORI product copy, rates, asset claims or external links.
// Never import this file from a production route or the App Shell.
const paragraph =
  "Test fixture paragraph. This text checks wrapping, readable line spacing and natural document flow. It is not approved About content and does not describe ORI or any product rule.";

export const aboutAccordionFixtureItems: readonly AboutAccordionItem[] = [
  {
    id: "intro",
    title: "Intro",
    content: (
      <>
        <p className={styles.lead}>
          TEST FIXTURE — introductory text used only to compare the expanded
          typography and layout.
        </p>
        <h3>Fixture subheading</h3>
        <p>{Array(4).fill(paragraph).join(" ")}</p>
      </>
    ),
  },
  {
    id: "mining",
    title: "Mining",
    content: (
      <>
        <p>TEST FIXTURE — long content, without business facts.</p>
        <h3>Fixture long body</h3>
        <p>{Array(8).fill(paragraph).join(" ")}</p>
        <h3>Fixture unbroken text</h3>
        <p>{"FIXTUREUNBROKEN".repeat(45)}</p>
        <h3>Fixture final section</h3>
        <p>
          TEST FIXTURE END — the final line must remain reachable above the
          Bottom Navigation when scrolled.
        </p>
      </>
    ),
  },
  {
    id: "staking",
    title: "Staking",
    content: (
      <p>
        TEST FIXTURE — collapsed content must be hidden from visual and keyboard
        navigation.
      </p>
    ),
  },
  {
    id: "tokenomics",
    title: "Tokenomics",
    content: <p>TEST FIXTURE — no rates or token rules are supplied.</p>,
  },
  {
    id: "links",
    title: "Links",
    content: <p>TEST FIXTURE — no external destination is supplied.</p>,
  },
];

export function AboutAccordionFixture() {
  return (
    <>
      <h1 className="text-page-title font-bold">About</h1>
      <p className="my-6 text-body text-text-secondary">
        TEST FIXTURE ONLY — not approved product content.
      </p>
      <AboutAccordion items={aboutAccordionFixtureItems} />
    </>
  );
}
