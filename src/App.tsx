import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { HamsterArt } from "./art";
import { isAddress, loadAccount, loadByRpc, loadEconomy, loadImage, type Economy } from "./api";
import { CHAIN_ID, CHAIN_NAME, IDENTITIES, OFFICIAL_LINKS, RULES, SITE } from "./config";
import { COLLECTION, COLLECTION_OWNER, type Squeek, type Status } from "./data";
import { translate, type Key, type Lang } from "./i18n";
import { blockReason, buildRows, canOpenOfficial, mergeCallText, PACE, REGRETS, type Cell, type CompareRow, type Pace, type RegretKey, type Tag } from "./rules";
import { shareImage } from "./share";
import { deleteSnapshot, downloadBlob, listSnapshots, saveSnapshot, snapshotRows, type Snapshot, type SourceId } from "./snapshots";
import { ConnectControl, short } from "./wallet";

type Mode = "collection" | "wallet";
type Picks = { survivor: string | null; donor: string | null };
type WalletState = {
  address: string;
  tokens: Squeek[];
  phase: "idle" | "loading" | "ready" | "error";
  error: string;
  source: SourceId;
  unverifiedTokenIds: string[];
};

const noPicks: Picks = { survivor: null, donor: null };

function TagChip({ tag, t }: { tag: Tag; t: (k: Key) => string }) {
  const icon = tag === "certain" ? <path d="M3.5 8.5l3 3 6-7" /> : tag === "scenario" ? <path d="M8 13V8m0 0L4 3.5M8 8l4-4.5" /> : <path d="M6 6a2 2 0 1 1 2.8 1.8C8.3 8 8 8.5 8 9v.5M8 12.2v.3" />;
  return (
    <span className={`tag tag-${tag}`}>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      {t(`tag_${tag}` as Key)}
    </span>
  );
}

