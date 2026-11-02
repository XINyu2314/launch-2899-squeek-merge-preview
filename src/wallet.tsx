/**
 * Wallet connection, read-only. The site reads the connected address and chainId and nothing else:
 * no sendTransaction, writeContract, signMessage, approve or setApprovalForAll is called anywhere.
 * SDKs (npm): wagmi 3.7.10, viem 2.57.14, @coinbase/wallet-sdk 4.4.0. EIP-6963 discovery, no relay, no project ID.
 */
import { useEffect, useRef, useState } from "react";
import { createConfig, http, useAccount, useConnect, useDisconnect, useSwitchChain, type Connector } from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { sepolia } from "viem/chains";
import { CHAIN_ID, CHAIN_NAME, PUBLIC_RPCS, SITE } from "./config";
import type { Key } from "./i18n";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: true,
  connectors: [injected(), coinbaseWallet({ appName: SITE.name })],
  transports: { [sepolia.id]: http(PUBLIC_RPCS[0]) },
});

const COINBASE = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="28" fill="#2C5FF6"/><path fill-rule="evenodd" clip-rule="evenodd" d="M14 23.8C19.4124 23.8 23.8 19.4124 23.8 14C23.8 8.58761 19.4124 4.2 14 4.2C8.58761 4.2 4.2 8.58761 4.2 14C4.2 19.4124 8.58761 23.8 14 23.8ZM11.55 10.8C11.1358 10.8 10.8 11.1358 10.8 11.55V16.45C10.8 16.8642 11.1358 17.2 11.55 17.2H16.45C16.8642 17.2 17.2 16.8642 17.2 16.45V11.55C17.2 11.1358 16.8642 10.8 16.45 10.8H11.55Z" fill="white"/></svg>`;
/** Neutral wallet glyph in each vendor's colour, for rows whose official mark is not bundled here. */
const glyph = (color: string) => `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="28" rx="6" fill="${color}"/><rect x="6" y="9" width="16" height="11" rx="2.5" fill="none" stroke="white" stroke-width="2"/><circle cx="18" cy="14.5" r="1.6" fill="white"/></svg>`;
const ICONS: Record<string, string> = { coinbaseWalletSDK: COINBASE, coinbase: COINBASE, metamask: glyph("#E2761B"), phantom: glyph("#AB9FF2") };
const dataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Mobile without a relay: open this page inside the wallet's own browser (vendor-documented links). */
const OPEN_IN: ReadonlyArray<{ id: string; name: string; href: (url: string) => string }> = [
  // https://docs.metamask.io/metamask-connect/evm/guides/metamask-exclusive/use-deeplinks
  { id: "metamask", name: "MetaMask", href: (url) => `https://link.metamask.io/dapp/${url.replace(/^https?:\/\//, "")}` },
  // https://docs.cdp.coinbase.com/wallet-sdk/docs/deep-link
  { id: "coinbase", name: "Coinbase Wallet", href: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}` },
  // https://docs.phantom.com/phantom-deeplinks/other-methods/browse
  { id: "phantom", name: "Phantom", href: (url) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}` },
];
const isMobileBrowser = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !(window as any).ethereum;
export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

type T = (k: Key, v?: Record<string, string | number>) => string;

export function ConnectControl({ t }: { t: T }) {
  const mobile = isMobileBrowser();
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, variables, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    reset();
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    sheet.current?.querySelector<HTMLElement>("button, a")?.focus();
    const root = document.getElementById("app-shell");
    root?.setAttribute("inert", "");
    return () => {
      removeEventListener("keydown", onKey);
      root?.removeAttribute("inert");
    };
  }, [open]);
  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);

  const named = connectors.some((c) => c.type === "injected" && c.id !== "injected");
  const listed = [...connectors.filter((c) => c.type === "injected"), ...connectors.filter((c) => c.type !== "injected")].filter((c) => !(c.id === "injected" && named));
  const label = (c: Connector) => (c.id === "injected" ? t("browserWallet") : c.id === "coinbaseWalletSDK" && mobile ? "Coinbase Smart Wallet" : c.name);
  const icon = (c: Connector) => c.icon ?? (ICONS[c.id] ? dataUri(ICONS[c.id]) : dataUri(glyph("#6b6256")));

  if (isConnected && address) {
    if (chainId !== CHAIN_ID)
      return (
        <button className="btn btn-primary" onClick={() => switchChain({ chainId: CHAIN_ID })} disabled={switching}>
          {t("switchTo", { chain: CHAIN_NAME })}
        </button>
      );
    return (
      <button className="btn" onClick={() => disconnect()}>
        <span className="tnum">{short(address)}</span> · {t("disconnect")}
      </button>
    );
  }
  return (
    <>
      <button ref={trigger} className="btn btn-primary" onClick={() => setOpen(true)} aria-haspopup="dialog">
        {t("connect")}
      </button>
      {open && (
        <div className="sheet-bg" onClick={close}>
          <div ref={sheet} className="sheet" role="dialog" aria-modal="true" aria-labelledby="connect-title" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2 id="connect-title" className="t-h3">{t("connectTitle")}</h2>
              <button className="x" aria-label={t("close")} onClick={close}>
                ×
              </button>
            </div>
            {mobile &&
              OPEN_IN.map((w) => (
                <a key={w.id} className="row" href={w.href(location.href)}>
                  <img width={28} height={28} src={dataUri(ICONS[w.id])} alt="" />
                  <span>{t("openIn", { name: w.name })}</span>
                </a>
              ))}
            {listed
              .filter((c) => !mobile || c.type !== "injected")
              .map((c) => (
                <button key={c.uid} className="row" onClick={() => connect({ connector: c })} disabled={isPending}>
                  <img width={28} height={28} src={icon(c)} alt="" />
                  <span>
                    {label(c)}
                    {isPending && variables?.connector === c ? ` · ${t("opening")}` : ""}
                  </span>
                </button>
              ))}
            {error && <p className="note" role="status">{t("rejected")}</p>}
          </div>
        </div>
      )}
    </>
  );
}
