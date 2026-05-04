"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";

type AxisKey = "company" | "reputation" | "salary" | "local" | "contact";

type IntelligenceSignal = {
  id: string;
  label: string;
  direction: "risk" | "trust" | "neutral";
  severity: "low" | "medium" | "high";
  weight: number;
  evidenceIds: string[];
  rationale: string;
};

type AxisStatus = "High risk" | "Caution" | "Low concern";

type AxisDetail = {
  key: AxisKey;
  axis: string;
  value: number;
  activeValue: number;
  status: AxisStatus;
  summary: string;
  reasons: string[];
  signals: IntelligenceSignal[];
};

interface RiskRadarChartProps {
  extractedClaims: {
    company: string;
    salary: string;
    contactMethod: string;
    applicationPath: string;
    location: string;
  };
  redFlags: string[];
  greenFlags: string[];
  evidence: Array<{ type: string }>;
  verdict: "safe" | "caution" | "high-risk";
  intelligence?: {
    coverage?: Record<string, string>;
    signals?: IntelligenceSignal[];
  };
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function scoreStatus(score: number): AxisStatus {
  if (score >= 70) return "High risk";
  if (score >= 35) return "Caution";
  return "Low concern";
}

function toneClass(status: AxisStatus) {
  if (status === "High risk")
    return "border-risk/40 bg-risk-bg/35 text-risk-text";
  if (status === "Caution")
    return "border-caution/50 bg-caution-bg/35 text-caution-text";
  return "border-safe/40 bg-safe/25 text-safe-text";
}

function statusColor(status: AxisStatus) {
  if (status === "High risk") return "var(--hireproof-risk-text)";
  if (status === "Caution") return "var(--hireproof-caution-text)";
  return "var(--hireproof-safe-text)";
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function matchingSignals(signals: IntelligenceSignal[], ids: string[]) {
  return signals.filter((signal) => ids.some((id) => signal.id.includes(id)));
}

function addUnique(reasons: string[], reason: string) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function buildAxisDetail(
  key: AxisKey,
  axis: string,
  score: number,
  summary: string,
  reasons: string[],
  signals: IntelligenceSignal[],
): AxisDetail {
  return {
    key,
    axis,
    value: clampScore(score),
    activeValue: 0,
    status: scoreStatus(clampScore(score)),
    summary,
    reasons:
      reasons.length > 0
        ? reasons.slice(0, 3)
        : ["Not enough specific evidence was available for this dimension."],
    signals,
  };
}

function RiskNodeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: AxisDetail }>;
}) {
  if (!active || !payload?.length) return null;
  const axis = payload[0].payload;

  return (
    <div
      className={`max-w-56 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md ${toneClass(axis.status)}`}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
        {axis.axis}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="font-black">{axis.status}</span>
        <span className="font-black tabular-nums">{axis.value}/100</span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-snug opacity-85">
        {axis.reasons[0]}
      </p>
    </div>
  );
}

