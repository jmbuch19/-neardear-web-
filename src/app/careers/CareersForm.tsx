"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

function inputClass(hasError: boolean) {
  return [
    "w-full rounded-lg px-4 py-3 text-[#1C2B3A] text-sm outline-none transition-colors",
    "border",
    hasError ? "border-[#E85D4A]" : "border-[#E8E0D8]",
    "focus:border-[#1A6B7A]",
    "bg-white",
  ].join(" ");
}

export default function CareersForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your name";
    if (!email.trim()) e.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "Please enter a valid email";
    if (phone.trim() && !/^[0-9+\-\s()]{6,20}$/.test(phone.trim()))
      e.phone = "Please enter a valid phone number";
    if (!message.trim() || message.trim().length < 10)
      e.message = "Tell us a little more";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setStatus("sending");
    try {
      const r = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("error");
        setServerError(data.error ?? "Something went wrong");
        return;
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("error");
      setServerError("Network error. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: "#F0F7F4", border: "1.5px solid #4A8C6F" }}
      >
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#1C2B3A] mb-2">
          Thank you.
        </h3>
        <p className="text-[#1C2B3A]/85">
          We have your note. If there is a fit, we will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm"
      style={{ border: "1px solid #E8E0D8" }}
      noValidate
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
            Name <span style={{ color: "#E85D4A" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={inputClass(!!errors.name)}
            maxLength={120}
          />
          {errors.name && <p className="text-sm mt-1 text-[#E85D4A]">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
            Email <span style={{ color: "#E85D4A" }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass(!!errors.email)}
            maxLength={200}
          />
          {errors.email && <p className="text-sm mt-1 text-[#E85D4A]">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
            Phone <span className="text-[#6B7C85] font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className={inputClass(!!errors.phone)}
            maxLength={20}
          />
          {errors.phone && <p className="text-sm mt-1 text-[#E85D4A]">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
            What would you bring to NearDear?{" "}
            <span style={{ color: "#E85D4A" }}>*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about yourself — what you can do, why NearDear…"
            rows={6}
            className={inputClass(!!errors.message)}
            maxLength={2000}
          />
          {errors.message && (
            <p className="text-sm mt-1 text-[#E85D4A]">{errors.message}</p>
          )}
        </div>

        {serverError && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: "#FDECE9",
              color: "#9B2F1E",
              border: "1px solid #E85D4A",
            }}
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          style={{ background: "#1A6B7A" }}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
