import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormFields {
  name: string;
  email: string;
  phone: string;
  comment: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  comment?: string;
}

// ─── Input component ─────────────────────────────────────────────────────────
const Field = ({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-sm font-medium"
      style={{ color: "#1A1A1A" }}
    >
      {label}
      {required && (
        <span className="ml-0.5" style={{ color: "#1A1A1A" }}>
          *
        </span>
      )}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">
        <span>⚠️</span> {error}
      </p>
    )}
  </div>
);

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors";
const inputNormal =
  "border-[rgba(26,26,26,0.2)] text-[#1A1A1A] placeholder:text-[rgba(26,26,26,0.7)] focus:border-[#c3d92d] focus:ring-2 focus:ring-[#c3d92d]/20";
const inputError = "border-red-400 ring-2 ring-red-400/20";

// ─── Contact info tile ────────────────────────────────────────────────────────
const InfoTile = ({
  emoji,
  label,
  value,
  href,
}: {
  emoji: string;
  label: string;
  value: string;
  href?: string;
}) => (
  <div className="flex items-start gap-4">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: "rgba(195, 217, 45, 0.2)" }}
    >
      {emoji}
    </div>
    <div>
      <p
        className="text-xs uppercase tracking-wide font-medium mb-0.5"
        style={{ color: "rgba(26, 26, 26, 0.7)" }}
      >
        {label}
      </p>
      {href ? (
        <a
          href={href}
          className="text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: "#1A1A1A" }}
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
          {value}
        </p>
      )}
    </div>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────
