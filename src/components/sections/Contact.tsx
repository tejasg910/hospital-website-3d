"use client";

import { useState } from "react";
import { BRAND, DEPARTMENTS } from "@/lib/content";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" data-beat="contact" className="relative px-5 pt-[24vh] md:px-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
        <div>
          <p className="eyebrow" data-fade>
            Book a visit
          </p>
          <h2 data-reveal className="display mt-6 text-5xl md:text-[5vw]">
            We&apos;ll call you <em>within 30 minutes.</em>
          </h2>
          <div data-fade className="mt-10 grid gap-6 text-[0.95rem] sm:grid-cols-2">
            <div>
              <p className="mono text-[var(--fg-mute)]">Visit</p>
              <address className="mt-2 not-italic leading-relaxed">
                {BRAND.address.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </address>
            </div>
            <div>
              <p className="mono text-[var(--fg-mute)]">Call</p>
              <p className="mt-2 leading-relaxed">
                <a href={BRAND.phoneHref} className="block hover:text-[var(--color-mint)]">
                  {BRAND.phone}
                </a>
                <a href={BRAND.emergencyHref} className="block text-[var(--color-coral)]">
                  Emergency {BRAND.emergency}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div data-fade className="panel-light p-7 md:p-10">
          {sent ? (
            <div role="status" className="py-12 text-center">
              <p className="display text-4xl">Thank you.</p>
              <p className="mt-3 text-[0.95rem] text-[rgba(6,24,27,0.7)]">
                A care coordinator will call you shortly to confirm your appointment.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="grid gap-5 sm:grid-cols-2"
            >
              <label className="sm:col-span-2">
                <span className="mono text-[rgba(6,24,27,0.6)]">Full name</span>
                <input required name="name" autoComplete="name" className="field" placeholder="Your name" />
              </label>
              <label>
                <span className="mono text-[rgba(6,24,27,0.6)]">Phone</span>
                <input required name="phone" type="tel" autoComplete="tel" className="field" placeholder="+91" />
              </label>
              <label>
                <span className="mono text-[rgba(6,24,27,0.6)]">Preferred date</span>
                <input name="date" type="date" className="field" />
              </label>
              <label className="sm:col-span-2">
                <span className="mono text-[rgba(6,24,27,0.6)]">Department</span>
                <select name="dept" className="field" defaultValue="">
                  <option value="" disabled>
                    Choose a department
                  </option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.name}>{d.name}</option>
                  ))}
                  <option>General medicine</option>
                  <option>Not sure — help me choose</option>
                </select>
              </label>
              <button type="submit" className="btn btn-coral mt-2 w-fit sm:col-span-2">
                Request appointment <span className="arrow" aria-hidden="true">→</span>
              </button>
              <p className="text-[0.78rem] text-[rgba(6,24,27,0.55)] sm:col-span-2">
                For a medical emergency, don&apos;t wait — call {BRAND.emergency}.
              </p>
            </form>
          )}
        </div>
      </div>

      <footer className="mt-[18vh] overflow-hidden pb-8">
        <p className="footer-word display text-center text-[27vw] leading-[0.8] md:text-[24vw]" aria-hidden="true">
          {BRAND.name}
        </p>
        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-[var(--line)] pt-5 text-[0.8rem] text-[var(--fg-mute)] md:flex-row">
          <p>© 2026 {BRAND.full}. Fictional hospital — design concept.</p>
          <p>{BRAND.email}</p>
        </div>
      </footer>
    </section>
  );
}
