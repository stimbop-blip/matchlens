import { Link } from "react-router-dom";

import { AppDisclaimer } from "./AppDisclaimer";
import { Layout } from "./Layout";

type LegalSection = {
  title: string;
  body: string;
};

type LegalDocumentViewProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
  standalone?: boolean;
  backLabel: string;
};

function LegalBody({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <section className="pb-legal-panel pb-reveal">
      <div className="pb-legal-head">
        <span className="pb-brand-chip">PIT BET</span>
        <span className="pb-legal-chip">{sections.length}</span>
      </div>
      <h2>{title}</h2>
      <p className="pb-legal-intro">{intro}</p>

      <div className="pb-legal-sections">
        {sections.map((section, index) => (
          <article key={section.title} className="pb-legal-section">
            <small className="pb-legal-section-index">#{index + 1}</small>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LegalDocumentView({ title, intro, sections, standalone = false, backLabel }: LegalDocumentViewProps) {
  if (standalone) {
    return (
      <main className="pb-legal-root">
        <LegalBody title={title} intro={intro} sections={sections} />
        <div className="pb-legal-gate-back">
          <Link className="pb-btn pb-btn-secondary" to="/gate">
            {backLabel}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <Layout>
      <LegalBody title={title} intro={intro} sections={sections} />
      <AppDisclaimer />
    </Layout>
  );
}
