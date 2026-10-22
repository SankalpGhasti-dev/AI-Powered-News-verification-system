
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const STORAGE_KEY = "veritaslens_claim_ledger_v4";
const MAX_LEDGER_ITEMS = 50;

const CASE_REPOSITORIES = {
  "inflation-metric": {
    caseId: "INV-2026-0618",
    headline: "Infographic alleging Central Bank confirmed 35% single-month inflation surge",
    category: "Economics · Monetary Policy",
    determination: "CONTRADICTED",
    score: 18,
    ratingLabel: "Fabricated / Heavily Refuted",
    verdictClass: "verdict-contradicted",
    benchmarkClass: "fill-false",
    confidence: "High Confidence (Fact-Check Refuted)",
    benchmarkNote: "Contradicted by registered fact-checks; official CPI reported at 3.2%",
    disclaimer: "This score measures the extent to which claims are corroborated or contradicted by currently retrieved public records, wire reports, and verified fact-checks.",
    explanation: "Statistical bulletins from the National Statistics Bureau and registered wire fact-checks confirm that headline consumer price inflation was 3.2% year-over-year. The viral infographic isolated an annualized spot wholesale energy contract fluctuation and mispresented it as aggregate headline consumer inflation.",
    keyFindings: [
      "1 claim directly contradicted by registered fact-check records.",
      "National Statistics Bureau releases confirm headline CPI was 3.2%, not 35%."
    ],
    evidenceSynthesis: "Independent fact-check records from PolitiFact and reporting from Reuters confirm official central banking transcripts reflect price stability rather than an emergency crisis.",
    limitations: [
      "Evaluation is grounded in open public wire reporting and registered fact-check databases.",
      "Wholesale spot energy volatility does not reflect aggregate consumer price index baskets."
    ],
    claims: [
      {
        id: "CLM-01",
        text: "Headline consumer inflation reached 35% in recent month.",
        verdict: "Contradicted",
        statusClass: "status-contradicted",
        finding: "National Statistics Bureau release confirms national headline consumer price index was 3.2% year-over-year.",
        supporting: [],
        contradicting: ["EVD-01"]
      },
      {
        id: "CLM-02",
        text: "Official Central Bank bulletin declared economic crisis threshold breached.",
        verdict: "Contradicted",
        statusClass: "status-contradicted",
        finding: "Monetary Policy Committee meeting records document stable baseline inflation expectations.",
        supporting: [],
        contradicting: ["EVD-02"]
      }
    ],
    evidence: [
      {
        id: "EVD-01",
        source: "PolitiFact Fact-Check Desk",
        type: "Fact-Check",
        rating: "Rating: False",
        title: "Fact Check: Central Bank did not announce 35% inflation surge",
        snippet: "National records confirm headline inflation adjusted by 0.3% month-over-month. The 35% claim misattributes a short-term wholesale gas contract anomaly.",
        url: "https://www.politifact.com/factchecks/rates-claim"
      },
      {
        id: "EVD-02",
        source: "Reuters Business Wire",
        type: "News Reporting",
        rating: null,
        title: "Central Bank maintains medium-term price targets in monthly bulletin",
        snippet: "On-the-record briefing confirmed headline indices stabilized at 3.2% year-over-year with anchored expectations.",
        url: "https://reuters.com/article/inflation-data"
      }
    ],
    metrics: { total: 2, supported: 0, contradicted: 2, mixed: 0, insufficient: 0, sources: 2 },
    signals: {
      tier: "2 Independent Source Records",
      artifacts: "Coverage: 100% Evaluated",
      archive: "INV-2026-0618"
    }
  },

  "antimicrobial-approval": {
    caseId: "INV-2026-0744",
    headline: "European Medicines Agency authorizes next-generation antimicrobial therapy for critical hospital care",
    category: "Public Health · Regulatory Approvals",
    determination: "SUPPORTED",
    score: 92,
    ratingLabel: "High Credibility / Well-Corroborated",
    verdictClass: "verdict-supported",
    benchmarkClass: "fill-true",
    confidence: "High Confidence (Regulatory Corroboration)",
    benchmarkNote: "Corroborated by official regulatory registry and accredited wire dispatches",
    disclaimer: "This score measures the extent to which claims are corroborated or contradicted by currently retrieved public records, wire reports, and verified fact-checks.",
    explanation: "Official procedure documents from the European Medicines Agency and accredited reporting from Reuters confirm authorized marketing approval for the antimicrobial compound following multi-center clinical trials.",
    keyFindings: [
      "2 claims substantiated by official agency records and health wire reporting.",
      "Regulatory approval index confirmed under procedure EMEA/H/C/005821."
    ],
    evidenceSynthesis: "Independent reports from Reuters and the official European Medicines Agency EPAR database corroborate the clinical authorization and hospital rollout schedule.",
    limitations: [
      "Clinical authorization applies specifically to inpatient hospital settings under specialist guidance."
    ],
    claims: [
      {
        id: "CLM-01",
        text: "European Medicines Agency authorized next-generation antimicrobial therapy.",
        verdict: "Supported",
        statusClass: "status-supported",
        finding: "Authorized marketing approval indexed under official procedure EMEA/H/C/005821.",
        supporting: ["EVD-01", "EVD-02"],
        contradicting: []
      },
      {
        id: "CLM-02",
        text: "Therapy approved for critical hospital care following multi-country clinical review.",
        verdict: "Supported",
        statusClass: "status-supported",
        finding: "Peer-reviewed multi-country clinical study results confirmed by health wire despatches.",
        supporting: ["EVD-02"],
        contradicting: []
      }
    ],
    evidence: [
      {
        id: "EVD-01",
        source: "European Medicines Agency Public Register",
        type: "Official Register",
        rating: "Approved",
        title: "EPAR Summary for Public: Marketing authorization procedure EMEA/H/C/005821",
        snippet: "European regulatory authorities authorized treatment protocol following committee review.",
        url: "https://www.ema.europa.eu/en/medicines"
      },
      {
        id: "EVD-02",
        source: "Reuters Health News Desk",
        type: "News Reporting",
        rating: null,
        title: "EMA gives green light to new antibiotic for hospital infections",
        snippet: "Healthcare correspondents report regulator cleared therapy for critical inpatient usage.",
        url: "https://reuters.com/business/healthcare-pharmaceuticals"
      }
    ],
    metrics: { total: 2, supported: 2, contradicted: 0, mixed: 0, insufficient: 0, sources: 2 },
    signals: {
      tier: "2 Official & Wire Records",
      artifacts: "Coverage: 100% Evaluated",
      archive: "INV-2026-0744"
    }
  },

  "high-speed-rail": {
    caseId: "INV-2026-0835",
    headline: "Government ministry announces approved funding for 450km regional high-speed rail line",
    category: "Infrastructure · Public Policy",
    determination: "MIXED",
    score: 52,
    ratingLabel: "Moderate Credibility / Partially Supported",
    verdictClass: "verdict-mixed",
    benchmarkClass: "fill-misleading",
    confidence: "Moderate Confidence (Disputed Timeline)",
    benchmarkNote: "Route feasibility confirmed; capital expenditure and timeline disputed by Treasury",
    disclaimer: "This score measures the extent to which claims are corroborated or contradicted by currently retrieved public records, wire reports, and verified fact-checks.",
    explanation: "While transport officials confirmed corridor feasibility studies for the regional line, official treasury gazettes and independent wire reporting confirm no capital construction appropriation has been approved for the upcoming fiscal cycle.",
    keyFindings: [
      "Corridor planning is genuine and corroborated by transport ministry filings.",
      "Funding claims are premature; Treasury documents show no capital appropriation."
    ],
    evidenceSynthesis: "Reporting reveals conflicting status: feasibility planning is verified, but capital budget claims are refuted by treasury budget releases.",
    limitations: [
      "Legislative appropriations may be revisited in future fiscal sessions."
    ],
    claims: [
      {
        id: "CLM-01",
        text: "Ministry confirmed corridor route planning for 450km regional rail link.",
        verdict: "Supported",
        statusClass: "status-supported",
        finding: "Ministry feasibility study confirmed route corridor planning.",
        supporting: ["EVD-01"],
        contradicting: []
      },
      {
        id: "CLM-02",
        text: "Full capital funding approved for construction start next quarter.",
        verdict: "Contradicted",
        statusClass: "status-contradicted",
        finding: "Treasury budget gazette confirms capital appropriation remains pending legislative debate.",
        supporting: [],
        contradicting: ["EVD-02"]
      }
    ],
    evidence: [
      {
        id: "EVD-01",
        source: "Associated Press Transportation Wire",
        type: "News Reporting",
        rating: null,
        title: "Transport Ministry details regional rail corridor alignment",
        snippet: "Planning documents outline 450km preliminary routing connecting provincial hubs.",
        url: "https://apnews.com/hub/transportation"
      },
      {
        id: "EVD-02",
        source: "National Fact Check Wire",
        type: "Fact-Check",
        rating: "Rating: Needs Context",
        title: "Fact Check: Rail corridor route approved, but construction funding is not allocated",
        snippet: "Treasury registers confirm project has not received capital funding authorization.",
        url: "https://factcheck.org/rail-funding"
      }
    ],
    metrics: { total: 2, supported: 1, contradicted: 1, mixed: 1, insufficient: 0, sources: 2 },
    signals: {
      tier: "2 Corroborating & Disputing Records",
      artifacts: "Coverage: 100% Evaluated",
      archive: "INV-2026-0835"
    }
  },

  "power-mandate": {
    caseId: "INV-2026-0924",
    headline: "Viral social media post claims Energy Ministry ordered mandatory 40% industrial power cuts",
    category: "Energy & Industry · Viral Rumor",
    determination: "INSUFFICIENT EVIDENCE",
    score: 50,
    ratingLabel: "Unverified / Insufficient Documentation",
    verdictClass: "verdict-insufficient",
    benchmarkClass: "fill-misleading",
    confidence: "Low Confidence (Unverified)",
    benchmarkNote: "No public record, statutory instrument, or wire report substantiates claim",
    disclaimer: "This score measures the extent to which claims are corroborated or contradicted by currently retrieved public records, wire reports, and verified fact-checks.",
    explanation: "Searches of government gazettes, department records, and international news wire archives revealed zero documentation substantiating an industrial power restriction decree. Because no authoritative public records exist, this claim is unverified.",
    keyFindings: [
      "No official decrees or wire despatches substantiate the assertion.",
      "Grid operators and industry councils report no knowledge of directives."
    ],
    evidenceSynthesis: "Exhaustive cross-referencing across public wire archives yielded zero corroborating records. Lack of public documentation maintains an unverified neutral baseline.",
    limitations: [
      "Absence of public evidence does not prove an absolute negative, but confirms the claim is completely uncorroborated."
    ],
    claims: [
      {
        id: "CLM-01",
        text: "Energy Ministry issued mandatory 40% industrial power restriction order.",
        verdict: "Insufficient Evidence",
        statusClass: "status-insufficient",
        finding: "No official decree, statutory instrument, or gazette publication exists in public archives.",
        supporting: [],
        contradicting: []
      },
      {
        id: "CLM-02",
        text: "Industrial restrictions scheduled to begin next month across national manufacturing sectors.",
        verdict: "Insufficient Evidence",
        statusClass: "status-insufficient",
        finding: "Industry associations and regulatory boards have received no notice or statutory briefing.",
        supporting: [],
        contradicting: []
      }
    ],
    evidence: [],
    metrics: { total: 2, supported: 0, contradicted: 0, mixed: 0, insufficient: 2, sources: 0 },
    signals: {
      tier: "0 Authoritative Wire Records Found",
      artifacts: "Coverage: 0% Corroborated",
      archive: "INV-2026-0924"
    }
  }
};

