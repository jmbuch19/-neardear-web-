"use client";

import { useLanguage } from "@/lib/language";
import Link from "next/link";

interface MatchCard {
  initials: string;
  avatarBg: string;
  name: string;
  role: string;
  trustLabel: string;
  trustLevel: number;
  description: string;
  services: string;
  fee: string;
  primaryCta: string;
  secondaryCta?: string;
}

const cardsEN: MatchCard[] = [
  {
    initials: "RP",
    avatarBg: "#1A6B7A",
    name: "Rameshbhai P.",
    role: "Retired Bank Officer · Ahmedabad",
    trustLabel: "✓ Level 3 Trusted Companion",
    trustLevel: 3,
    description:
      "Available Monday, Wednesday, Friday mornings. Lives 3km from your parent's area. Speaks Gujarati and Hindi. Completed 34 elder visits.",
    services: "Elder Visit · Hospital Help · Bank Help",
    fee: "₹700/visit",
    primaryCta: "Request Rameshbhai",
  },
  {
    initials: "PS",
    avatarBg: "#4A8C6F",
    name: "Priyaben S.",
    role: "Homemaker · Ahmedabad — Naranpura",
    trustLabel: "✓ Level 2 Trusted Companion",
    trustLevel: 2,
    description:
      "Medicine pickup runs every Tuesday and Thursday. Knows all local chemists. 28 pickups completed.",
    services: "Medicine Pickup",
    fee: "₹380/pickup",
    primaryCta: "Request Priyaben",
    secondaryCta: "Set up recurring",
  },
  {
    initials: "AK",
    avatarBg: "#8B7EC8",
    name: "Arjun K.",
    role: "Young Professional · Ahmedabad",
    trustLabel: "✓ Level 1 Companion",
    trustLevel: 1,
    description:
      "Has helped 6 students settle in. Available weekends. Gujarati, Hindi, English.",
    services: "Student Support",
    fee: "₹500/session",
    primaryCta: "Request Arjun",
  },
];

const cardsGU: MatchCard[] = [
  {
    initials: "RP",
    avatarBg: "#1A6B7A",
    name: "રમેશભાઈ પ.",
    role: "નિવૃત્ત બેંક અધિકારી · અમદાવાદ",
    trustLabel: "✓ સ્તર 3 વિશ્વસ્ત સાથી",
    trustLevel: 3,
    description:
      "સોમ, બુધ, શુક્ર સવારે ઉપલબ્ધ. તમારા માતા-પિતાના વિસ્તારથી 3 કિ.મી. ગુજરાતી અને હિન્દી બોલે છે. 34 વડીલ મુલાકાતો પૂર્ણ.",
    services: "વડીલ મુલાકાત · હોસ્પિટલ · બેંક",
    fee: "₹700/મુલાકાત",
    primaryCta: "રમેશભાઈને વિનંતી",
  },
  {
    initials: "PS",
    avatarBg: "#4A8C6F",
    name: "પ્રિયાબહેન સ.",
    role: "ગૃહિણી · અમદાવાદ — નારણપુરા",
    trustLabel: "✓ સ્તર 2 વિશ્વસ્ત સાથી",
    trustLevel: 2,
    description:
      "દર મંગળ અને ગુરુ દવા લઈ આવે. બધા સ્થાનિક કેમિસ્ટ જાણે. 28 ફેરા પૂર્ણ.",
    services: "દવા લઈ આવવી",
    fee: "₹380/ફેરો",
    primaryCta: "પ્રિયાબહેનને વિનંતી",
    secondaryCta: "નિયમિત ગોઠવો",
  },
  {
    initials: "AK",
    avatarBg: "#8B7EC8",
    name: "અર્જુન ક.",
    role: "યુવા વ્યાવસાયિક · અમદાવાદ",
    trustLabel: "✓ સ્તર 1 સાથી",
    trustLevel: 1,
    description:
      "6 વિદ્યાર્થીઓને સ્થળ સ્થાપ્ત કરવામાં મદદ કરી. સપ્તાહાંત ઉપલબ્ધ. ગુજરાતી, હિન્દી, અંગ્રેજી.",
    services: "વિદ્યાર્થી સહાય",
    fee: "₹500/સત્ર",
    primaryCta: "અર્જુનને વિનંતી",
  },
];

