import { LEGAL_TEXTS } from "../app/legal";
import { useI18n } from "../app/i18n";
import { LegalDocumentView } from "../components/LegalDocumentView";

export function PaymentRefundPage({ standalone = false }: { standalone?: boolean }) {
  const { language } = useI18n();
  const locale = language === "en" ? "en" : "ru";
  const copy = LEGAL_TEXTS[locale];

  return (
    <LegalDocumentView
      title={copy.paymentRefund.title}
      intro={copy.paymentRefund.intro}
      sections={copy.paymentRefund.sections}
      standalone={standalone}
      backLabel={copy.gate.buttonContinue}
    />
  );
}