const form = document.querySelector("#verify-form");
const newsInput = document.querySelector("#news");
const analyzeButton = document.querySelector("#analyze-button");
const loadingCard = document.querySelector("#loading");
const resultCard = document.querySelector("#result");
const errorMessage = document.querySelector("#input-error");
const characterCount = document.querySelector("#char-count");
const menuToggle = document.querySelector("#menu-toggle");
const primaryNav = document.querySelector("#primary-nav");
const historyTableBody = document.querySelector("#history-table-body");
const historyEmpty = document.querySelector("#history-empty");
const storageNote = document.querySelector("#storage-note");
const searchInput = document.querySelector("#history-search");
const verdictFilter = document.querySelector("#verdict-filter");
const clearHistoryBtn = document.querySelector("#clear-history");
const copyReportBtn = document.querySelector("#copy-report");
const downloadReportBtn = document.querySelector("#download-report");
const copyStatusMsg = document.querySelector("#copy-status");
const resetWorkbenchBtn = document.querySelector("#another-analysis");
const THEME_STORAGE_KEY = "veritaslens_theme";

function getPreferredTheme() {
  return "light";
}

function applyTheme(theme, animate = false) {
  document.documentElement.setAttribute("data-theme", "light");
  const metaThemeColor = document.querySelector('meta[name="theme-color"]') || document.querySelector("#meta-theme-color");
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", "#F7F5F0");
  }
}

