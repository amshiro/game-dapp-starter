import type { Locale } from "../../shared/i18n/locale";
import { AboutAccordion } from "./components/about-accordion";
import { getAboutCopy, recoveredInlineCopy } from "./data/about-copy";
import styles from "./components/about-page.module.css";

export function AboutPage({ locale }: Readonly<{ locale: Locale }>) {
  const copy = getAboutCopy(locale);
  const sections = ["intro", "mining", "staking", "tokenomics"] as const;
  return (
    <div className={styles.page}>
      <h1 className="text-page-title font-bold">{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>
      <div className={styles.accordion}>
        <AboutAccordion
          items={[
            ...sections.map((id) => ({
              id,
              title: copy.sections[id].title,
              content: copy.sections[id].blocks.map((block, index) =>
                block.type === "heading" ? (
                  <h3 key={index}>{recoveredInlineCopy(block.text)}</h3>
                ) : (
                  <p
                    key={index}
                    className={
                      id === "intro" && index === 0 ? styles.lead : undefined
                    }
                  >
                    {id === "intro" &&
                    index === 0 &&
                    block.text.startsWith("ORI") ? (
                      <>
                        <span className={styles.brand}>ORI</span>
                        {recoveredInlineCopy(block.text.slice(3))}
                      </>
                    ) : (
                      recoveredInlineCopy(block.text)
                    )}
                  </p>
                ),
              ),
            })),
            {
              id: "links",
              title: copy.sections.links.title,
              content: copy.sections.links.items.map((link) => (
                <p key={link.href}>
                  {link.label}
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.href}
                  </a>
                </p>
              )),
            },
          ]}
        />
      </div>
    </div>
  );
}