export default function RiskRadarChart({
  extractedClaims,
  redFlags,
  greenFlags,
  evidence,
  verdict,
  intelligence,
}: RiskRadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const axisDetails = useMemo(() => {
    const signals = intelligence?.signals || [];
    const coverage = intelligence?.coverage || {};
    const redText = redFlags.join(" ").toLowerCase();
    const greenText = greenFlags.join(" ").toLowerCase();
    const allText = `${redText} ${greenText}`;

    // Company Legitimacy: starts safe, degrades if company is unknown or no evidence
    let companyScore = 25;
    const hasCompanyEvidence = evidence.some((e) => e.type === "Company Check");
    if (hasCompanyEvidence) companyScore = 15;
    if (extractedClaims.company.toLowerCase().includes("unknown"))
      companyScore = 85;
    if (redFlags.some((f) => f.toLowerCase().includes("company")))
      companyScore += 20;
    const companySignals = matchingSignals(signals, [
      "company",
      "startup_digital_footprint",
      "remote_digital_footprint",
    ]);
    const companyReasons: string[] = [];
    if (companySignals.some((signal) => signal.direction === "risk"))
      addUnique(
        companyReasons,
        "Company identity evidence raised a risk signal.",
      );
    if (companySignals.some((signal) => signal.direction === "trust"))
      addUnique(
        companyReasons,
        "Official or consistent company footprint lowered this dimension.",
      );
    if (coverage.company === "verified")
      addUnique(
        companyReasons,
        "Company coverage is verified by available evidence.",
      );
    if (coverage.company === "missing")
      addUnique(
        companyReasons,
        "Company coverage is missing or not directly verifiable.",
      );
    if (extractedClaims.company.toLowerCase().includes("unknown"))
      addUnique(
        companyReasons,
        "The company name could not be confidently identified.",
      );
    if (hasCompanyEvidence)
      addUnique(companyReasons, "Company evidence receipts were found.");

    // Reputation: starts safe, increases with negative signals
    let reputationScore = 20;
    if (
      redFlags.some(
        (f) =>
          f.toLowerCase().includes("reputation") ||
          f.toLowerCase().includes("scam"),
      )
    )
      reputationScore = 80;
    if (
      greenFlags.some(
        (f) =>
          f.toLowerCase().includes("verified") ||
          f.toLowerCase().includes("presence"),
      )
    )
      reputationScore -= 15;
    const newsEvidence = evidence.filter((e) => e.type === "News & Reputation");
    if (newsEvidence.length > 0) reputationScore -= 10;
    const reputationSignals = matchingSignals(signals, [
      "reputation",
      "weak_source",
      "stale_evidence",
    ]);
    const reputationReasons: string[] = [];
    if (reputationSignals.some((signal) => signal.direction === "risk"))
      addUnique(
        reputationReasons,
        "Reputation evidence contains a risk signal.",
      );
    if (includesAny(redText, ["scam", "reputation"]))
      addUnique(
        reputationReasons,
        "The report found scam or reputation-related red flags.",
      );
    if (newsEvidence.length > 0)
      addUnique(
        reputationReasons,
        "News and reputation receipts were available for review.",
      );
    if (includesAny(greenText, ["verified", "presence"]))
      addUnique(
        reputationReasons,
        "Verified presence signals lowered reputation concern.",
      );

    // Salary Realism: starts safe, increases if unrealistic
    let salaryScore = 20;
    const sal = extractedClaims.salary.toLowerCase();
    if (
      sal.includes("80,000") ||
      sal.includes("80000") ||
      sal.includes("100,000")
    )
      salaryScore = 90;
    if (
      redFlags.some(
        (f) =>
          f.toLowerCase().includes("salary") ||
          f.toLowerCase().includes("unrealistic"),
      )
    )
      salaryScore += 25;
    if (sal.includes("week") || sal.includes("/week")) salaryScore += 20;
    if (
      greenFlags.some(
        (f) =>
          f.toLowerCase().includes("salary") ||
          f.toLowerCase().includes("standard"),
      )
    )
      salaryScore -= 20;
    const salarySignals = matchingSignals(signals, ["salary", "market"]);
    const salaryReasons: string[] = [];
    if (salarySignals.some((signal) => signal.direction === "risk"))
      addUnique(
        salaryReasons,
        "Claimed compensation is outside normal market signals.",
      );
    if (salarySignals.some((signal) => signal.direction === "trust"))
      addUnique(
        salaryReasons,
        "Comparable market jobs or standard salary format lowered concern.",
      );
    if (includesAny(sal, ["week", "/week"]))
      addUnique(
        salaryReasons,
        "Weekly pay wording increases scrutiny because scams often use unusual pay framing.",
      );
    if (includesAny(redText, ["salary", "unrealistic"]))
      addUnique(
        salaryReasons,
        "Salary-related red flags were found in the audit.",
      );
    if (includesAny(greenText, ["salary", "standard"]))
      addUnique(
        salaryReasons,
        "Salary wording looked more standard than suspicious.",
      );

    // Local Presence: starts moderate, improves with evidence
    let localScore = 40;
    const localEvidence = evidence.filter((e) => e.type === "Local Presence");
    if (localEvidence.length > 0) localScore = 15;
    if (redFlags.some((f) => f.toLowerCase().includes("local")))
      localScore = 75;
    if (extractedClaims.location.toLowerCase().includes("unknown"))
      localScore += 20;
    const localSignals = matchingSignals(signals, ["local", "location"]);
    const localReasons: string[] = [];
    if (localSignals.some((signal) => signal.id.includes("not_required")))
      addUnique(
        localReasons,
        "Local footprint is less decisive for this remote-company profile.",
      );
    if (localSignals.some((signal) => signal.direction === "risk"))
      addUnique(
        localReasons,
        "No matching local footprint was found for the claimed location.",
      );
    if (localSignals.some((signal) => signal.direction === "trust"))
      addUnique(
        localReasons,
        "Verified local footprint lowered this dimension.",
      );
    if (coverage.local === "verified")
      addUnique(localReasons, "Local presence coverage is verified.");
    if (localEvidence.length > 0)
      addUnique(localReasons, "Local presence receipts were found.");
    if (extractedClaims.location.toLowerCase().includes("unknown"))
      addUnique(
        localReasons,
        "The location could not be confidently identified.",
      );

    // Contact Safety: starts safe, gets risky with Telegram/WhatsApp
    let contactScore = 15;
    const cm = extractedClaims.contactMethod.toLowerCase();
    if (cm.includes("telegram")) contactScore = 85;
    if (cm.includes("whatsapp")) contactScore = 70;
    if (cm.includes("linkedin") || cm.includes("email")) contactScore = 10;
    if (redFlags.some((f) => f.toLowerCase().includes("interview")))
      contactScore += 15;
    const contactSignals = matchingSignals(signals, [
      "contact",
      "apply_path",
      "recruiter",
      "interview",
    ]);
    const contactReasons: string[] = [];
    if (contactSignals.some((signal) => signal.direction === "risk"))
      addUnique(
        contactReasons,
        "Contact or application path evidence raised a risk signal.",
      );
    if (contactSignals.some((signal) => signal.direction === "trust"))
      addUnique(
        contactReasons,
        "Professional recruiter or application-path signals lowered concern.",
      );
    if (includesAny(cm, ["telegram", "whatsapp"]))
      addUnique(
        contactReasons,
        "Off-platform messaging is a common job scam pattern.",
      );
    if (includesAny(cm, ["linkedin", "email"]))
      addUnique(
        contactReasons,
        "A recognizable professional contact path lowered concern.",
      );
    if (includesAny(allText, ["no interview", "interview"]))
      addUnique(
        contactReasons,
        "Interview-process wording affected this score.",
      );

    return [
      buildAxisDetail(
        "company",
        "Company",
        companyScore,
        "Company identity and official footprint checks.",
        companyReasons,
        companySignals,
      ),
      buildAxisDetail(
        "reputation",
        "Reputation",
        reputationScore,
        "Public reputation, scam mentions, and source quality.",
        reputationReasons,
        reputationSignals,
      ),
      buildAxisDetail(
        "salary",
        "Salary",
        salaryScore,
        "Compensation realism against role, market, and wording.",
        salaryReasons,
        salarySignals,
      ),
      buildAxisDetail(
        "local",
        "Local Presence",
        localScore,
        "Location footprint and local business evidence.",
        localReasons,
        localSignals,
      ),
      buildAxisDetail(
        "contact",
        "Contact Safety",
        contactScore,
        "Recruiter contact method and application path safety.",
        contactReasons,
        contactSignals,
      ),
    ];
  }, [evidence, extractedClaims, greenFlags, intelligence, redFlags]);

  const [activeKey, setActiveKey] = useState<AxisKey | null>(null);
  const data = axisDetails.map((item) => ({
    ...item,
    activeValue: item.key === activeKey ? item.value : 0,
  }));
  const chartHeight = chartWidth >= 640 ? 320 : 280;

  useEffect(() => {
    if (!chartRef.current) return;

    const updateWidth = () => {
      const width = chartRef.current?.getBoundingClientRect().width || 0;
      setChartWidth(Math.max(0, Math.floor(width)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(chartRef.current);

    return () => observer.disconnect();
  }, []);

  const fillColor =
    verdict === "safe"
      ? "var(--hireproof-safe)"
      : verdict === "caution"
        ? "var(--hireproof-caution)"
        : "var(--hireproof-risk)";
  const strokeColor =
    verdict === "safe"
      ? "var(--hireproof-safe-text)"
      : verdict === "caution"
        ? "var(--hireproof-caution-text)"
        : "var(--hireproof-risk-text)";

  return (
    <div className="max-w-100 min-w-full relative rounded-4xl border border-border-soft bg-background/45 p-4 pt-14 sm:p-6">
      <div
        aria-label="Risk score legend"
        className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2 rounded-full border border-border-soft bg-surface/90 px-3 py-2 shadow-sm backdrop-blur sm:right-6 sm:top-5"
      >
        {[
          { label: "Low", className: "bg-safe-text" },
          { label: "Caution", className: "bg-caution-text" },
          { label: "High", className: "bg-risk-text" },
        ].map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-muted"
          >
            <span className={`h-2 w-2 rounded-full ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>
      <div
        ref={chartRef}
        className="h-70 min-h-70 min-w-0 w-full sm:h-80 sm:min-h-80"
        aria-label={`Risk breakdown radar chart. ${axisDetails.map((axis) => `${axis.axis}: ${axis.status}, ${axis.value} out of 100`).join(". ")}`}
      >
        {chartWidth > 0 && (
          <RadarChart
            width={chartWidth}
            height={chartHeight}
            cx="50%"
            cy="50%"
            outerRadius="72%"
            data={data}
            onMouseLeave={() => setActiveKey(null)}
          >
            <PolarGrid
              stroke="var(--hireproof-border, #cbd5c7)"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={(props: any) => {
                const { x, y, payload } = props;
                const item = data.find((axis) => axis.axis === payload.value);
                const active = item?.key === activeKey;
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={
                      active && item
                        ? statusColor(item.status)
                        : "var(--hireproof-muted, #475569)"
                    }
                    fontSize={active ? 12 : 11}
                    fontWeight={active ? 900 : 700}
                    className="cursor-pointer outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label={
                      item
                        ? `${item.axis}: ${item.status}, ${item.value} out of 100`
                        : payload.value
                    }
                    onMouseEnter={() => item && setActiveKey(item.key)}
                    onFocus={() => item && setActiveKey(item.key)}
                    onClick={() => item && setActiveKey(item.key)}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <Radar
              name="Risk"
              dataKey="value"
              stroke={strokeColor}
              fill={fillColor}
              fillOpacity={0.24}
              strokeWidth={2}
            />
            {activeKey && (
              <Radar
                name="Selected dimension"
                dataKey="activeValue"
                stroke={strokeColor}
                fill={fillColor}
                fillOpacity={0.5}
                strokeWidth={3}
              />
            )}
            <Tooltip content={<RiskNodeTooltip />} cursor={false} />
          </RadarChart>
        )}
      </div>
    </div>
  );
}