function toggleTheme() {
  applyTheme("light", false);
}

function initTheme() {
  applyTheme("light", false);
}

let activeCaseKey = null;
let currentDossier = null;
let ledgerHistory = loadLedger();

function loadLedger() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialSeed = [
        createDossierFromRepo("inflation-metric", new Date(Date.now() - 3600000 * 3).toISOString()),
        createDossierFromRepo("antimicrobial-approval", new Date(Date.now() - 3600000 * 8).toISOString()),
        createDossierFromRepo("high-speed-rail", new Date(Date.now() - 3600000 * 24).toISOString()),
        createDossierFromRepo("power-mandate", new Date(Date.now() - 3600000 * 48).toISOString())
      ].filter(Boolean);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed));
      return initialSeed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (storageNote) {
      storageNote.textContent = "Local browser storage unavailable; session history held in temporary memory.";
    }
    return [];
  }
}

function persistLedger() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgerHistory));
  } catch (err) {
    console.warn("Storage write error", err);
  }
}

function createDossierFromRepo(key, customTimestamp) {
  const repo = CASE_REPOSITORIES[key];
  if (!repo) return null;
  return {
    id: repo.caseId,
    timestamp: customTimestamp || new Date().toISOString(),
    headline: repo.headline,
    category: repo.category,
    determination: repo.determination,
    score: repo.score,
    ratingLabel: repo.ratingLabel,
    verdictClass: repo.verdictClass,
    benchmarkClass: repo.benchmarkClass,
    confidence: repo.confidence,
    benchmarkNote: repo.benchmarkNote,
    disclaimer: repo.disclaimer,
    explanation: repo.explanation,
    keyFindings: repo.keyFindings || [],
    evidenceSynthesis: repo.evidenceSynthesis || "",
    limitations: repo.limitations || [],
    claims: [...repo.claims],
    evidence: [...repo.evidence],
    metrics: { ...repo.metrics },
    signals: { ...repo.signals }
  };
}