const ContactPage = () => {
  const [fields, setFields] = useState<FormFields>({
    name: "",
    email: "",
    phone: "",
    comment: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!fields.name.trim()) errs.name = "Name is required.";
    if (!fields.email.includes("@") || !fields.email.includes("."))
      errs.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(fields.phone.trim()))
      errs.phone = "Enter a valid 10-digit phone number.";
    if (!fields.comment.trim())
      errs.comment = "Please write something before sending.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isValid =
    fields.name.trim().length > 0 &&
    fields.email.includes("@") &&
    fields.email.includes(".") &&
    /^\d{10}$/.test(fields.phone.trim()) &&
    fields.comment.trim().length > 0;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submitted) return;
    validate();
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          message: fields.comment,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#F5F0E8",
        fontFamily: "PlusJakartaSans, sans-serif",
      }}
    >
      {/* Minimal nav */}
      <div
        className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-sm"
        style={{ borderColor: "rgba(26, 26, 26, 0.2)" }}
      >
        <div className="container max-w-5xl py-4">
          <Link
            to="/"
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: "rgba(26, 26, 26, 0.7)" }}
          >
            ← Home
          </Link>
        </div>
      </div>

      <main>
        {/* ── Hero ── */}
        <section className="py-20 md:py-28" style={{ background: "#F5F0E8" }}>
          <div className="container max-w-2xl text-center">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em] mb-5"
              style={{ color: "#1A1A1A" }}
            >
              Get in touch
            </span>
            <h1 className="text-4xl sm:text-5xl leading-tight mb-5 font-semibold" style={{ color: "#1A1A1A" }}>
              We're just a message away.
            </h1>
            <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: "rgba(26, 26, 26, 0.7)" }}>
              Questions about an order, a flavour, or something else entirely? Write to us — every message is read and replied to personally.
            </p>
          </div>
        </section>

        {/* ── Main content ── */}
        <section className="pb-24 bg-white">
          <div className="container max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

              {/* ── Left: info ── */}
              <div className="lg:col-span-2 flex flex-col gap-8 pt-2">
                <div>
                  <h2 className="text-2xl mb-2 font-semibold" style={{ color: "#1A1A1A" }}>
                    Contact
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(26, 26, 26, 0.7)" }}>
                    We're a small team operating out of Bengaluru. We don't hide behind forms — your message goes straight to us.
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                  <InfoTile
                    emoji="📧"
                    label="Email"
                    value="hello@quartermelon.in"
                    href="mailto:hello@quartermelon.in"
                  />
                  <InfoTile
                    emoji="💬"
                    label="WhatsApp"
                    value="+91 63644 71003"
                    href="https://wa.me/916364471003"
                  />
                  <InfoTile
                    emoji="📍"
                    label="Based in"
                    value="Bengaluru, Karnataka, India"
                  />
                  <InfoTile
                    emoji="🕐"
                    label="Response time"
                    value="Usually within a few hours"
                  />
                </div>

                {/* Divider + note */}
                <div
                  className="border-l-4 pl-4 py-1"
                  style={{ borderColor: "#c3d92d" }}
                >
                  <p className="text-xs leading-relaxed italic" style={{ color: "rgba(26, 26, 26, 0.7)" }}>
                    "We read every message. If you wrote to us, we'll write back."
                  </p>
                </div>
              </div>

              {/* ── Right: form ── */}
              <div className="lg:col-span-3">
                <div
                  className="bg-white border rounded-2xl shadow-sm p-8 md:p-10"
                  style={{ borderColor: "rgba(26, 26, 26, 0.2)" }}
                >
                  {submitted ? (
                    /* Success state */
                    <div
                      className="flex flex-col items-center text-center py-8 gap-5 rounded-xl"
                      style={{ background: "rgba(195, 217, 45, 0.2)" }}
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: "#F5F0E8" }}
                      >
                        <CheckCircle2
                          size={32}
                          style={{ color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <p className="text-2xl mb-2 font-semibold" style={{ color: "#1A1A1A" }}>
                           Message sent!
                        </p>
                        <p className="text-sm max-w-xs mx-auto" style={{ color: "#1A1A1A" }}>
                          We'll get back to you soon.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setError("");
                          setFields({ name: "", email: "", phone: "", comment: "" });
                          setErrors({});
                        }}
                        className="text-sm font-medium underline underline-offset-4 transition-colors hover:opacity-80"
                        style={{ color: "rgba(26, 26, 26, 0.7)" }}
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSend} noValidate className="flex flex-col gap-5">
                      {/* Name + Email row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field id="ct-name" label="Name" error={errors.name}>
                          <input
                            id="ct-name"
                            type="text"
                            value={fields.name}
                            onChange={set("name")}
                            placeholder="Varun Bhat"
                            className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
                          />
                        </Field>

                        <Field id="ct-email" label="Email" required error={errors.email}>
                          <input
                            id="ct-email"
                            type="email"
                            value={fields.email}
                            onChange={set("email")}
                            placeholder="varun@example.com"
                            className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                          />
                        </Field>
                      </div>

                      {/* Phone */}
                      <Field
                        id="ct-phone"
                        label="Phone number"
                        error={errors.phone}
                      >
                        <input
                          id="ct-phone"
                          type="tel"
                          value={fields.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setFields((prev) => ({ ...prev, phone: val }));
                            if (errors.phone)
                              setErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          placeholder="9876543210"
                          className={`${inputBase} ${errors.phone ? inputError : inputNormal}`}
                        />
                      </Field>

                      {/* Comment */}
                      <Field id="ct-comment" label="Comment" error={errors.comment}>
                        <textarea
                          id="ct-comment"
                          value={fields.comment}
                          onChange={set("comment")}
                          placeholder="Ask us anything — about an order, a flavour, or just a thought."
                          rows={5}
                          className={`${inputBase} resize-none ${errors.comment ? inputError : inputNormal}`}
                        />
                      </Field>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={!isValid || loading || submitted}
                        className="mt-1 w-full sm:w-auto sm:self-start inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#c3d92d]"
                        style={{ background: "#fba74c", color: "#1A1A1A" }}
                      >
                        {loading ? "Sending..." : "Send Message →"}
                      </button>
                      {error && (
                        <p className="text-sm text-red-500">{error}</p>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="py-8 bg-white border-t text-center"
        style={{ borderColor: "rgba(26, 26, 26, 0.2)" }}
      >
        <p className="text-xs" style={{ color: "rgba(26, 26, 26, 0.7)" }}>
          Quartermelon · Bengaluru, India · 2026
        </p>
      </footer>
    </div>
  );
};

export default ContactPage;
