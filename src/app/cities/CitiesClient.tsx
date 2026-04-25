"use client";

import Link from "next/link";
import { useState } from "react";

interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  status: string;
}

type WaitlistType = "FAMILY" | "COMPANION";

function ActiveCard({ city }: { city: City }) {
  return (
    <article
      className="rounded-2xl bg-white p-7 flex flex-col gap-3"
      style={{ border: "1.5px solid #4A8C6F", boxShadow: "0 4px 16px rgba(74, 140, 111, 0.08)" }}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block rounded-full" style={{ width: 10, height: 10, background: "#4A8C6F" }} />
        <p className="text-xs font-semibold tracking-widest uppercase text-[#4A8C6F]">Active</p>
      </div>
      <h3 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A] leading-tight">
        {city.name}
      </h3>
      <p className="text-sm text-[#1C2B3A]/70">{city.state}</p>
      <p className="text-sm text-[#1C2B3A]">Companions available now</p>
      <div className="mt-2">
        <Link
          href={`/request/new?city=${encodeURIComponent(city.name)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A6B7A] hover:underline"
        >
          Find a companion <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function ComingSoonCard({ city }: { city: City }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<WaitlistType>("FAMILY");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !/^[0-9+\-\s()]{6,20}$/.test(phone.trim())) {
      setError("Enter your name and a valid phone number");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/city-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId: city.id, name, phone, type }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error ?? "Could not save you to the list");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="rounded-2xl bg-white p-6 flex flex-col gap-3"
      style={{ border: "1px solid #E8E0D8" }}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block rounded-full" style={{ width: 10, height: 10, background: "#C2B6A8" }} />
        <p className="text-xs font-semibold tracking-widest uppercase text-[#6B7C85]">Coming soon</p>
      </div>
      <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#1C2B3A]/80 leading-tight">
        {city.name}
      </h3>
      <p className="text-sm text-[#1C2B3A]/60">{city.state}</p>

      {done ? (
        <p className="mt-1 text-sm text-[#4A8C6F] font-medium">
          You are on the list. We will SMS you when NearDear launches in {city.name}.
        </p>
      ) : open ? (
        <form onSubmit={submit} className="mt-2 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-[#E8E0D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1A6B7A]"
            maxLength={120}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone (+91…)"
            className="w-full rounded-lg border border-[#E8E0D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1A6B7A]"
            maxLength={20}
          />
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold uppercase tracking-wider text-[#1A6B7A] mb-1">
              I am joining as
            </legend>
            <label className="flex items-center gap-2 text-sm text-[#1C2B3A]">
              <input
                type="radio"
                name={`type-${city.id}`}
                checked={type === "FAMILY"}
                onChange={() => setType("FAMILY")}
              />
              Family looking for care
            </label>
            <label className="flex items-center gap-2 text-sm text-[#1C2B3A]">
              <input
                type="radio"
                name={`type-${city.id}`}
                checked={type === "COMPANION"}
                onChange={() => setType("COMPANION")}
              />
              Companion wanting to join
            </label>
          </fieldset>
          {error && <p className="text-sm text-[#E85D4A]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#E07B2F" }}
            >
              {busy ? "Saving…" : "Notify me"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#6B7C85]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start mt-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          style={{ border: "1.5px solid #1A6B7A", color: "#1A6B7A" }}
        >
          Join waitlist
        </button>
      )}
    </article>
  );
}

function OtherCityForm() {
  const [cityName, setCityName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cityName.trim() || !/^[0-9+\-\s()]{6,20}$/.test(phone.trim())) {
      setError("Enter a city and a valid phone number");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/city-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName, phone }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error ?? "Could not save your interest");
        return;
      }
      setDone(true);
      setCityName("");
      setPhone("");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-center text-[#4A8C6F] font-medium">
        Thank you — your city is now on our radar. We will be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <input
        type="text"
        value={cityName}
        onChange={(e) => setCityName(e.target.value)}
        placeholder="City name"
        className="rounded-lg border border-[#E8E0D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1A6B7A]"
        maxLength={120}
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Your phone"
        className="rounded-lg border border-[#E8E0D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1A6B7A]"
        maxLength={20}
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "#E07B2F" }}
      >
        {busy ? "Sending…" : "Tell us →"}
      </button>
      {error && <p className="text-sm text-[#E85D4A] sm:col-span-3">{error}</p>}
    </form>
  );
}

export default function CitiesClient({
  active,
  comingSoon,
}: {
  active: City[];
  comingSoon: City[];
}) {
  return (
    <>
      <section className="bg-[#FAF5EC] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-2">
              ACTIVE CITIES
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A]">
              Where you can book today
            </h2>
          </div>
          {active.length === 0 ? (
            <p className="text-[#1C2B3A]/70">
              We are launching very soon. Check back shortly.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {active.map((c) => (
                <ActiveCard key={c.id} city={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#FEF8F0] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-2">
              COMING SOON
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A]">
              Cities we are heading to
            </h2>
          </div>
          {comingSoon.length === 0 ? (
            <p className="text-[#1C2B3A]/70">No cities queued yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {comingSoon.map((c) => (
                <ComingSoonCard key={c.id} city={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#FAF5EC] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A] mb-3">
            Don&rsquo;t see your city?
          </h2>
          <p className="text-[#1C2B3A]/75 mb-8">
            Tell us where you are. The cities we hear about most are the ones we go to next.
          </p>
          <OtherCityForm />
        </div>
      </section>
    </>
  );
}