function normalizeBackendReportToDossier(report) {
  const scoreObj = report.credibility_score || {};
  const scoreVal = scoreObj.score !== undefined ? scoreObj.score : 50;
  const ratingLabel = scoreObj.rating_label || "Evaluated";
  const confidence = scoreObj.confidence || "Moderate";
  const disclaimer = scoreObj.disclaimer || "Evidence-based verification score.";

  let verdictClass = "verdict-insufficient";
  let benchmarkClass = "fill-misleading";

  if (scoreVal >= 75) {
    verdictClass = "verdict-supported";
    benchmarkClass = "fill-true";
  } else if (scoreVal <= 35) {
    verdictClass = "verdict-contradicted";
    benchmarkClass = "fill-false";
  } else if (report.metrics && report.metrics.mixed_claims > 0) {
    verdictClass = "verdict-mixed";
    benchmarkClass = "fill-misleading";
  }

  const normalizedClaims = (report.claims || []).map((c) => {
    let sClass = "status-insufficient";
    if (c.verdict === "Supported") sClass = "status-supported";
    else if (c.verdict === "Contradicted") sClass = "status-contradicted";
    else if (c.verdict === "Mixed") sClass = "status-mixed";

    return {
      id: c.claim_id,
      text: c.claim_text,
      verdict: c.verdict,
      status: c.verdict,
      statusClass: sClass,
      finding: c.verdict_rationale,
      supporting: c.supporting_evidence_ids || [],
      contradicting: c.contradicting_evidence_ids || []
    };
  });

  const normalizedEvidence = (report.evidence || []).map((e) => ({
    id: e.id,
    source: e.source_name,
    type: e.source_type === "fact_check" ? "Fact-Check" : "News Reporting",
    title: e.title,
    snippet: e.snippet,
    rating: e.review_rating ? `Rating: ${e.review_rating}` : null,
    url: e.url,
    archive: e.url
  }));

  const metrics = report.metrics || {
    total_claims: normalizedClaims.length,
    supported_claims: 0,
    contradicted_claims: 0,
    mixed_claims: 0,
    insufficient_evidence_claims: normalizedClaims.length,
    sources_consulted: normalizedEvidence.length
  };

  return {
    id: report.investigation_id,
    timestamp: report.timestamp,
    headline: report.article?.title || "Evaluated Claim / Article",
    url: report.article?.url,
    category: report.input_type === "url" ? "Web Article Investigation" : "Pasted Statement Analysis",
    determination: ratingLabel.toUpperCase(),
    score: scoreVal,
    ratingLabel: ratingLabel,
    verdictClass: verdictClass,
    benchmarkClass: benchmarkClass,
    confidence: `${confidence} Confidence`,
    benchmarkNote: `${metrics.sources_consulted} sources consulted · ${metrics.supported_claims} supported · ${metrics.contradicted_claims} contradicted`,
    disclaimer: disclaimer,
    explanation: report.explanation?.summary || "",
    keyFindings: report.explanation?.key_findings || [],
    evidenceSynthesis: report.explanation?.evidence_synthesis || "",
    limitations: report.limitations || report.explanation?.limitations || [],
    claims: normalizedClaims,
    evidence: normalizedEvidence,
    metrics: metrics,
    signals: {
      tier: `${metrics.sources_consulted} Sources Consulted`,
      artifacts: `Coverage: ${scoreObj.formula_breakdown?.coverage_ratio ? Math.round(scoreObj.formula_breakdown.coverage_ratio * 100) : 100}%`,
      archive: report.investigation_id
    }
  };
}

function formatDateDisplay(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recent";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(d);
  } catch {
    return "Recent";
  }
}