const cardsHI: MatchCard[] = [
  {
    initials: "RP",
    avatarBg: "#1A6B7A",
    name: "रमेशभाई प.",
    role: "सेवानिवृत्त बैंक अधिकारी · अहमदाबाद",
    trustLabel: "✓ स्तर 3 विश्वसनीय साथी",
    trustLevel: 3,
    description:
      "सोम, बुध, शुक्र सुबह उपलब्ध। आपके माता-पिता के क्षेत्र से 3 किमी। गुजराती और हिंदी बोलते हैं। 34 बुजुर्ग मुलाकातें पूर्ण।",
    services: "बुजुर्ग मुलाकात · अस्पताल · बैंक",
    fee: "₹700/मुलाकात",
    primaryCta: "रमेशभाई को अनुरोध",
  },
  {
    initials: "PS",
    avatarBg: "#4A8C6F",
    name: "प्रियाबेन स.",
    role: "गृहिणी · अहमदाबाद — नारणपुरा",
    trustLabel: "✓ स्तर 2 विश्वसनीय साथी",
    trustLevel: 2,
    description:
      "हर मंगल और गुरु दवा लाती हैं। सभी स्थानीय केमिस्ट जानती हैं। 28 फेरे पूर्ण।",
    services: "दवा लाना",
    fee: "₹380/फेरा",
    primaryCta: "प्रियाबेन को अनुरोध",
    secondaryCta: "नियमित सेट करें",
  },
  {
    initials: "AK",
    avatarBg: "#8B7EC8",
    name: "अर्जुन क.",
    role: "युवा पेशेवर · अहमदाबाद",
    trustLabel: "✓ स्तर 1 साथी",
    trustLevel: 1,
    description:
      "6 छात्रों को नए शहर में बसने में मदद की। सप्ताहांत उपलब्ध। गुजराती, हिंदी, अंग्रेजी।",
    services: "छात्र सहायता",
    fee: "₹500/सत्र",
    primaryCta: "अर्जुन को अनुरोध",
  },
];

const t = {
  EN: {
    label: "WHO YOU WILL MEET",
    heading: "Real people. Verified. Near you.",
    cta: "Find companions in your city",
    cards: cardsEN,
  },
  GU: {
    label: "તમે કોને મળશો",
    heading: "વાસ્તવિક લોકો. ચકાસાયેલ. તમારી નજીક.",
    cta: "તમારા શહેરમાં સાથી શોધો",
    cards: cardsGU,
  },
  HI: {
    label: "आप किससे मिलेंगे",
    heading: "असली लोग। सत्यापित। आपके पास।",
    cta: "अपने शहर में साथी खोजें",
    cards: cardsHI,
  },
};

function TrustDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1 mt-1">
      {[1, 2, 3].map((l) => (
        <div
          key={l}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: l <= level ? "#1A6B7A" : "#E8E0D8" }}
        />
      ))}
    </div>
  );
}

export default function MatchCards() {
  const { lang } = useLanguage();
  const copy = t[lang];

  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-4">
            {copy.label}
          </p>
          <h2
            className="font-[family-name:var(--font-playfair)] font-bold text-[#1C2B3A]"
            style={{ fontSize: "clamp(26px, 3vw, 36px)" }}
          >
            {copy.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {copy.cards.map((card) => (
            <div
              key={card.name}
              className="bg-white rounded-2xl shadow-md p-6 border border-[#E8E0D8] flex flex-col"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-[family-name:var(--font-playfair)] font-bold text-lg shrink-0"
                  style={{ backgroundColor: card.avatarBg }}
                >
                  {card.initials}
                </div>
                <div>
                  <p className="font-semibold text-[#1C2B3A] text-base leading-tight">
                    {card.name}
                  </p>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">{card.role}</p>
                  <TrustDots level={card.trustLevel} />
                </div>
              </div>

              {/* Trust badge */}
              <span className="inline-block bg-[#1A6B7A] text-white text-xs px-3 py-1 rounded-full font-medium mb-4 self-start">
                {card.trustLabel}
              </span>

              {/* Description */}
              <p className="text-[#6B7280] text-sm leading-relaxed mb-4 flex-1">
                {card.description}
              </p>

              {/* Services + fee */}
              <div className="mb-4">
                <p className="text-[#9CA3AF] text-xs mb-1">{card.services}</p>
                <p
                  className="font-[family-name:var(--font-dm-mono)] font-medium text-base"
                  style={{ color: "#F0B429" }}
                >
                  {card.fee}
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 mt-auto">
                <Link
                  href="/request/new"
                  className="text-center bg-[#E07B2F] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {card.primaryCta}
                </Link>
                {card.secondaryCta && (
                  <Link
                    href="/request?recurring=true"
                    className="text-center border border-[#E07B2F] text-[#E07B2F] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#E07B2F] hover:text-white transition-colors"
                  >
                    {card.secondaryCta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/services"
            className="inline-block bg-[#E07B2F] text-white rounded-xl px-8 py-4 text-base font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            {copy.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
