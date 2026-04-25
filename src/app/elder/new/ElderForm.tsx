"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface City {
  id: string;
  name: string;
  state: string;
}

const AGE_RANGES = ["Under 60", "60–65", "66–70", "71–75", "76–80", "81–85", "Above 85"];
const LANGUAGES = ["Gujarati", "Hindi", "English", "Other"];
const MOBILITY_OPTIONS = [
  { value: "INDEPENDENT", label: "Independent — moves around freely" },
  { value: "NEEDS_SUPPORT", label: "Needs support — can walk with help" },
  { value: "WHEELCHAIR", label: "Uses wheelchair" },
  { value: "BEDRIDDEN", label: "Bedridden — needs full care" },
];
const PERSONAL_CARE = [
  "Bathing assistance",
  "Toileting / continence care",
  "Feeding assistance",
  "Dressing assistance",
  "Medication reminders",
];
const MEDICAL_EQUIPMENT = [
  "Wheelchair",
  "Walker / cane",
  "Oxygen concentrator",
  "BP / sugar monitor",
  "Hospital bed",
];
const GENDERS: { value: "FEMALE" | "MALE" | "NO_PREFERENCE"; label: string }[] = [
  { value: "FEMALE", label: "Female companion preferred" },
  { value: "MALE", label: "Male companion preferred" },
  { value: "NO_PREFERENCE", label: "No preference" },
];