function StatusBadge({ status, t }: { status: Status; t: (k: Key) => string }) {
  const path = { idle: "M4 8h8", staked: "M5 7V5.5a3 3 0 0 1 6 0V7M4.5 7h7v5.5h-7z", cooling: "M8 4v4l2.5 1.5M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z", claimable: "M8 3v7m0 0l-3-3m3 3l3-3M4 13h8" }[status];
  return (
    <span className={`badge st-${status}`}>
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
      {t(`status_${status}` as Key)}
    </span>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("smp:lang") === "en" ? "en" : "zh"));
  const t = useCallback((k: Key, v?: Record<string, string | number>) => translate(lang, k, v), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    localStorage.setItem("smp:lang", lang);
  }, [lang]);

  const [mode, setMode] = useState<Mode>("collection");
  const [economy, setEconomy] = useState<Economy | null>(null);
  useEffect(() => {
    loadEconomy().then(setEconomy, () => setEconomy(null));
  }, []);
  const rules = economy?.rules ?? RULES;
  const ids = economy?.identities ?? { genesis: IDENTITIES.genesis, miningProxy: IDENTITIES.miningProxy, stakingProxy: IDENTITIES.stakingProxy };

  // Collection and wallet keep fully separate state, so switching never mixes their holdings.
  const [colPicks, setColPicks] = useState<Picks>(noPicks);
  const [walPicks, setWalPicks] = useState<Picks>(noPicks);
  const [wallet, setWallet] = useState<WalletState>({ address: "", tokens: [], phase: "idle", error: "", source: "api", unverifiedTokenIds: [] });
  const [addrInput, setAddrInput] = useState("");
  const [addrError, setAddrError] = useState(false);
  const [rpcIds, setRpcIds] = useState("");
  const [images, setImages] = useState<Record<string, string>>({});

  const picks = mode === "collection" ? colPicks : walPicks;
  const setPicks = mode === "collection" ? setColPicks : setWalPicks;
  const tokens = mode === "collection" ? COLLECTION : wallet.tokens;
  const owner = mode === "collection" ? COLLECTION_OWNER : wallet.address.toLowerCase();
  const source: SourceId = mode === "collection" ? "collection" : wallet.source;

  const byId = (id: string | null) => (id ? tokens.find((x) => x.tokenId === id) ?? null : null);
  const pickedSurvivor = byId(picks.survivor);
  const pickedDonor = byId(picks.donor);
  const [viewedSnap, setViewedSnap] = useState<Snapshot | null>(null);
  useEffect(() => setViewedSnap(null), [mode, owner]);
  const survivor = viewedSnap?.survivor ?? pickedSurvivor;
  const donor = viewedSnap?.donor ?? pickedDonor;

  const [pace, setPace] = useState<Pace>("steady");
  const viewPace = viewedSnap?.pace ?? pace;
  const rows: CompareRow[] | null = useMemo(() => (viewedSnap ? snapshotRows(viewedSnap) : survivor && donor ? buildRows(survivor, donor, pace, rules) : null), [viewedSnap, survivor, donor, pace, rules]);

  const [ticked, setTicked] = useState<Partial<Record<RegretKey, boolean>>>({});
  const pairKey = `${mode}:${picks.survivor}:${picks.donor}:${viewedSnap?.id ?? "current"}`;
  useEffect(() => setTicked({}), [pairKey]);

  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ k: Key; v?: Record<string, string> } | null>(null);
  useEffect(() => {
    const list = owner ? listSnapshots(owner) : [];
    setSnaps(list);
    setChosen(list.slice(0, 3).map((s) => s.id));
  }, [owner]);

  // ---- wallet loading ----
  const { address: connected, chainId: walletChain, isConnected } = useAccount();
  const loadWallet = useCallback(async (addr: string) => {
    setViewedSnap(null);
    setWallet((w) => ({ ...w, address: addr, phase: "loading", error: "", unverifiedTokenIds: [] }));
    setWalPicks(noPicks);
    try {
      const r = await loadAccount(addr);
      setWallet({ address: addr, tokens: r.tokens, phase: "ready", error: "", source: "api", unverifiedTokenIds: [] });
    } catch (e) {
      setWallet({ address: addr, tokens: [], phase: "error", error: String((e as Error).message || e), source: "api", unverifiedTokenIds: [] });
    }
  }, []);
  useEffect(() => {
    if (isConnected && connected && walletChain === CHAIN_ID) {
      setMode("wallet");
      setAddrInput(connected);
      loadWallet(connected);
    }
  }, [isConnected, connected, walletChain, loadWallet]);

  const onAddrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddress(addrInput)) {
      setAddrError(true);
      document.getElementById("addr")?.focus();
      return;
    }
    setAddrError(false);
    loadWallet(addrInput.trim());
  };
  const onRpcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = rpcIds.split(/[\s,]+/).filter((x) => /^\d+$/.test(x)).slice(0, 20);
    if (!list.length || !isAddress(wallet.address)) return;
    setViewedSnap(null);
    setWalPicks(noPicks);
    setWallet((w) => ({ ...w, phase: "loading" }));
    try {
      const found = await loadByRpc(wallet.address, list, ids);
      setWallet((w) => ({ ...w, tokens: found.tokens, phase: "ready", error: "", source: "rpc", unverifiedTokenIds: found.unverifiedTokenIds }));
    } catch (err) {
      setWallet((w) => ({ ...w, phase: "error", error: String((err as Error).message || err) }));
    }
  };

  // Official images for real holdings, one at a time.
  useEffect(() => {
    if (mode !== "wallet" || wallet.phase !== "ready") return;
    let stop = false;
    (async () => {
      for (const tk of wallet.tokens.slice(0, 40)) {
        if (stop || images[tk.tokenId]) continue;
        const uri = await loadImage(tk.tokenId);
        if (uri && !stop) setImages((m) => ({ ...m, [tk.tokenId]: uri }));
      }
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, wallet.phase, wallet.tokens]);

  // ---- picking ----
  const pick = (s: Squeek) => {
    setViewedSnap(null);
    setPicks((p) => {
      if (p.survivor === s.tokenId) return { survivor: p.donor, donor: null };
      if (p.donor === s.tokenId) return { ...p, donor: null };
      if (!p.survivor) return { survivor: s.tokenId, donor: null };
      return { ...p, donor: s.tokenId };
    });
  };
  const swap = () => {
    setViewedSnap(null);
    setPicks((p) => ({ survivor: p.donor, donor: p.survivor }));
  };
  const name = (s: Squeek) => (lang === "zh" ? s.nameZh : s.nameEn);
  const cell = (c: Cell) => {
    if (c.k === "v_split") return t("v_split", { claim: c.v?.claim ? t("v_claimNote") : "" });
    return t(c.k, c.v);
  };

  // ---- snapshots ----
  const sourceLabel = (s: SourceId) => t(s === "collection" ? "sourceCollection" : s === "api" ? "sourceApi" : "sourceRpc");
  const onSave = () => {
    if (!survivor || !donor || !rows || viewedSnap) return;
    const snap = saveSnapshot({ owner, source, holdings: tokens.map((x) => ({ tokenId: x.tokenId, status: x.status, level: x.level })), survivor, donor, pace, comparison: rows });
    const list = listSnapshots(owner);
    setSnaps(list);
    setChosen((c) => [snap.id, ...c.filter((x) => x !== snap.id)].slice(0, 3));
    setNotice({ k: "saved", v: { time: snap.createdAtUtc.replace("T", " ").slice(0, 19) + " UTC" } });
  };
  const toggleChosen = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-3)));
  const openSnap = (s: Snapshot) => {
    setViewedSnap(s);
    document.getElementById("compare")?.focus({ preventScroll: true });
    document.getElementById("compare")?.scrollIntoView({ block: "start" });
  };
  const summary = () => {
    if (!survivor || !donor || !rows) return "";
    const lines = rows.map((r) => `${t(r.item)}: ${cell(r.d0)} → +7d ${cell(r.d7)} → +30d ${cell(r.d30)} [${t(`tag_${r.tag}` as Key)}]`);
    return [`${SITE.name} · ${SITE.author}`, `${t("survivor")} #${survivor.tokenId} ${name(survivor)} · ${t("donor")} #${donor.tokenId} ${name(donor)}`, `${t("snapOwner")}: ${viewedSnap?.owner ?? owner}`, `chainId ${CHAIN_ID} · ${t("source")}: ${sourceLabel(viewedSnap?.source ?? source)}`, `${t("scenarioLabel")}: ${t(`pace_${viewPace}` as Key)}`, ...lines, viewedSnap?.createdAtUtc ?? new Date().toISOString()].join("\n");
  };
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      setNotice({ k: "copied" });
    } catch {
      setNotice({ k: "copyFailed" });
    }
  };
  const onExport = () => {
    const pickList = snaps.filter((s) => chosen.includes(s.id));
    const body = { tool: SITE.name, author: SITE.author, exportedAtUtc: new Date().toISOString(), chainId: CHAIN_ID, owner, snapshots: pickList.length ? pickList : snaps };
    downloadBlob(`squeek-merge-preview-${owner.slice(0, 10)}.json`, new Blob([JSON.stringify(body, null, 2)], { type: "application/json" }));
  };
  const artRef = useRef<HTMLDivElement>(null);
  const onShare = async () => {
    if (!survivor || !donor) return;
    const blob = await shareImage({
      title: `#${survivor.tokenId} + #${donor.tokenId} → Lv ${(survivor.level ?? 1) + 1}`,
      lines: [
        `${t("survivor")}: #${survivor.tokenId} ${name(survivor)}`,
        `${t("donor")}: #${donor.tokenId} ${name(donor)} · ${t("v_burned", { id: donor.tokenId })}`,
        `${t("r_power")}: ${cell(rows![3].d0)} → ${cell(rows![3].d7)}`,
        `${t("r_cooldown")}: ${cell(rows![5].d7)}`,
        `${t("r_earn")}: ${t("tag_unknown")}`,
        `chainId ${CHAIN_ID} · ${(viewedSnap?.createdAtUtc ?? new Date().toISOString()).slice(0, 16)}Z`,
      ],
      artSvg: artRef.current?.querySelector("svg") ?? null,
      footer: t("footerNote"),
    });
    downloadBlob(`squeek-merge-${survivor.tokenId}-${donor.tokenId}.png`, blob);
  };

  // ---- dialogs ----
  const previewRef = useRef<HTMLDialogElement>(null);
  const aboutRef = useRef<HTMLDialogElement>(null);

  const officialOpen = !viewedSnap && canOpenOfficial(ticked);
  const pickedCount = (picks.survivor ? 1 : 0) + (picks.donor ? 1 : 0);
  const chosenSnaps = snaps.filter((s) => chosen.includes(s.id)).slice(0, 3);
  const regretDone = REGRETS.filter((k) => ticked[k]).length;

  return (
    <>
      <div id="app-shell">
        <a className="skip" href="#compare">
          {t("skip")}
        </a>
        <header className="top">
          <div className="brand">
            <img src="./favicon.svg" width={28} height={28} alt="" />
            <span className="brand-name">Squeek Merge Preview</span>
            <span className="brand-sub">{t("brandSub")}</span>
          </div>
          <div className="top-controls">
            <div className="seg" role="group" aria-label={t("langLabel")}>
              <button aria-pressed={lang === "zh"} onClick={() => setLang("zh")} lang="zh-CN">
                ZH
              </button>
              <button aria-pressed={lang === "en"} onClick={() => setLang("en")} lang="en">
                EN
              </button>
            </div>
            <ConnectControl t={t} />
          </div>
        </header>

        <main id="main">
          <div className="intro">
            <h1 className="t-h1">{t("h1")}</h1>
            <p className="lede">{t("lede")}</p>
          </div>

          <div className="desk">
            <section className="col col-pick" aria-labelledby="h-pick">
              <div className="col-head">
                <h2 id="h-pick" className="t-h2">
                  {t("step1")}
                </h2>
                <div className="seg seg-mode" role="group" aria-label={t("modeLabel")}>
                  <button aria-pressed={mode === "collection"} onClick={() => setMode("collection")}>
                    {t("modeCollection")}
                  </button>
                  <button aria-pressed={mode === "wallet"} onClick={() => setMode("wallet")}>
                    {t("modeWallet")}
                  </button>
                </div>
              </div>

              {mode === "collection" ? (
                <p className="meta">
                  <span>{t("collectionOwner")}</span> · <span>{CHAIN_NAME}</span>
                </p>
              ) : (
                <div className="wallet-box">
                  <p className="meta">{t("walletIntro")}</p>
                  {isConnected && walletChain !== CHAIN_ID && (
                    <p className="warn" role="status">
                      {t("wrongChain", { id: String(walletChain), chain: CHAIN_NAME, expected: CHAIN_ID })}
                    </p>
                  )}
                  <form className="addr-form" onSubmit={onAddrSubmit} noValidate>
                    <label htmlFor="addr">{t("addrLabel")}</label>
                    <div className="addr-row">
                      <input id="addr" name="address" autoComplete="off" spellCheck={false} inputMode="text" placeholder={t("addrPlaceholder")} value={addrInput} onChange={(e) => setAddrInput(e.target.value)} aria-invalid={addrError ? true : undefined} aria-describedby={addrError ? "addr-err" : "addr-hint"} />
                      <button className="btn" type="submit" disabled={wallet.phase === "loading"}>
                        {t("addrLoad")}
                      </button>
                    </div>
                    {addrError ? (
                      <p id="addr-err" className="err">
                        {t("addrInvalid")}
                      </p>
                    ) : (
                      <p id="addr-hint" className="hint">
                        {t("addrHint")}
                      </p>
                    )}
                  </form>
                  {wallet.address && wallet.phase !== "idle" && (
                    <p className="meta">
                      <span className="tnum">{short(wallet.address)}</span> · {CHAIN_NAME} · {t("source")}: {sourceLabel(wallet.source)}
                    </p>
                  )}
                </div>
              )}

              <div className="pick-bar">
                <span className="tnum" aria-live="polite">
                  {t("pickedCount", { n: pickedCount })}
                </span>
                <span className="pick-actions">
                  <button className="btn btn-quiet" onClick={swap} disabled={!pickedSurvivor || !pickedDonor}>
                    {t("swap")}
                  </button>
                  <button className="btn btn-quiet" onClick={() => { setViewedSnap(null); setPicks(noPicks); }} disabled={pickedCount === 0}>
                    {t("clearPick")}
                  </button>
                </span>
              </div>
              <p className="hint">{t("pickHint")}</p>

              {mode === "wallet" && wallet.phase === "loading" && (
                <ul className="grid" aria-busy="true" aria-label={t("loading")}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <li key={i} className="card skeleton" aria-hidden="true">
                      <span className="sk-art" />
                      <span className="sk-line" />
                    </li>
                  ))}
                </ul>
              )}
              {mode === "wallet" && wallet.phase === "error" && (
                <div className="state state-error" role="alert">
                  <p>{t("loadFailed", { reason: wallet.error })}</p>
                  <button className="btn" onClick={() => loadWallet(wallet.address)}>
                    {t("retry")}
                  </button>
                </div>
              )}
              {mode === "wallet" && wallet.address && (wallet.phase === "error" || wallet.source === "rpc") && (
                <form className="rpc-form" onSubmit={onRpcSubmit}>
                  <h3 className="t-h3">{t("rpcTitle")}</h3>
                  <label htmlFor="rpc-ids">{t("rpcLabel")}</label>
                  <div className="addr-row">
                    <input id="rpc-ids" name="tokenIds" inputMode="numeric" autoComplete="off" placeholder="8889, 8890" value={rpcIds} onChange={(e) => setRpcIds(e.target.value)} aria-describedby="rpc-hint" />
                    <button className="btn" type="submit">
                      {t("rpcLoad")}
                    </button>
                  </div>
                  <p id="rpc-hint" className="hint">
                    {t("rpcHint")}
                  </p>
                </form>
              )}
              {mode === "wallet" && wallet.phase === "ready" && wallet.tokens.length === 0 && (
                <div className="state">
                  <p className="state-title">{wallet.source === "rpc" ? t("rpcNoVerified") : t("emptyWallet", { chain: CHAIN_NAME })}</p>
                  <p className="hint">{t("emptyWalletHint")}</p>
                  <button className="btn" onClick={() => setMode("collection")}>
                    {t("modeCollection")}
                  </button>
                </div>
              )}
              {mode === "wallet" && wallet.phase === "ready" && wallet.unverifiedTokenIds.length > 0 && (
                <p className="warn" role="status">{t("rpcUnverified", { ids: wallet.unverifiedTokenIds.map((id) => `#${id}`).join(", ") })}</p>
              )}

              {(mode === "collection" || wallet.phase === "ready") && tokens.length > 0 && (
                <ul className="grid">
                  {tokens.map((s) => {
                    const role = s.tokenId === picks.survivor ? "survivor" : s.tokenId === picks.donor ? "donor" : null;
                    const reason = role ? null : blockReason(s, pickedSurvivor, rules);
                    return (
                      <li key={s.tokenId}>
                        <button className={`card${role ? ` is-${role}` : ""}`} aria-pressed={role !== null} disabled={reason !== null} onClick={() => pick(s)}>
                          <span className="card-art">{images[s.tokenId] && mode === "wallet" ? <img src={images[s.tokenId]} width={56} height={56} alt="" /> : <HamsterArt id={s.tokenId} size={56} />}</span>
                          <span className="card-body">
                            <span className="card-name">{name(s)}</span>
                            <span className="card-meta tnum">
                              #{s.tokenId} · {s.level === null ? t("levelNA") : t("levelShort", { n: s.level })}
                            </span>
                            <StatusBadge status={s.status} t={t} />
                            {role && <span className={`role role-${role}`}>{t(role)}</span>}
                            {reason && <span className="reason">{t(reason)}</span>}
                            {s.note && <span className="reason">{s.note[lang]}</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {pickedCount === 2 && (
                <a className="btn btn-quiet jump" href="#compare">
                  {t("step2")}
                </a>
              )}
            </section>

            <section className="col col-compare" id="compare" aria-labelledby="h-compare" tabIndex={-1}>
              <h2 id="h-compare" className="t-h2">
                {t("step2")}
              </h2>
              {!rows || !survivor || !donor ? (
                <div className="state">
                  <p className="state-title">{t("compareEmpty")}</p>
                  <p className="hint">{survivor ? t("compareNeedOne") : t("compareEmptyHint")}</p>
                </div>
              ) : (
                <>
                  {viewedSnap && (
                    <div className="state snapshot-view">
                      <p className="state-title">{t("snapReadonly")}</p>
                      <dl className="kv">
                        <dt>{t("snapTime")}</dt><dd className="tnum">{viewedSnap.createdAtUtc}</dd>
                        <dt>{t("snapOwner")}</dt><dd className="addr">{viewedSnap.owner === COLLECTION_OWNER ? t("modeCollection") : viewedSnap.owner}</dd>
                        <dt>{t("snapChain")}</dt><dd>{viewedSnap.chainId}</dd>
                        <dt>{t("snapSource")}</dt><dd>{sourceLabel(viewedSnap.source)}</dd>
                      </dl>
                      <p className="hint addr">{t("snapTokens")}: {viewedSnap.holdings.map((h) => `#${h.tokenId} ${t(`status_${h.status}` as Key)} · ${h.level === null ? t("levelNA") : t("levelShort", { n: h.level })}`).join(" / ")}</p>
                      {!viewedSnap.comparison && <p className="warn">{t("snapLegacy")}</p>}
                      <button className="btn" onClick={() => setViewedSnap(null)}>{t("snapReturn")}</button>
                    </div>
                  )}
                  <div className="pair" ref={artRef}>
                    <div className="pair-item">
                      <HamsterArt id={survivor.tokenId} size={72} title={`${name(survivor)} #${survivor.tokenId}`} />
                      <span>
                        <span className="role role-survivor">{t("survivor")}</span>
                        <span className="pair-name">{name(survivor)}</span>
                        <span className="card-meta tnum">#{survivor.tokenId}</span>
                      </span>
                    </div>
                    <span className="pair-plus" aria-hidden="true">
                      +
                    </span>
                    <div className="pair-item">
                      <HamsterArt id={donor.tokenId} size={72} title={`${name(donor)} #${donor.tokenId}`} />
                      <span>
                        <span className="role role-donor">{t("donor")}</span>
                        <span className="pair-name">{name(donor)}</span>
                        <span className="card-meta tnum">#{donor.tokenId}</span>
                      </span>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="pace">{t("scenarioLabel")}</label>
                    <select id="pace" value={viewPace} disabled={!!viewedSnap} onChange={(e) => setPace(e.target.value as Pace)}>
                      {(Object.keys(PACE) as Pace[]).map((p) => (
                        <option key={p} value={p}>
                          {t(`pace_${p}` as Key)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="hint">{t("tagLegend")}</p>
                  <div className="table-wrap">
                    <table className="cmp">
                      <thead>
                        <tr>
                          <th scope="col">{t("colItem")}</th>
                          <th scope="col">{t("colD0")}</th>
                          <th scope="col">{t("colD7")}</th>
                          <th scope="col">{t("colD30")}</th>
                          <th scope="col">{t("colTag")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.item} className={`row-${r.tag}`}>
                            <th scope="row">{t(r.item)}</th>
                            <td data-label={t("colD0")}>{cell(r.d0)}</td>
                            <td data-label={t("colD7")}>{cell(r.d7)}</td>
                            <td data-label={t("colD30")}>{cell(r.d30)}</td>
                            <td data-label={t("colTag")}>
                              <TagChip tag={r.tag} t={t} />
                              <span className="basis">{t(r.basis)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="actions">
                    <button className="btn btn-primary" onClick={onSave} disabled={!!viewedSnap}>
                      {t("saveSnap")}
                    </button>
                    <button className="btn" onClick={onCopy}>
                      {t("copySummary")}
                    </button>
                    <button className="btn" onClick={onShare}>
                      {t("shareImg")}
                    </button>
                  </div>
                </>
              )}
              <p className="status-line" role="status">
                {notice ? t(notice.k, notice.v) : ""}
              </p>

              <section className="snaps" aria-labelledby="h-snaps">
                <h2 id="h-snaps" className="t-h2">
                  {t("step4")}
                </h2>
                <p className="hint">{t("cacheWarn")}</p>
                {snaps.length === 0 ? (
                  <div className="state">
                    <p className="state-title">{t("snapEmpty")}</p>
                    <p className="hint">{t("snapEmptyHint")}</p>
                  </div>
                ) : (
                  <>
                    <p className="hint">{t("snapCompareHint")}</p>
                    <ul className="snap-list">
                      {snaps.map((s) => (
                        <li key={s.id}>
                          <label className="check">
                            <input type="checkbox" checked={chosen.includes(s.id)} onChange={() => toggleChosen(s.id)} />
                            <span className="tnum">
                              {s.createdAtUtc.replace("T", " ").slice(0, 19)} UTC · #{s.survivor.tokenId} + #{s.donor.tokenId}
                            </span>
                          </label>
                          <span className="snap-ops">
                            <button className="btn btn-quiet" onClick={() => openSnap(s)}>
                              {t("snapOpen")}
                            </button>
                            <button className="btn btn-quiet" onClick={() => setSnaps(deleteSnapshot(owner, s.id))} aria-label={`${t("snapDelete")} ${s.createdAtUtc}`}>
                              {t("snapDelete")}
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="snap-grid">
                      {chosenSnaps.map((s) => {
                        const r = snapshotRows(s);
                        return (
                          <dl key={s.id} className="snap">
                            <dt>{t("snapTime")}</dt>
                            <dd className="tnum">{s.createdAtUtc.replace("T", " ").slice(0, 19)}</dd>
                            <dt>{t("snapOwner")}</dt>
                            <dd className="tnum">{s.owner === COLLECTION_OWNER ? t("modeCollection") : short(s.owner)}</dd>
                            <dt>{t("snapChain")}</dt>
                            <dd className="tnum">{s.chainId}</dd>
                            <dt>{t("snapSource")}</dt>
                            <dd>{sourceLabel(s.source)}</dd>
                            <dt>{t("snapPair")}</dt>
                            <dd className="tnum">
                              #{s.survivor.tokenId} / #{s.donor.tokenId}
                            </dd>
                            <dt>{t("snapTokens")}</dt>
                            <dd>
                              {(["idle", "staked", "cooling", "claimable"] as Status[])
                                .map((st) => `${t(`status_${st}` as Key)} ${s.holdings.filter((h) => h.status === st).length}`)
                                .join(" · ")}
                            </dd>
                            <dt>{t("snapScenario")}</dt>
                            <dd>{t(`pace_${s.pace}` as Key)}</dd>
                            <dt>{t("r_remerge")} +7d</dt>
                            <dd>{cell(r[6].d7)}</dd>
                          </dl>
                        );
                      })}
                    </div>
                    <div className="actions">
                      <button className="btn" onClick={onExport}>
                        {t("exportJson")}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </section>

            <aside className="col col-side" aria-labelledby="h-regret">
              <h2 id="h-regret" className="t-h2">
                {t("step3")}
              </h2>
              <p className="hint">{survivor && donor ? t("regretIntro") : t("regretNeedPair")}</p>
              <fieldset className="regrets" disabled={!!viewedSnap || !survivor || !donor}>
                <legend className="tnum">{t("regretProgress", { n: regretDone, t: REGRETS.length })}</legend>
                {REGRETS.map((k) => (
                  <label key={k} className={`check${k === "g_gate" ? " check-gate" : ""}`}>
                    <input type="checkbox" checked={!!ticked[k]} onChange={(e) => setTicked((m) => ({ ...m, [k]: e.target.checked }))} />
                    <span>{t(k, { id: donor?.tokenId ?? "…" })}</span>
                  </label>
                ))}
              </fieldset>

              <section className="official" aria-labelledby="h-official">
                <h3 id="h-official" className="t-h3">
                  {t("officialTitle")}
                </h3>
                {!officialOpen || !survivor || !donor ? (
                  <p className="locked">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M5 7V5.5a3 3 0 0 1 6 0V7M4.5 7h7v6h-7z" />
                    </svg>
                    {t(viewedSnap ? "snapReadonly" : "officialLocked")}
                  </p>
                ) : (
                  <div className="official-body">
                    {economy?.mismatch && <p className="warn">{t("identityMismatch")}</p>}
                    <dl className="kv">
                      <dt>{t("c_network")}</dt>
                      <dd className="tnum">
                        {CHAIN_NAME} · chainId {CHAIN_ID}
                      </dd>
                      <dt>{t("c_contract")}</dt>
                      <dd className="addr">{ids.miningProxy}</dd>
                      <dt>{t("c_method")}</dt>
                      <dd className="addr">{mergeCallText(survivor.tokenId, donor.tokenId)}</dd>
                    </dl>
                    <ul className="ticks">
                      <li>{t("c_order", { s: survivor.tokenId, d: donor.tokenId })}</li>
                      <li>{t("c_owner")}</li>
                      <li>{t("c_noApprove")}</li>
                    </ul>
                    <p className="t-label">{t("c_links")}</p>
                    <ul className="links">
                      <li>
                        <a href={OFFICIAL_LINKS.app} target="_blank" rel="noopener noreferrer">
                          {t("l_app")}
                        </a>
                      </li>
                      <li>
                        <a href={OFFICIAL_LINKS.mergeDocs} target="_blank" rel="noopener noreferrer">
                          {t("l_docs")}
                        </a>
                      </li>
                      <li>
                        <a href={OFFICIAL_LINKS.ownerActions} target="_blank" rel="noopener noreferrer">
                          {t("l_owner")}
                        </a>
                      </li>
                      <li>
                        <a href={OFFICIAL_LINKS.explorer(ids.miningProxy)} target="_blank" rel="noopener noreferrer">
                          {t("l_explorer")}
                        </a>
                      </li>
                    </ul>
                    <button className="btn" onClick={() => previewRef.current?.showModal()}>
                      {t("previewSign")}
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </main>

        <footer className="foot">
          <p>{t("footerNote")}</p>
          <p>
            <a href="https://x.com/xinchne_eth" target="_blank" rel="noopener noreferrer">
              @xinchne_eth
            </a>
            {" · "}
            <button className="link-btn" onClick={() => aboutRef.current?.showModal()}>
              {t("footerAbout")}
            </button>
          </p>
        </footer>
      </div>

      <dialog ref={previewRef} className="dlg" aria-labelledby="pv-title">
        <h2 id="pv-title" className="t-h3">
          {t("previewTitle")}
        </h2>
        <p className="hint">{t("previewBody")}</p>
        {survivor && donor && (
          <dl className="kv">
            <dt>{t("previewFrom")}</dt>
            <dd className="addr">{mode === "wallet" && wallet.address ? wallet.address : t("modeCollection")}</dd>
            <dt>{t("previewTo")}</dt>
            <dd className="addr">{ids.miningProxy}</dd>
            <dt>{t("c_network")}</dt>
            <dd className="tnum">
              {CHAIN_NAME} · {CHAIN_ID}
            </dd>
            <dt>{t("previewData")}</dt>
            <dd className="addr">{mergeCallText(survivor.tokenId, donor.tokenId)}</dd>
            <dt>{t("previewValue")}</dt>
            <dd className="tnum">0 ETH</dd>
          </dl>
        )}
        <form method="dialog">
          <button className="btn btn-primary" value="close">
            {t("previewClose")}
          </button>
        </form>
      </dialog>

      <dialog ref={aboutRef} className="dlg" aria-labelledby="ab-title">
        <h2 id="ab-title" className="t-h3">
          {t("aboutTitle")}
        </h2>
        <p>{t("aboutBody")}</p>
        <p className="hint">{t("wcSource", { wagmi: "3.7.10", viem: "2.57.14", cb: "4.4.0" })}</p>
        <form method="dialog">
          <button className="btn" value="close">
            {t("close")}
          </button>
        </form>
      </dialog>
    </>
  );
}