function renderDossier(dossier) {
  if (!resultCard) return;
  currentDossier = dossier;

  const caseIdEl = document.querySelector("#case-id");
  if (caseIdEl) caseIdEl.textContent = dossier.id;

  const timeElem = document.querySelector("#analysis-time");
  if (timeElem) {
    timeElem.textContent = formatDateDisplay(dossier.timestamp);
    timeElem.dateTime = dossier.timestamp;
  }

  const quoteElem = document.querySelector("#evaluated-claim");
  if (quoteElem) {
    quoteElem.textContent = `“${dossier.headline}”`;
  }

  const verdictElem = document.querySelector("#verdict");
  if (verdictElem) {
    verdictElem.textContent = dossier.determination;
    verdictElem.className = `verdict-status-badge ${dossier.verdictClass}`;
  }

  const expEl = document.querySelector("#explanation");
  if (expEl) {
    expEl.innerHTML = "";
    
    const pSummary = document.createElement("p");
    pSummary.className = "summary-body";
    pSummary.textContent = dossier.explanation;
    expEl.appendChild(pSummary);

    if (dossier.keyFindings && dossier.keyFindings.length > 0) {
      const hFindings = document.createElement("h4");
      hFindings.style.cssText = "font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; margin: 14px 0 6px; color: var(--text-primary);";
      hFindings.textContent = "Key Takeaways:";
      expEl.appendChild(hFindings);

      const ulFindings = document.createElement("ul");
      ulFindings.className = "findings-list";
      dossier.keyFindings.forEach((kf) => {
        const li = document.createElement("li");
        li.textContent = kf;
        ulFindings.appendChild(li);
      });
      expEl.appendChild(ulFindings);
    }

    if (dossier.evidenceSynthesis) {
      const pSynthesis = document.createElement("p");
      pSynthesis.style.cssText = "font-size: 13.5px; line-height: 1.6; margin-top: 12px; color: var(--text-secondary);";
      pSynthesis.textContent = dossier.evidenceSynthesis;
      expEl.appendChild(pSynthesis);
    }

    if (dossier.limitations && dossier.limitations.length > 0) {
      const hLimits = document.createElement("h4");
      hLimits.style.cssText = "font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; margin: 14px 0 6px; color: var(--text-muted);";
      hLimits.textContent = "Evidentiary Scope & Boundaries:";
      expEl.appendChild(hLimits);

      const ulLimits = document.createElement("ul");
      ulLimits.className = "limitations-list";
      dossier.limitations.forEach((lim) => {
        const li = document.createElement("li");
        li.textContent = lim;
        ulLimits.appendChild(li);
      });
      expEl.appendChild(ulLimits);
    }
  }

  const confEl = document.querySelector("#confidence-value");
  if (confEl) {
    const scoreText = dossier.score !== undefined ? `${dossier.score}/100` : "";
    confEl.textContent = scoreText ? `${scoreText} · ${dossier.confidence}` : dossier.confidence;
  }

  const bar = document.querySelector("#confidence-bar");
  if (bar) {
    const widthPct = dossier.score !== undefined ? Math.max(5, Math.min(100, dossier.score)) : 90;
    bar.style.width = `${widthPct}%`;
    bar.className = `consensus-fill ${dossier.benchmarkClass}`;
  }

  const benchEl = document.querySelector("#corroboration-benchmark");
  if (benchEl) benchEl.textContent = dossier.benchmarkNote;

  const claimsContainer = document.querySelector("#claim-breakdown");
  if (claimsContainer) {
    claimsContainer.innerHTML = "";
    if (dossier.claims.length === 0) {
      claimsContainer.innerHTML = '<li class="claim-item"><p class="claim-finding">No discrete factual assertions identified.</p></li>';
    } else {
      dossier.claims.forEach((claim) => {
        const li = document.createElement("li");
        li.className = "claim-item";

        let citedBadges = "";
        if (claim.supporting && claim.supporting.length > 0) {
          citedBadges += `<span class="evidence-type-badge" style="background: var(--verdict-green-bg); color: var(--verdict-green-text);">Corroborated by ${claim.supporting.join(", ")}</span>`;
        }
        if (claim.contradicting && claim.contradicting.length > 0) {
          citedBadges += `<span class="evidence-type-badge" style="background: var(--verdict-red-bg); color: var(--verdict-red-text);">Disputed by ${claim.contradicting.join(", ")}</span>`;
        }

        li.innerHTML = `
          <div class="claim-item-top">
            <span class="claim-id">${escapeHtml(claim.id)}</span>
            <span class="claim-status-badge ${claim.statusClass || 'status-insufficient'}">${escapeHtml(claim.verdict || claim.status)}</span>
          </div>
          <p class="claim-text">${escapeHtml(claim.text)}</p>
          <p class="claim-finding">${escapeHtml(claim.finding)}</p>
          ${citedBadges ? `<div class="evidence-tag-row">${citedBadges}</div>` : ""}
        `;
        claimsContainer.appendChild(li);
      });
    }
  }

  const evidenceContainer = document.querySelector("#evidence-list");
  if (evidenceContainer) {
    evidenceContainer.innerHTML = "";
    if (dossier.evidence.length === 0) {
      evidenceContainer.innerHTML = `
        <div class="evidence-card" style="padding: 16px 0;">
          <p class="evidence-finding" style="color: var(--text-muted); font-style: italic;">
            Zero corroborating wire dispatches or registered fact-checks found in examined public archives.
          </p>
        </div>
      `;
    } else {
      dossier.evidence.forEach((ev) => {
        const card = document.createElement("div");
        card.className = "evidence-card";

        const isFactCheck = (ev.type || "").toLowerCase().includes("fact");
        const typeClass = isFactCheck ? "type-factcheck" : "";
        const ratingHtml = ev.rating ? `<span class="evidence-rating-badge ${ev.rating.toLowerCase().includes('false') ? 'rating-false' : ''}">${escapeHtml(ev.rating)}</span>` : "";

        let linkHtml = "";
        if (ev.url && ev.url.startsWith("http")) {
          linkHtml = `
            <a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener noreferrer" class="evidence-safe-link">
              <span>Inspect Source Record</span>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          `;
        } else {
          linkHtml = `<span class="evidence-archive-link">${escapeHtml(ev.archive || "Archived Record")}</span>`;
        }

        card.innerHTML = `
          <div class="evidence-header">
            <span class="evidence-source">${escapeHtml(ev.source)}</span>
            <div class="evidence-tag-row">
              <span class="evidence-type-badge ${typeClass}">${escapeHtml(ev.type || "Documented Record")}</span>
              ${ratingHtml}
            </div>
          </div>
          ${ev.title ? `<p class="evidence-source-title" style="font-size: 13px; font-weight: 600; margin-top: 4px; color: var(--text-primary);">${escapeHtml(ev.title)}</p>` : ""}
          <p class="evidence-finding">${escapeHtml(ev.snippet || ev.finding)}</p>
          ${linkHtml}
        `;
        evidenceContainer.appendChild(card);
      });
    }
  }

  const sTier = document.querySelector("#signal-tier");
  const sArt = document.querySelector("#signal-artifacts");
  const sArc = document.querySelector("#signal-archive");
  if (sTier) sTier.textContent = dossier.signals?.tier || `${dossier.evidence.length} Sources Consulted`;
  if (sArt) sArt.textContent = dossier.signals?.artifacts || "Evaluated by TruthLens Engine";
  if (sArc) sArc.textContent = dossier.signals?.archive || dossier.id;

  resultCard.hidden = false;
  if (copyStatusMsg) copyStatusMsg.textContent = "";
}