function inputClass(hasError: boolean) {
  return [
    "w-full rounded-lg px-3 py-2.5 text-[#1C2B3A] text-sm outline-none transition-colors",
    "border",
    hasError ? "border-[#E85D4A]" : "border-[#E8E0D8]",
    "focus:border-[#1A6B7A]",
    "bg-white",
  ].join(" ");
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm mt-1 text-[#E85D4A]">{msg}</p>;
}

function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-2.5 transition-all"
            style={{
              border: checked ? "1.5px solid #4A8C6F" : "1.5px solid #E8E0D8",
              background: checked ? "#F0F7F4" : "#FFFFFF",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt)}
              className="hidden"
            />
            <div
              className="flex-shrink-0 rounded flex items-center justify-center"
              style={{
                width: 18,
                height: 18,
                background: checked ? "#4A8C6F" : "#FFFFFF",
                border: checked ? "2px solid #4A8C6F" : "2px solid #E8E0D8",
              }}
            >
              {checked && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-[#1C2B3A]">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function ElderForm({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [mobilityLevel, setMobilityLevel] = useState("");
  const [personalCareNeeds, setPersonalCareNeeds] = useState<string[]>([]);
  const [medicalEquipment, setMedicalEquipment] = useState<string[]>([]);
  const [healthNotes, setHealthNotes] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [genderPreference, setGenderPreference] = useState<
    "FEMALE" | "MALE" | "NO_PREFERENCE"
  >("NO_PREFERENCE");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!city) e.city = "City is required";
    if (!ageRange) e.ageRange = "Age range is required";
    if (!primaryLanguage) e.primaryLanguage = "Primary language is required";
    if (!emergencyName.trim()) e.emergencyName = "Emergency contact name is required";
    if (!/^[0-9+\-\s()]{6,20}$/.test(emergencyContact.trim()))
      e.emergencyContact = "Enter a valid phone number";
    if (phone.trim() && !/^[0-9+\-\s()]{6,20}$/.test(phone.trim()))
      e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/elder-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          phone,
          ageRange,
          primaryLanguage,
          mobilityLevel,
          personalCareNeeds,
          medicalEquipment,
          healthNotes,
          emergencyName,
          emergencyContact,
          genderPreference,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setServerError(data.error ?? "Could not save the profile");
        return;
      }
      const elderName = encodeURIComponent(name);
      router.push(`/dashboard?elder_created=${elderName}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
      style={{ border: "1px solid #E8E0D8" }}
      noValidate
    >
      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Their name <span className="text-[#E85D4A]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className={inputClass(!!errors.name)}
          maxLength={120}
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Which city do they live in? <span className="text-[#E85D4A]">*</span>
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={inputClass(!!errors.city)}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError msg={errors.city} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Their phone number{" "}
          <span className="text-[#6B7C85] font-normal">(optional)</span>
        </label>
        <div className="flex">
          <span className="px-3 py-2.5 bg-[#F7F3EE] text-[#6B7C85] text-sm border border-r-0 border-[#E8E0D8] rounded-l-lg">
            +91
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit number"
            className="flex-1 rounded-r-lg border border-[#E8E0D8] px-3 py-2.5 text-sm bg-white outline-none focus:border-[#1A6B7A]"
            maxLength={20}
          />
        </div>
        <p className="text-xs text-[#6B7C85] mt-1">
          If provided, we will send a one-time consent message.
        </p>
        <FieldError msg={errors.phone} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Age range <span className="text-[#E85D4A]">*</span>
        </label>
        <select
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className={inputClass(!!errors.ageRange)}
        >
          <option value="">Select age range</option>
          {AGE_RANGES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <FieldError msg={errors.ageRange} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Primary language <span className="text-[#E85D4A]">*</span>
        </label>
        <select
          value={primaryLanguage}
          onChange={(e) => setPrimaryLanguage(e.target.value)}
          className={inputClass(!!errors.primaryLanguage)}
        >
          <option value="">Select language</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <FieldError msg={errors.primaryLanguage} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Mobility level
        </label>
        <select
          value={mobilityLevel}
          onChange={(e) => setMobilityLevel(e.target.value)}
          className={inputClass(false)}
        >
          <option value="">Select mobility level</option>
          {MOBILITY_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-2">
          Personal care needs
        </label>
        <CheckList
          options={PERSONAL_CARE}
          selected={personalCareNeeds}
          onToggle={(v) => toggle(personalCareNeeds, setPersonalCareNeeds, v)}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-2">
          Medical equipment in use
        </label>
        <CheckList
          options={MEDICAL_EQUIPMENT}
          selected={medicalEquipment}
          onToggle={(v) => toggle(medicalEquipment, setMedicalEquipment, v)}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Health or mobility notes{" "}
          <span className="text-[#6B7C85] font-normal">(optional)</span>
        </label>
        <textarea
          value={healthNotes}
          onChange={(e) => setHealthNotes(e.target.value)}
          placeholder="Anything the companion should know — health conditions, allergies, preferences"
          rows={4}
          className={inputClass(false)}
          maxLength={2000}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Emergency contact name <span className="text-[#E85D4A]">*</span>
        </label>
        <input
          type="text"
          value={emergencyName}
          onChange={(e) => setEmergencyName(e.target.value)}
          placeholder="Full name"
          className={inputClass(!!errors.emergencyName)}
          maxLength={120}
        />
        <FieldError msg={errors.emergencyName} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
          Emergency contact phone <span className="text-[#E85D4A]">*</span>
        </label>
        <input
          type="tel"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          placeholder="+91 98765 43210"
          className={inputClass(!!errors.emergencyContact)}
          maxLength={20}
        />
        <FieldError msg={errors.emergencyContact} />
      </div>

      <fieldset>
        <legend className="block text-sm font-semibold text-[#1A6B7A] mb-2">
          Companion gender preference
        </legend>
        <div className="space-y-2">
          {GENDERS.map((g) => (
            <label
              key={g.value}
              className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-2.5"
              style={{
                border:
                  genderPreference === g.value
                    ? "1.5px solid #4A8C6F"
                    : "1.5px solid #E8E0D8",
                background: genderPreference === g.value ? "#F0F7F4" : "#FFFFFF",
              }}
            >
              <input
                type="radio"
                name="gender"
                checked={genderPreference === g.value}
                onChange={() => setGenderPreference(g.value)}
              />
              <span className="text-sm text-[#1C2B3A]">{g.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
        disabled={busy}
        className="w-full rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-60"
        style={{ background: "#E07B2F" }}
      >
        {busy ? "Saving…" : "Save Elder Profile"}
      </button>
    </form>
  );
}
