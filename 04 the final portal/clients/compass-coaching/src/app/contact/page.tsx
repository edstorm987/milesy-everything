import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { ContactForm } from "./ContactForm";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
            Contact
          </p>
          <h1 className="mt-3 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight text-[var(--brand-accent)]">
            Tell us what you&apos;re working on.
          </h1>
          <p className="mt-3 text-sm text-[var(--brand-ink)]/70">
            Submissions land in our CRM via the forms plugin and trigger an email notification.
            We aim to reply within two business days.
          </p>
        </header>
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