function renderLedger() {
  let countSupported = 0;
  let countContradicted = 0;
  let countMixedOrUnverified = 0;

  ledgerHistory.forEach((item) => {
    const det = (item.determination || "").toUpperCase();
    if (det.includes("SUPPORTED") || det.includes("AUTHENTIC") || det.includes("TRUE")) {
      countSupported++;
    } else if (det.includes("CONTRADICTED") || det.includes("FALSE") || det.includes("FABRICATED")) {
      countContradicted++;
    } else {
      countMixedOrUnverified++;
    }
  });

  const statTotal = document.querySelector("#stat-total");
  const statTrue = document.querySelector("#stat-true");
  const statFalse = document.querySelector("#stat-false");
  const statMisleading = document.querySelector("#stat-misleading");

  if (statTotal) statTotal.textContent = String(ledgerHistory.length);
  if (statTrue) statTrue.textContent = String(countSupported);
  if (statFalse) statFalse.textContent = String(countContradicted);
  if (statMisleading) statMisleading.textContent = String(countMixedOrUnverified);

  if (!historyTableBody) return;

  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
  const filter = (verdictFilter ? verdictFilter.value : "all").toLowerCase();

  const filtered = ledgerHistory.filter((item) => {
    const det = (item.determination || "").toLowerCase();
    let matchVerdict = (filter === "all");
    if (!matchVerdict) {
      if (filter === "supported") matchVerdict = det.includes("supported") || det.includes("authentic");
      else if (filter === "contradicted") matchVerdict = det.includes("contradicted") || det.includes("false") || det.includes("fabricated");
      else if (filter === "mixed") matchVerdict = det.includes("mixed") || det.includes("context");
      else if (filter === "insufficient") matchVerdict = det.includes("insufficient") || det.includes("unverified");
    }

    const matchQuery = !query || 
      item.headline.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query) || 
      (item.explanation && item.explanation.toLowerCase().includes(query));
    return matchVerdict && matchQuery;
  });

  historyTableBody.innerHTML = "";

  if (filtered.length === 0) {
    if (historyEmpty) historyEmpty.hidden = false;
  } else {
    if (historyEmpty) historyEmpty.hidden = true;
    filtered.forEach((item) => {
      const tr = document.createElement("tr");

      let pillClass = "pill-insufficient";
      const det = (item.determination || "").toUpperCase();
      if (det.includes("SUPPORTED") || det.includes("AUTHENTIC")) pillClass = "pill-supported";
      else if (det.includes("CONTRADICTED") || det.includes("FALSE") || det.includes("FABRICATED")) pillClass = "pill-contradicted";
      else if (det.includes("MIXED") || det.includes("MISLEADING")) pillClass = "pill-mixed";

      tr.innerHTML = `
        <td><span class="table-case-id">${escapeHtml(item.id)}</span></td>
        <td><div class="table-headline" title="${escapeHtml(item.headline)}">${escapeHtml(item.headline)}</div></td>
        <td><span class="verdict-pill ${pillClass}">${escapeHtml(item.determination)}</span></td>
        <td><span class="table-timestamp">${formatDateDisplay(item.timestamp)}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" data-examine-id="${escapeHtml(item.id)}" type="button">
            Inspect
          </button>
        </td>
      `;
      historyTableBody.appendChild(tr);
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateCharCount() {
  if (!newsInput || !characterCount) return;
  const len = newsInput.value.length;
  characterCount.textContent = `${len.toLocaleString()} / 5,000`;
  if (errorMessage && newsInput.value.trim().length >= 12) {
    errorMessage.textContent = "";
  }
}

async function handleVerification(event) {
  if (event) event.preventDefault();
  const text = (newsInput ? newsInput.value : "").trim();

  if (!text) {
    if (errorMessage) errorMessage.textContent = "Please enter an article URL or statement text to verify.";
    if (newsInput) newsInput.focus();
    return;
  }

  const isUrl = /^https?:\/\/[^\s]+$/i.test(text);
  const input_type = isUrl ? "url" : "text";

  if (!isUrl && text.length < 15) {
    if (errorMessage) {
      errorMessage.textContent = `Statement is too brief (${text.length} chars). Please enter at least 15 characters, or provide a full article URL.`;
    }
    if (newsInput) newsInput.focus();
    return;
  }

  if (errorMessage) errorMessage.textContent = "";
  if (resultCard) resultCard.hidden = true;
  if (loadingCard) {
    loadingCard.hidden = false;
    const loadCopy = loadingCard.querySelector(".loading-copy");
    if (loadCopy) {
      loadCopy.innerHTML = isUrl
        ? "<strong>Fetching article & cross-referencing records...</strong><span>Extracting clean text, isolating factual claims with Gemini, and querying wire archives.</span>"
        : "<strong>Cross-referencing evidence...</strong><span>Deconstructing claims with Gemini, retrieving GNews and Google Fact Check records.</span>";
    }
  }
  if (analyzeButton) analyzeButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/investigations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        input_type: input_type,
        content: text
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.detail?.message || `Server responded with HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    const report = await response.json();
    const dossier = normalizeBackendReportToDossier(report);

    ledgerHistory = [dossier, ...ledgerHistory.filter(i => i.id !== dossier.id)].slice(0, MAX_LEDGER_ITEMS);
    persistLedger();

    renderDossier(dossier);
    renderLedger();

    if (resultCard) {
      resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

  } catch (err) {
    console.warn("Backend API request error:", err);

  // Fallback to sample case if matching
    let fallbackDossier = null;
    if (activeCaseKey && CASE_REPOSITORIES[activeCaseKey]) {
      fallbackDossier = createDossierFromRepo(activeCaseKey);
    } else {
      for (const [key, repo] of Object.entries(CASE_REPOSITORIES)) {
        if (repo.headline.toLowerCase() === text.toLowerCase()) {
          fallbackDossier = createDossierFromRepo(key);
          break;
        }
      }
    }

    if (fallbackDossier) {
      ledgerHistory = [fallbackDossier, ...ledgerHistory.filter(i => i.id !== fallbackDossier.id)].slice(0, MAX_LEDGER_ITEMS);
      persistLedger();
      renderDossier(fallbackDossier);
      renderLedger();
      if (resultCard) resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      if (errorMessage) {
        if (err.message && err.message.includes("Failed to fetch")) {
          errorMessage.innerHTML = "<strong>Backend Offline:</strong> Unable to connect to VeritasLens backend (http://127.0.0.1:8000). Start the server with <code>python -m uvicorn app.main:app --port 8000</code> or click one of the curated test cases below.";
        } else {
          errorMessage.textContent = `Investigation Error: ${err.message}`;
        }
      }
    }

  } finally {
    if (loadingCard) loadingCard.hidden = true;
    if (analyzeButton) analyzeButton.disabled = false;
  }
}

async function copyBrief() {
  if (!currentDossier) return;
  const lines = [
    `VERITASLENS INVESTIGATION REPORT [${currentDossier.id}]`,
    `VERDICT: ${currentDossier.determination}`,
    `CREDIBILITY SCORE: ${currentDossier.score !== undefined ? currentDossier.score + '/100' : 'N/A'} (${currentDossier.confidence})`,
    `DATE: ${formatDateDisplay(currentDossier.timestamp)}`,
    `CLAIM: "${currentDossier.headline}"`,
    `SUMMARY: ${currentDossier.explanation}`,
    `----------------------------------------`,
    `ATOMIC CLAIMS:`,
    ...currentDossier.claims.map(c => `• [${c.verdict || c.status}] ${c.text} — ${c.finding}`),
    `----------------------------------------`,
    `DOCUMENTED SOURCES & CITATIONS:`,
    ...(currentDossier.evidence.length > 0
      ? currentDossier.evidence.map(e => `• ${e.source} (${e.type}): ${e.title || e.snippet} [${e.url || e.archive}]`)
      : ["• No public records or wire dispatches identified."]),
    `----------------------------------------`,
    `DISCLAIMER: ${currentDossier.disclaimer || "Measures evidentiary corroboration in public records."}`
  ];

  const briefText = lines.join("\n");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(briefText);
      if (copyStatusMsg) copyStatusMsg.textContent = "Summary brief copied to clipboard.";
    } else {
      throw new Error("Fallback required");
    }
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = briefText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (copyStatusMsg) {
        copyStatusMsg.textContent = ok ? "Summary brief copied to clipboard." : "Brief prepared for manual copy.";
      }
    } catch {
      if (copyStatusMsg) copyStatusMsg.textContent = "Unable to write to clipboard.";
    }
  }
  setTimeout(() => { if (copyStatusMsg) copyStatusMsg.textContent = ""; }, 3500);
}

function downloadDossier() {
  if (!currentDossier) return;
  const mdContent = [
    `# VeritasLens Verification Report: ${currentDossier.id}`,
    ``,
    `**Recorded:** ${formatDateDisplay(currentDossier.timestamp)}  `,
    `**Verdict:** \`${currentDossier.determination}\`  `,
    `**Credibility Score:** \`${currentDossier.score !== undefined ? currentDossier.score + '/100' : 'N/A'}\` (${currentDossier.confidence})  `,
    `**Benchmark:** ${currentDossier.benchmarkNote}  `,
    ``,
    `## Claim / Article Evaluated`,
    `> "${currentDossier.headline}"`,
    currentDossier.url ? `Source URL: <${currentDossier.url}>\n` : "",
    `## Summary of Findings`,
    `${currentDossier.explanation}`,
    ``,
    ...(currentDossier.keyFindings && currentDossier.keyFindings.length > 0 ? [
      `### Key Takeaways`,
      ...currentDossier.keyFindings.map(kf => `- ${kf}`),
      ``
    ] : []),
    `## Atomic Claim Breakdown`,
    ...currentDossier.claims.map(c => `- **${c.id} [${c.verdict || c.status}]**: ${c.text}\n  - *Finding*: ${c.finding}`),
    ``,
    `## Documented Sources & Records`,
    ...(currentDossier.evidence.length > 0
      ? currentDossier.evidence.map(e => `- **${e.source}** (${e.type})\n  - ${e.title ? `*${e.title}*\n  - ` : ""}${e.snippet || e.finding}\n  - Reference: <${e.url || e.archive}>`)
      : ["*No authoritative public records or registered fact-checks identified in consulted archives.*"]),
    ``,
    ...(currentDossier.limitations && currentDossier.limitations.length > 0 ? [
      `## Evidentiary Limitations & Boundaries`,
      ...currentDossier.limitations.map(lim => `- ${lim}`),
      ``
    ] : []),
    `---`,
    `*Evidentiary Notice: ${currentDossier.disclaimer || "Measures corroboration from public wire reporting and fact-check tools."}*`
  ].join("\n");

  const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentDossier.id}_Verification_Brief.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function init() {
  initTheme();

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = primaryNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", (e) => {
      if (!menuToggle.contains(e.target) && !primaryNav.contains(e.target)) {
        if (primaryNav.classList.contains("is-open")) {
          primaryNav.classList.remove("is-open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820 && primaryNav.classList.contains("is-open")) {
        primaryNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll(".nav-anchor").forEach(link => {
    link.addEventListener("click", () => {
      if (primaryNav) primaryNav.classList.remove("is-open");
      if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  if (newsInput && characterCount) {
    newsInput.addEventListener("input", () => {
      activeCaseKey = null;
      updateCharCount();
    });
  }

  if (form) {
    form.addEventListener("submit", handleVerification);
    form.addEventListener("reset", () => {
      activeCaseKey = null;
      if (loadingCard) loadingCard.hidden = true;
      if (errorMessage) errorMessage.textContent = "";
      setTimeout(updateCharCount, 0);
    });
  }

  document.querySelectorAll(".sample-item, .dispatch-item, .case-card").forEach(button => {
    button.addEventListener("click", () => {
      let sampleKey = button.dataset.sample;
      
      // Remap legacy keys if present in markup
      if (sampleKey === "audio-deepfake") sampleKey = "power-mandate";
      if (sampleKey === "conflict-footage") sampleKey = "high-speed-rail";

      const repo = CASE_REPOSITORIES[sampleKey];
      if (!repo) return;

      if (newsInput) {
        activeCaseKey = sampleKey;
        newsInput.value = repo.headline;
        updateCharCount();
        if (errorMessage) errorMessage.textContent = "";
        handleVerification();
        if (resultCard) {
          resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } else {
        window.location.href = `verify.html?case=${encodeURIComponent(sampleKey)}`;
      }
    });
  });

  if (historyTableBody) {
    historyTableBody.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-examine-id]");
      if (!btn) return;
      const caseId = btn.dataset.examineId;
      const target = ledgerHistory.find(item => item.id === caseId);
      if (target) {
        if (newsInput && resultCard) {
          newsInput.value = target.headline;
          updateCharCount();
          renderDossier(target);
          window.location.hash = "workspace";
          resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.location.href = `verify.html?examine=${encodeURIComponent(caseId)}`;
        }
      }
    });
  }

  if (searchInput) searchInput.addEventListener("input", renderLedger);
  if (verdictFilter) verdictFilter.addEventListener("change", renderLedger);

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (ledgerHistory.length === 0) return;
      if (!window.confirm("Clear all verification records saved in this browser's local ledger?")) return;
      ledgerHistory = [];
      persistLedger();
      renderLedger();
      if (storageNote) storageNote.textContent = "Ledger cleared.";
    });
  }

  if (copyReportBtn) copyReportBtn.addEventListener("click", copyBrief);
  if (downloadReportBtn) downloadReportBtn.addEventListener("click", downloadDossier);
  if (resetWorkbenchBtn) {
    resetWorkbenchBtn.addEventListener("click", () => {
      if (form) form.reset();
      if (resultCard) resultCard.hidden = true;
      if (newsInput) newsInput.focus();
    });
  }

  if (characterCount) updateCharCount();
  if (historyTableBody || document.querySelector("#stat-total")) renderLedger();

  const urlParams = new URLSearchParams(window.location.search);
  let paramCase = urlParams.get("case");
  const paramExamine = urlParams.get("examine");

  if (paramCase === "audio-deepfake") paramCase = "power-mandate";
  if (paramCase === "conflict-footage") paramCase = "high-speed-rail";

  if (newsInput && paramCase && CASE_REPOSITORIES[paramCase]) {
    activeCaseKey = paramCase;
    newsInput.value = CASE_REPOSITORIES[paramCase].headline;
    updateCharCount();
    handleVerification();
  } else if (newsInput && paramExamine) {
    const target = ledgerHistory.find(item => item.id === paramExamine);
    if (target) {
      newsInput.value = target.headline;
      updateCharCount();
      renderDossier(target);
    }
  } else if (newsInput && resultCard) {
    const defaultDossier = ledgerHistory[0] || createDossierFromRepo("inflation-metric");
    if (defaultDossier) {
      renderDossier(defaultDossier);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
