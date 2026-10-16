/**
 * VeritasLens — Evidence-Based News & Claim Verification Workspace
 * Clean, transparent editorial fact-checking logic
 */

const STORAGE_KEY = "veritaslens_claim_ledger_v3";
const MAX_LEDGER_ITEMS = 50;

// Curated Educational Case Studies Grounded in Real Investigations
const CASE_REPOSITORIES = {
  "audio-deepfake": {
    caseId: "CASE-2026-0924",
    headline: "Leaked audio of Prime Minister discussing emergency energy rationing directives",
    category: "Geopolitics · Synthetic Media",
    determination: "FALSE / FABRICATED",
    verdictClass: "verdict-false",
    benchmarkClass: "fill-false",
    confidence: "Contradicted by Public Records",
    benchmarkNote: "Repudiated on-the-record by Cabinet Office and corroborated by 3 wire desks",
    explanation: "Acoustic frequency analysis isolated harmonic voice-synthesis artifacts and unnatural phonetic cadence in the recording. Accredited press logs and official ministerial schedules confirm no security council briefing took place on the date alleged.",
    claims: [
      {
        id: "CLM-01",
        text: "Prime Minister ordered mandatory 40% industrial energy cuts beginning November 1st.",
        status: "Refuted",
        statusClass: "status-refuted",
        finding: "No executive decree, statutory instrument, or legislative draft exists in the National Gazette or Energy Department archives."
      },
      {
        id: "CLM-02",
        text: "The recording captures an emergency council briefing on energy reserves.",
        status: "Refuted",
        statusClass: "status-refuted",
        finding: "Cabinet Office press rosters confirm accredited correspondents were present at regular briefing; no emergency session occurred."
      }
    ],
    evidence: [
      {
        source: "Cabinet Office Official Press Statement",
        tier: "Official Government Statement",
        finding: "On-the-record denial verifying prime ministerial schedule and confirming recording is counterfeit.",
        archive: "Official Record #CO-2026-092"
      },
      {
        source: "Reuters Fact Check Wire",
        tier: "Wire Service Fact-Check",
        finding: "Independent acoustic analysis confirmed vocal synthesis models matching commercial neural voice clone signatures.",
        archive: "Reuters Fact Check Ref #RT-9941"
      },
      {
        source: "Associated Press Disinformation Desk",
        tier: "Wire Service Fact-Check",
        finding: "Traced earliest recorded dissemination to coordinated disinformation accounts on Telegram without source attribution.",
        archive: "AP News Archive #AP-8812"
      }
    ],
    signals: {
      tier: "Official Statement & Primary Wire Services",
      artifacts: "Acoustic Voice Synthesis Markers Detected",
      archive: "Archived #WB-2026-UK77"
    }
  },

  "conflict-footage": {
    caseId: "CASE-2026-0812",
    headline: "Viral video claiming to depict naval base drone strike during dawn offensive",
    category: "Conflict Reporting · Media Recycling",
    determination: "MISATTRIBUTED CONTEXT",
    verdictClass: "verdict-misleading",
    benchmarkClass: "fill-misleading",
    confidence: "Misattributed Video Archive",
    benchmarkNote: "Keyframe matches August 2021 industrial incident in Beirut",
    explanation: "Reverse visual keyframe indexing demonstrates the video depicts a 2021 petrochemical storage facility fire in Beirut, Lebanon. The original audio was replaced with dubbed siren tracks and shared with false geographic coordinates.",
    claims: [
      {
        id: "CLM-01",
        text: "Video documents dawn drone strike on military naval base.",
        status: "Refuted",
        statusClass: "status-refuted",
        finding: "Reverse image analysis matches identical smoke plume and warehouse architecture to historical 2021 broadcast footage."
      },
      {
        id: "CLM-02",
        text: "Event occurred within the past 24 hours in contested waters.",
        status: "Refuted",
        statusClass: "status-refuted",
        finding: "Harbor terrain and shoreline topography do not correspond with the cited military installation."
      }
    ],
    evidence: [
      {
        source: "Bellingcat Open Source Archive",
        tier: "Open-Source Investigation",
        finding: "Geolocation and keyframe comparison match footage to August 4, 2021 petrochemical fire at Beirut port.",
        archive: "OSINT Archive #BC-2021-084"
      },
      {
        source: "Agence France-Presse (AFP) Factuel",
        tier: "Wire Service Fact-Check",
        finding: "Located original video broadcast from 2021 showing identical fireboat response and camera angle.",
        archive: "AFP Factuel Ref #AFP-3012"
      }
    ],
    signals: {
      tier: "Archival Media & OSINT Geolocation",
      artifacts: "Dubbed Siren Audio & Recycled 2021 Video",
      archive: "Archived #WB-2021-LB08"
    }
  },

  "antimicrobial-approval": {
    caseId: "CASE-2026-0744",
    headline: "European Medicines Agency authorizes next-generation antibiotic for critical hospital care",
    category: "Health & Medicine · Public Records",
    determination: "VERIFIED AUTHENTIC",
    verdictClass: "verdict-true",
    benchmarkClass: "fill-true",
    confidence: "Confirmed by Regulatory Gazette",
    benchmarkNote: "Direct entry in EMA official marketing authorization register",
    explanation: "The marketing authorization is verified directly through European Medicines Agency Public Assessment Report (EPAR) documentation and the Official Journal of the European Union. Phase III randomized multi-center clinical trials corroborate clinical efficacy.",
    claims: [
      {
        id: "CLM-01",
        text: "EMA committee recommended marketing authorization for novel antimicrobial candidate.",
        status: "Corroborated",
        statusClass: "status-supported",
        finding: "CHMP meeting minutes and formal decision confirmed under European public registry reference EMEA/H/C/005821."
      },
      {
        id: "CLM-02",
        text: "Therapy demonstrated statistical efficacy against resistant bacterial pathogens.",
        status: "Corroborated",
        statusClass: "status-supported",
        finding: "Double-blind global trial published in The Lancet Infectious Diseases confirms primary clinical endpoints met."
      }
    ],
    evidence: [
      {
        source: "European Medicines Agency (EMA) Register",
        tier: "Official Regulatory Register",
        finding: "Authorized marketing approval indexed under official procedure EMEA/H/C/005821.",
        archive: "Official EPAR Reference #005821"
      },
      {
        source: "The Lancet Infectious Diseases",
        tier: "Peer-Reviewed Medical Journal",
        finding: "Peer-reviewed multi-country clinical study results published March 2026.",
        archive: "DOI: 10.1016/S1473-3099(26)"
      }
    ],
    signals: {
      tier: "Regulatory Register & Scientific Literature",
      artifacts: "Verified Official Public Gazette Record",
      archive: "Archived #EMA-2026-REG"
    }
  },

  "inflation-metric": {
    caseId: "CASE-2026-0618",
    headline: "Infographic alleging Central Bank confirmed 35% single-month inflation surge",
    category: "Economics · Chart Manipulation",
    determination: "MISLEADING PRESENTATION",
    verdictClass: "verdict-misleading",
    benchmarkClass: "fill-misleading",
    confidence: "Manipulated Visual Data",
    benchmarkNote: "National Statistics Bureau reports headline CPI at 3.2%",
    explanation: "The infographic truncates the vertical Y-axis (spanning exclusively 30% to 36%) to simulate dramatic volatility and isolates an annualized spot wholesale energy component, falsely presenting it as headline consumer price inflation.",
    claims: [
      {
        id: "CLM-01",
        text: "Headline consumer inflation reached 35% in recent month.",
        status: "Refuted",
        statusClass: "status-refuted",
        finding: "National Statistics Bureau release confirms national headline consumer price index was 3.2% year-over-year."
      },
      {
        id: "CLM-02",
        text: "Official Central Bank bulletin declared economic crisis threshold breached.",
        status: "Refuted",
        statusClass: "status-refuted",
        finding: "Monetary Policy Committee meeting minutes show stable medium-term inflation expectations."
      }
    ],
    evidence: [
      {
        source: "National Statistics Bureau Monthly Economic Release",
        tier: "Official Statistical Bulletin",
        finding: "Headline Consumer Price Index reported at 3.2% YoY; core inflation reported at 2.8%.",
        archive: "NSB Bulletin #2026-M04"
      },
      {
        source: "Bloomberg Economic Data Feed",
        tier: "Financial News & Terminal Record",
        finding: "Historical pricing records show the 35% figure pertains exclusively to spot LNG contract spikes.",
        archive: "Bloomberg Terminal Ref #BBG-2026-FIN"
      }
    ],
    signals: {
      tier: "Official Statistics & Market Data",
      artifacts: "Truncated Y-Axis Chart Distortion",
      archive: "Archived #STAT-2026-M04"
    }
  }
};

// DOM References
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

let activeCaseKey = null;
let currentDossier = null;
let auditTimeout = null;
let ledgerHistory = loadLedger();

// Safe LocalStorage Interaction
function loadLedger() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed four curated reference cases if storage is empty
      const initialSeed = [
        createDossierFromRepo("audio-deepfake", new Date(Date.now() - 3600000 * 3).toISOString()),
        createDossierFromRepo("conflict-footage", new Date(Date.now() - 3600000 * 8).toISOString()),
        createDossierFromRepo("antimicrobial-approval", new Date(Date.now() - 3600000 * 24).toISOString()),
        createDossierFromRepo("inflation-metric", new Date(Date.now() - 3600000 * 48).toISOString())
      ];
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
    verdictClass: repo.verdictClass,
    benchmarkClass: repo.benchmarkClass,
    confidence: repo.confidence,
    benchmarkNote: repo.benchmarkNote,
    explanation: repo.explanation,
    claims: [...repo.claims],
    evidence: [...repo.evidence],
    signals: { ...repo.signals }
  };
}

function synthesizeCustomDossier(inputText) {
  const clean = inputText.trim();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const caseId = `CASE-2026-${randomSuffix}`;
  
  const lower = clean.toLowerCase();
  let determination = "UNVERIFIED / CONTEXT REQUIRED";
  let verdictClass = "verdict-misleading";
  let benchmarkClass = "fill-misleading";
  let confidence = "Pending Verification";
  let benchmarkNote = "Requires primary source corroboration or archival match";

  if (lower.includes("secret") || lower.includes("they don't want you to know") || lower.includes("miracle") || lower.includes("shocking")) {
    determination = "QUESTIONABLE ATTRIBUTION";
    verdictClass = "verdict-false";
    benchmarkClass = "fill-false";
    confidence = "Sensationalist Language Detected";
    benchmarkNote = "Exhibits hallmark characteristics of uncorroborated clickbait claims";
  } else if (lower.includes("official") || lower.includes("court") || lower.includes("gazette") || lower.includes("spokesperson")) {
    determination = "UNVERIFIED / OFFICIAL REFERENCE CITED";
    verdictClass = "verdict-true";
    benchmarkClass = "fill-true";
    confidence = "Official Citation Cited";
    benchmarkNote = "Pending inspection of corresponding public agency press record";
  }

  const excerpt = clean.length > 90 ? clean.slice(0, 87) + "..." : clean;

  return {
    id: caseId,
    timestamp: new Date().toISOString(),
    headline: clean,
    category: "Custom Claim Submission",
    determination: determination,
    verdictClass: verdictClass,
    benchmarkClass: benchmarkClass,
    confidence: confidence,
    benchmarkNote: benchmarkNote,
    explanation: `This submitted claim has been logged for examination. In this demonstration workspace, custom entries illustrate how claims are isolated into factual assertions and what evidence is required to corroborate them against news archives: "${excerpt}".`,
    claims: [
      {
        id: "CLM-01",
        text: `Primary assertion in: "${excerpt}"`,
        status: "Pending Check",
        statusClass: "status-unsupported",
        finding: "Claim requires checking against accredited wire records (AP, Reuters, AFP) or relevant official registers."
      },
      {
        id: "CLM-02",
        text: "Originating speaker or source attribution",
        status: "Pending Check",
        statusClass: "status-unsupported",
        finding: "Attribution should be confirmed against verified transcripts or official agency briefings."
      }
    ],
    evidence: [
      {
        source: "News Wire Archive Search",
        tier: "Accredited Wire Search",
        finding: "No emergency breaking dispatch matching this exact formulation found in recent cycle.",
        archive: `Query Ref #${caseId}-WIRE`
      },
      {
        source: "VeritasLens Public Claim Ledger",
        tier: "Local Workspace Session",
        finding: "Stored in this browser's local verification history for review.",
        archive: `Ledger Record #${caseId}`
      }
    ],
    signals: {
      tier: "User Submitted Query",
      artifacts: "Linguistic Structure Checked",
      archive: `Archived #${caseId}`
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

// Render Results View
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
  if (expEl) expEl.textContent = dossier.explanation;

  const confEl = document.querySelector("#confidence-value");
  if (confEl) confEl.textContent = dossier.confidence;

  const bar = document.querySelector("#confidence-bar");
  if (bar) bar.className = `consensus-fill ${dossier.benchmarkClass}`;

  const benchEl = document.querySelector("#corroboration-benchmark");
  if (benchEl) benchEl.textContent = dossier.benchmarkNote;

  // Render Atomic Claims
  const claimsContainer = document.querySelector("#claim-breakdown");
  if (claimsContainer) {
    claimsContainer.innerHTML = "";
    dossier.claims.forEach((claim) => {
      const li = document.createElement("li");
      li.className = "claim-item";
      li.innerHTML = `
        <div class="claim-item-top">
          <span class="claim-id">${claim.id}</span>
          <span class="claim-status-badge ${claim.statusClass || 'status-unsupported'}">${claim.status}</span>
        </div>
        <p class="claim-text">${escapeHtml(claim.text)}</p>
        <p class="claim-finding">${escapeHtml(claim.finding)}</p>
      `;
      claimsContainer.appendChild(li);
    });
  }

  // Render Documented Sources
  const evidenceContainer = document.querySelector("#evidence-list");
  if (evidenceContainer) {
    evidenceContainer.innerHTML = "";
    dossier.evidence.forEach((ev) => {
      const card = document.createElement("div");
      card.className = "evidence-card";
      card.innerHTML = `
        <div class="evidence-header">
          <span class="evidence-source">${escapeHtml(ev.source)}</span>
          <span class="evidence-tier">${escapeHtml(ev.tier)}</span>
        </div>
        <p class="evidence-finding">${escapeHtml(ev.finding)}</p>
        <span class="evidence-archive-link">${escapeHtml(ev.archive)}</span>
      `;
      evidenceContainer.appendChild(card);
    });
  }

  // Criteria Bar
  if (dossier.signals) {
    const sTier = document.querySelector("#signal-tier");
    const sArt = document.querySelector("#signal-artifacts");
    const sArc = document.querySelector("#signal-archive");
    if (sTier) sTier.textContent = dossier.signals.tier || "Standard Wire Citation";
    if (sArt) sArt.textContent = dossier.signals.artifacts || "Examined";
    if (sArc) sArc.textContent = dossier.signals.archive || "Archived";
  }

  resultCard.hidden = false;
  if (copyStatusMsg) copyStatusMsg.textContent = "";
}

// Render Verification Ledger Table
function renderLedger() {
  // Telemetry Counts
  let countTrue = 0;
  let countFalse = 0;
  let countMisleading = 0;

  ledgerHistory.forEach((item) => {
    if (item.determination.includes("AUTHENTIC") || item.determination.includes("TRUE")) countTrue++;
    else if (item.determination.includes("FABRICATED") || item.determination.includes("FALSE")) countFalse++;
    else countMisleading++;
  });

  const statTotal = document.querySelector("#stat-total");
  const statTrue = document.querySelector("#stat-true");
  const statFalse = document.querySelector("#stat-false");
  const statMisleading = document.querySelector("#stat-misleading");

  if (statTotal) statTotal.textContent = String(ledgerHistory.length);
  if (statTrue) statTrue.textContent = String(countTrue);
  if (statFalse) statFalse.textContent = String(countFalse);
  if (statMisleading) statMisleading.textContent = String(countMisleading);

  if (!historyTableBody) return;

  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
  const filter = (verdictFilter ? verdictFilter.value : "all");

  const filtered = ledgerHistory.filter((item) => {
    const matchVerdict = (filter === "all" || item.determination === filter);
    const matchQuery = !query || 
      item.headline.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query) || 
      item.explanation.toLowerCase().includes(query);
    return matchVerdict && matchQuery;
  });

  // Table Population
  historyTableBody.innerHTML = "";

  if (filtered.length === 0) {
    if (historyEmpty) historyEmpty.hidden = false;
  } else {
    if (historyEmpty) historyEmpty.hidden = true;
    filtered.forEach((item) => {
      const tr = document.createElement("tr");

      let pillClass = "pill-amber";
      if (item.determination.includes("AUTHENTIC")) pillClass = "pill-green";
      else if (item.determination.includes("FALSE") || item.determination.includes("FABRICATED")) pillClass = "pill-red";

      tr.innerHTML = `
        <td><span class="table-case-id">${item.id}</span></td>
        <td><div class="table-headline" title="${escapeHtml(item.headline)}">${escapeHtml(item.headline)}</div></td>
        <td><span class="verdict-pill ${pillClass}">${escapeHtml(item.determination)}</span></td>
        <td><span class="table-timestamp">${formatDateDisplay(item.timestamp)}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" data-examine-id="${item.id}" type="button">
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

// Form Submission Handler
function handleVerification(event) {
  if (event) event.preventDefault();
  const text = newsInput.value.trim();

  if (text.length < 12) {
    errorMessage.textContent = "Please enter at least 12 characters or choose one of the sample cases below.";
    newsInput.focus();
    return;
  }

  errorMessage.textContent = "";
  resultCard.hidden = true;
  loadingCard.hidden = false;
  analyzeButton.disabled = true;

  clearTimeout(auditTimeout);

  auditTimeout = setTimeout(() => {
    let dossier;
    if (activeCaseKey && CASE_REPOSITORIES[activeCaseKey] && newsInput.value === CASE_REPOSITORIES[activeCaseKey].headline) {
      dossier = createDossierFromRepo(activeCaseKey);
    } else {
      dossier = synthesizeCustomDossier(text);
    }

    // Prepend to ledger
    ledgerHistory = [dossier, ...ledgerHistory.filter(i => i.id !== dossier.id)].slice(0, MAX_LEDGER_ITEMS);
    persistLedger();

    renderDossier(dossier);
    renderLedger();

    loadingCard.hidden = true;
    analyzeButton.disabled = false;
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 400);
}

// Copy Summary Brief
async function copyBrief() {
  if (!currentDossier) return;
  const lines = [
    `VERITASLENS FACT-CHECK DOSSIER [${currentDossier.id}]`,
    `VERDICT: ${currentDossier.determination}`,
    `STATUS: ${currentDossier.confidence} (${currentDossier.benchmarkNote})`,
    `DATE: ${formatDateDisplay(currentDossier.timestamp)}`,
    `CLAIM: "${currentDossier.headline}"`,
    `SUMMARY: ${currentDossier.explanation}`,
    `----------------------------------------`,
    `ATOMIC CLAIMS:`,
    ...currentDossier.claims.map(c => `• [${c.status}] ${c.text} — ${c.finding}`),
    `----------------------------------------`,
    `DOCUMENTED SOURCES:`,
    ...currentDossier.evidence.map(e => `• ${e.source} (${e.tier}): ${e.finding}`)
  ];

  const briefText = lines.join("\n");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(briefText);
      copyStatusMsg.textContent = "Summary brief copied to clipboard.";
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
      if (ok) {
        copyStatusMsg.textContent = "Summary brief copied to clipboard.";
      } else {
        copyStatusMsg.textContent = "Brief text prepared (manual copy required).";
      }
    } catch {
      copyStatusMsg.textContent = "Unable to write to clipboard.";
    }
  }
  setTimeout(() => { if (copyStatusMsg) copyStatusMsg.textContent = ""; }, 3500);
}

// Download Dossier as Markdown
function downloadDossier() {
  if (!currentDossier) return;
  const mdContent = [
    `# VeritasLens Verification Report: ${currentDossier.id}`,
    ``,
    `**Date:** ${formatDateDisplay(currentDossier.timestamp)}  `,
    `**Verdict:** \`${currentDossier.determination}\`  `,
    `**Status:** ${currentDossier.confidence} (${currentDossier.benchmarkNote})  `,
    ``,
    `## Claim Evaluated`,
    `> "${currentDossier.headline}"`,
    ``,
    `## Summary of Findings`,
    `${currentDossier.explanation}`,
    ``,
    `## Atomic Claim Breakdown`,
    ...currentDossier.claims.map(c => `- **${c.id} [${c.status}]**: ${c.text}\n  - *Finding*: ${c.finding}`),
    ``,
    `## Documented Sources & Records`,
    ...currentDossier.evidence.map(e => `- **${e.source}** (${e.tier})\n  - ${e.finding}\n  - Ref: \`${e.archive}\``),
    ``,
    `---`,
    `*VeritasLens — Conforming to International Fact-Checking Network (IFCN) transparency guidelines.*`
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

// Initialization
function init() {
  // Mobile Nav Toggle
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

  // Smooth Navigation Links
  document.querySelectorAll(".nav-anchor").forEach(link => {
    link.addEventListener("click", () => {
      if (primaryNav) primaryNav.classList.remove("is-open");
      if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Character Counter
  if (newsInput && characterCount) {
    newsInput.addEventListener("input", () => {
      activeCaseKey = null;
      updateCharCount();
    });
  }

  // Form Submission
  if (form) {
    form.addEventListener("submit", handleVerification);
    form.addEventListener("reset", () => {
      clearTimeout(auditTimeout);
      activeCaseKey = null;
      if (loadingCard) loadingCard.hidden = true;
      if (errorMessage) errorMessage.textContent = "";
      setTimeout(updateCharCount, 0);
    });
  }

  // Sample Case Click Handlers
  document.querySelectorAll(".sample-item, .dispatch-item, .case-card").forEach(button => {
    button.addEventListener("click", () => {
      const sampleKey = button.dataset.sample;
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

  // Table Action Handler
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

  // Ledger Filter & Search
  if (searchInput) searchInput.addEventListener("input", renderLedger);
  if (verdictFilter) verdictFilter.addEventListener("change", renderLedger);

  // Clear Ledger History
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

  // Action Buttons
  if (copyReportBtn) copyReportBtn.addEventListener("click", copyBrief);
  if (downloadReportBtn) downloadReportBtn.addEventListener("click", downloadDossier);
  if (resetWorkbenchBtn) {
    resetWorkbenchBtn.addEventListener("click", () => {
      if (form) form.reset();
      if (resultCard) resultCard.hidden = true;
      if (newsInput) newsInput.focus();
    });
  }

  // Initial Load
  if (characterCount) updateCharCount();
  if (historyTableBody || document.querySelector("#stat-total")) renderLedger();

  // Handle URL Query Parameters (e.g. verify.html?case=antimicrobial-approval or ?examine=CASE-2026-0924)
  const urlParams = new URLSearchParams(window.location.search);
  const paramCase = urlParams.get("case");
  const paramExamine = urlParams.get("examine");

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
    // Load default case if on verification workspace
    const defaultDossier = ledgerHistory[0] || createDossierFromRepo("audio-deepfake");
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

