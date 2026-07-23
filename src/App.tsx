import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  ExternalLink,
  FileCode2,
  Code2,
  Info,
  Layers3,
  LockKeyhole,
  Menu,
  MessageCircle,
  Moon,
  Orbit,
  Radio,
  ShieldCheck,
  Sparkles,
  Sun,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { localGuideReply, starterQuestions } from './lib/guide';
import {
  connectMidnightWallet,
  getInjectedWallets,
  shortenMidnightAddress,
  type InjectedMidnightWallet,
  type MidnightNetwork,
  type MidnightWalletConnection,
} from './lib/midnightWallet';

type Theme = 'dark' | 'light';
type BallotState = 'ready' | 'deployment-required';

const navItems = [
  { to: '/', label: 'Vote' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/privacy', label: 'Privacy model' },
  { to: '/guide', label: 'Kiri guide' },
  { to: '/launchpad', label: 'Launchpad' },
];

const options = [
  { id: 'allocate', index: '01', label: 'Allocate funds', description: 'Continue funding the Kage Protocol witness programme.' },
  { id: 'revise', index: '02', label: 'Return for revision', description: 'Request a smaller scope before the next vote window.' },
  { id: 'decline', index: '03', label: 'Decline allocation', description: 'Close the proposal without a treasury allocation.' },
];

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem('kagevote-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#09090b' : '#f4f0e8');
    window.localStorage.setItem('kagevote-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

function App() {
  const { theme, setTheme } = useTheme();
  const [wallet, setWallet] = useState<MidnightWalletConnection | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<MidnightNetwork>('preprod');
  const [walletOptions, setWalletOptions] = useState<InjectedMidnightWallet[]>([]);
  const [walletId, setWalletId] = useState('');
  const [walletError, setWalletError] = useState('');
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  function refreshWalletOptions() {
    const detected = getInjectedWallets().filter((candidate) => candidate.compatible);
    setWalletOptions(detected);
    setWalletId((current) => detected.some((candidate) => candidate.walletId === current) ? current : (detected[0]?.walletId ?? ''));
    return detected;
  }

  useEffect(() => {
    refreshWalletOptions();
    window.addEventListener('focus', refreshWalletOptions);
    return () => window.removeEventListener('focus', refreshWalletOptions);
  }, []);

  async function handleWallet() {
    if (wallet) {
      const connectedWalletName = wallet.walletName;
      setWallet(null);
      setWalletError(`Wallet details cleared from this KageVote session. ${connectedWalletName} remains connected until you revoke access in the wallet.`);
      return;
    }

    setWalletConnecting(true);
    setWalletError('');
    try {
      const detected = refreshWalletOptions();
      const selectedWalletId = detected.some((candidate) => candidate.walletId === walletId) ? walletId : detected[0]?.walletId;
      const connection = await connectMidnightWallet(walletNetwork, selectedWalletId);
      setWallet(connection);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Midnight wallet connection failed.');
    } finally {
      setWalletConnecting(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader
        theme={theme}
        toggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        wallet={wallet}
        walletOptions={walletOptions}
        walletId={walletId}
        walletNetwork={walletNetwork}
        walletConnecting={walletConnecting}
        onNetworkChange={setWalletNetwork}
        onWalletChoice={setWalletId}
        onWallet={() => void handleWallet()}
      />
      {walletError && <div className="wallet-notice" role="status">{walletError}</div>}
      <main className="content-rail">
        <Routes>
          <Route path="/" element={<VotePage wallet={wallet} onOpenGuide={() => setGuideOpen(true)} />} />
          <Route path="/proposals" element={<ProposalPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/guide" element={<GuidePage onOpenChat={() => setGuideOpen(true)} />} />
          <Route path="/launchpad" element={<LaunchpadPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <KiriChat open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}

function AppHeader({
  theme,
  toggleTheme,
  wallet,
  walletOptions,
  walletId,
  walletNetwork,
  walletConnecting,
  onNetworkChange,
  onWalletChoice,
  onWallet,
}: {
  theme: Theme;
  toggleTheme: () => void;
  wallet: MidnightWalletConnection | null;
  walletOptions: InjectedMidnightWallet[];
  walletId: string;
  walletNetwork: MidnightNetwork;
  walletConnecting: boolean;
  onNetworkChange: (network: MidnightNetwork) => void;
  onWalletChoice: (walletId: string) => void;
  onWallet: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="wordmark" to="/" aria-label="KageVote home">
          KAGE<span>//</span>VOTE
        </Link>
        <nav className={menuOpen ? 'desktop-nav mobile-open' : 'desktop-nav'} aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <label className="network-picker"><i /><span>NETWORK</span><select value={walletNetwork} onChange={(event) => onNetworkChange(event.target.value as MidnightNetwork)} disabled={Boolean(wallet)} aria-label="Midnight network"><option value="preview">PREVIEW</option><option value="preprod">PREPROD</option></select></label>
          <label className="network-picker wallet-picker"><WalletCards size={13} /><span>WALLET</span><select value={walletId} onChange={(event) => onWalletChoice(event.target.value)} disabled={Boolean(wallet)} aria-label="Midnight wallet">
            {!walletOptions.length && <option value="">DETECT WALLET</option>}
            {walletOptions.map((candidate) => <option key={candidate.walletId} value={candidate.walletId}>{candidate.name.toUpperCase()}</option>)}
          </select></label>
          <button className="icon-button theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className={wallet ? 'wallet-button connected' : 'wallet-button'} onClick={onWallet} disabled={walletConnecting} title={wallet?.address}>
            <WalletCards size={16} /> {walletConnecting ? 'Connecting...' : wallet ? shortenMidnightAddress(wallet.address) : 'Connect wallet'}
          </button>
          <button className="icon-button menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function PageIntro({ eyebrow, title, body, aside }: { eyebrow: string; title: ReactNode; body: string; aside?: ReactNode }) {
  return (
    <section className="page-intro reveal">
      <div>
        <p className="eyebrow"><span /> {eyebrow}</p>
        <h1>{title}</h1>
        <p className="intro-copy">{body}</p>
      </div>
      {aside}
    </section>
  );
}

function VotePage({ wallet, onOpenGuide }: { wallet: MidnightWalletConnection | null; onOpenGuide: () => void }) {
  const [choice, setChoice] = useState(options[0].id);
  const [ballotState, setBallotState] = useState<BallotState>('ready');
  const [ballots, setBallots] = useState(1_284);
  const [addressCopied, setAddressCopied] = useState(false);
  const [seconds, setSeconds] = useState(12 * 60 * 60 + 44 * 60 + 2);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
  }, [seconds]);

  function castBallot() {
    if (!wallet || ballotState !== 'ready') return;
    setBallotState('deployment-required');
  }

  async function copyWalletAddress() {
    if (!wallet) return;
    await navigator.clipboard?.writeText(wallet.address);
    setAddressCopied(true);
    window.setTimeout(() => setAddressCopied(false), 1_800);
  }

  return (
    <>
      <PageIntro
        eyebrow="ACTIVE PROPOSAL // #00824"
        title={<>Protocol treasury<br />allocation</>}
        body="Prove eligibility locally. Seal your selection privately. Let the public see only the proposal and its final aggregate tally."
        aside={<div className="countdown-card"><Clock3 size={18} /><strong>{countdown}</strong><span>PRIVATE BALLOT / PUBLIC TALLY</span></div>}
      />

      <section className="vote-grid">
        <article className="manga-panel vote-panel reveal delay-1">
          <div className="panel-heading">
            <div><p className="eyebrow"><span /> SELECT A POSITION</p><h2>Cast your sealed ballot</h2></div>
            <span className="step-count">01 / 03</span>
          </div>
          <p className="proposal-text">Shall the community treasury allocate 250,000 $NIGHT for continuous development of Kage Protocol privacy witnesses in the next cycle?</p>
          <div className="vote-options" role="radiogroup" aria-label="Ballot choices">
            {options.map((option) => {
              const selected = option.id === choice;
              return (
                <button key={option.id} className={selected ? 'vote-option selected' : 'vote-option'} onClick={() => { setChoice(option.id); setBallotState('ready'); }} role="radio" aria-checked={selected}>
                  <span className="option-index">{option.index}</span>
                  <span className="option-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
                  <span className="option-check">{selected && <Check size={18} />}</span>
                </button>
              );
            })}
          </div>
          <button className="primary-button" onClick={castBallot} disabled={!wallet || ballotState === 'deployment-required'}>
            {ballotState === 'ready' && <><LockKeyhole size={17} /> {wallet ? 'Cast private ballot' : 'Connect wallet to vote'}</>}
            {ballotState === 'deployment-required' && <><Info size={17} /> Deploy contract to enable voting</>}
          </button>
          <p className="helper-text"><Info size={14} /> {wallet ? `Connected to Midnight ${wallet.network}. Ballot calls unlock only after the real contract address and ZK artifacts are configured.` : 'Choose 1AM or Lace, then connect it on Preview or Preprod. KageVote never requests your seed phrase.'}</p>
          {!wallet && <div className="wallet-connect-tip"><ShieldCheck size={15} /><span>Choose <strong>1AM</strong> or <strong>Lace</strong>, then choose <strong>Preview</strong> or <strong>Preprod</strong> before connecting.</span></div>}
          {wallet && <div className="live-wallet-row"><span><i /> {wallet.walletName} CONNECTED // {wallet.network.toUpperCase()}</span><button onClick={() => void copyWalletAddress()} title="Copy shielded address" aria-live="polite">{addressCopied ? <Check size={14} /> : <Copy size={14} />}{addressCopied ? 'COPIED' : shortenMidnightAddress(wallet.address)}</button></div>}
        </article>

        <aside className="proof-column reveal delay-2">
          <article className="manga-panel proof-panel">
            <div className="panel-heading"><div><p className="eyebrow signal"><span /> PROOF TRACE</p><h2>What KageVote proves</h2></div><ShieldCheck className="signal-icon" size={22} /></div>
            <ProofStep number="01" title="Eligibility witness" body="Your member credential is checked locally." state="verified" />
            <ProofStep number="02" title="Ballot selection" body="Your option remains a private witness." state="waiting" />
            <ProofStep number="03" title="Aggregate tally" body="The public counter updates without a voter map." state="waiting" />
            <div className="proof-total"><span>PUBLIC BALLOTS RECORDED</span><strong>{ballots.toLocaleString()}</strong></div>
          </article>
          <button className="kiri-callout" onClick={onOpenGuide}>
            <img src="/assets/kiri-guide.png" alt="Kiri, KageVote's privacy guide" />
            <span><small>KIRI // PRIVACY GUIDE</small><strong>Need a hand? Ask what stays hidden.</strong></span><ChevronRight size={18} />
          </button>
        </aside>
      </section>

      {ballotState === 'deployment-required' && (
        <section className="receipt-banner reveal">
          <div><span className="eyebrow"><span /> LIVE WALLET VERIFIED</span><h2>Deployment is the remaining gate.</h2><p>{wallet?.walletName} is connected, but KageVote will not fabricate a ballot receipt until the Preprod contract, generated types, and ZK artifacts are deployed.</p></div>
          <Link className="receipt-action" to="/launchpad"><FileCode2 size={15} /> Open launchpad</Link>
        </section>
      )}

      <DisclosureMap />
    </>
  );
}

function ProofStep({ number, title, body, state }: { number: string; title: string; body: string; state: 'verified' | 'waiting' }) {
  return <div className={`proof-step ${state}`}><span className="proof-dot">{state === 'verified' ? <Check size={13} /> : number}</span><div><strong>{title}</strong><p>{body}</p></div>{state === 'verified' && <span className="verified-label">VERIFIED</span>}</div>;
}

function DisclosureMap() {
  return (
    <section className="disclosure-section reveal">
      <div className="section-label"><p className="eyebrow"><span /> SELECTIVE DISCLOSURE</p><h2>A visible result.<br />An invisible voter.</h2></div>
      <div className="disclosure-grid">
        <article className="disclosure-card public"><span className="card-flag">PUBLIC OBSERVER</span><h3>What the network can learn</h3><ul><li><Check size={16} />Proposal text and voting window</li><li><Check size={16} />Whether a proof satisfied the rules</li><li><Check size={16} />Aggregate ballots and final tally</li><li><Check size={16} />Contract execution result</li></ul></article>
        <article className="disclosure-card private"><span className="card-flag">PRIVATE WITNESS</span><h3>What stays in the shadow</h3><ul><li><LockKeyhole size={16} />Identity and wallet address</li><li><LockKeyhole size={16} />Individual ballot selection</li><li><LockKeyhole size={16} />Eligibility credential data</li><li><LockKeyhole size={16} />Local proof inputs</li></ul></article>
      </div>
    </section>
  );
}

function ProposalPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const proposals = [
    { id: '#00824', title: 'Protocol treasury allocation', status: 'active', label: '12H 44M LEFT', ballots: '1,284 private ballots' },
    { id: '#00823', title: 'Community research grants', status: 'closed', label: 'PASSED · 68%', ballots: '842 verified ballots' },
    { id: '#00822', title: 'Witness provider rotation', status: 'closed', label: 'DECLINED · 41%', ballots: '622 verified ballots' },
    { id: '#00821', title: 'Accessibility treasury reserve', status: 'closed', label: 'PASSED · 72%', ballots: '1,017 verified ballots' },
  ];
  const visible = filter === 'all' ? proposals : proposals.filter((proposal) => proposal.status === filter);

  return <><PageIntro eyebrow="GOVERNANCE ARCHIVE" title={<>Proposals without<br />a voter trail</>} body="Every proposal can be inspected in public. Each individual ballot remains private, even when a final decision is verifiable." />
    <section className="archive-toolbar reveal"><div className="filter-tabs" role="tablist">{(['all', 'active', 'closed'] as const).map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? 'active' : ''}>{tab}</button>)}</div><span className="archive-note"><Radio size={14} /> INDEXER SYNCED · DEMO DATA</span></section>
    <section className="proposal-list">{visible.map((proposal, index) => <article className={`proposal-row reveal delay-${Math.min(index + 1, 3)}`} key={proposal.id}><div className="proposal-id">{proposal.id}</div><div><h2>{proposal.title}</h2><p>{proposal.ballots} · voter identities remain private</p></div><span className={proposal.status === 'active' ? 'status active' : 'status'}>{proposal.label}</span><Link to="/" aria-label={`Open ${proposal.title}`}><ArrowRight size={19} /></Link></article>)}</section>
  </>;
}

function PrivacyPage() {
  return <><PageIntro eyebrow="PRIVACY MODEL" title={<>Disclosure is a<br />design decision.</>} body="KageVote uses Compact witnesses for private inputs and selective disclosure for the minimum public state a community needs to trust a result." />
    <section className="privacy-principles">
      <Principle icon={<LockKeyhole />} number="01" title="Witnesses stay local" body="Eligibility and ballot choices are private inputs used during proof generation. They are not written to public ledger state." />
      <Principle icon={<ShieldCheck />} number="02" title="Rules become proofs" body="The contract accepts a proof that a voter met the rules without collecting the underlying credential or identity." />
      <Principle icon={<Layers3 />} number="03" title="Tallies stay accountable" body="Proposal metadata, lifecycle, and final aggregate outcome are intentionally public so the process can be audited." />
    </section>
    <section className="disclosure-table-wrap reveal"><div className="table-heading"><div><p className="eyebrow"><span /> OBSERVER VIEW</p><h2>Exact disclosure map</h2></div><Link to="/launchpad">Read contract notes <ArrowRight size={15} /></Link></div><div className="disclosure-table"><div className="table-row table-head"><span>DATA POINT</span><span>VISIBILITY</span><span>WHY</span></div><DisclosureRow item="Proposal ID and text" visibility="Public" why="Communities need a shared object to deliberate." /><DisclosureRow item="Voting window" visibility="Public" why="Anyone can verify when ballots may be accepted." /><DisclosureRow item="Aggregate final tally" visibility="Public" why="The collective result must be independently checkable." /><DisclosureRow item="Wallet / identity" visibility="Private" why="Eligibility is proven without exposing who participated." /><DisclosureRow item="Ballot choice" visibility="Private" why="The choice is a local witness, not public ledger data." /><DisclosureRow item="Credential evidence" visibility="Private" why="Only the rule outcome is proved." /></div></section>
  </>;
}

function Principle({ icon, number, title, body }: { icon: ReactNode; number: string; title: string; body: string }) { return <article className="principle-card reveal"><span>{number}</span><div className="principle-icon">{icon}</div><h2>{title}</h2><p>{body}</p></article>; }
function DisclosureRow({ item, visibility, why }: { item: string; visibility: 'Public' | 'Private'; why: string }) { return <div className="table-row"><strong>{item}</strong><span className={visibility === 'Public' ? 'visibility public' : 'visibility private'}>{visibility === 'Public' ? <Check size={14} /> : <LockKeyhole size={13} />}{visibility}</span><p>{why}</p></div>; }

function GuidePage({ onOpenChat }: { onOpenChat: () => void }) {
  return <><PageIntro eyebrow="KIRI // PRIVACY ARCHIVIST" title={<>The guide who<br />keeps no secrets.</>} body="Kiri explains the experience without asking for your identity, your wallet, or your ballot. Start with a short question and stay in control." />
    <section className="guide-hero reveal"><div className="guide-image-wrap"><img src="/assets/kiri-guide.png" alt="Kiri, a moonlit privacy archivist holding a cyan lantern" /><span className="guide-badge">KIRI / LOCAL GUIDE</span></div><div className="guide-copy"><p className="eyebrow signal"><span /> HELLO, VOTER</p><h2>I will show you the boundary between what is proved and what is exposed.</h2><p>Use the guide for plain-language privacy questions. With a server-side Gemini key configured, Kiri can answer contextual questions; otherwise the guide stays fully local.</p><button className="primary-button" onClick={onOpenChat}><MessageCircle size={17} /> Talk to Kiri <ArrowRight size={16} /></button><div className="question-chips">{starterQuestions.map((question) => <button key={question} onClick={onOpenChat}>{question}<ChevronRight size={14} /></button>)}</div></div></section>
    <section className="guide-rules reveal"><p className="eyebrow"><span /> GUIDEBOUND PROTOCOL</p><h2>What Kiri will and will not do</h2><div className="guide-rules-grid"><article><Check size={19} /><h3>Explain the model</h3><p>Public state, witnesses, proofs, and preprod setup in everyday language.</p></article><article><Check size={19} /><h3>Keep guidance scoped</h3><p>Answers are limited to KageVote’s demo and privacy model.</p></article><article><X size={19} /><h3>Never request secrets</h3><p>Kiri will never ask for seed phrases, private keys, credentials, or a ballot choice.</p></article></div></section>
  </>;
}

function LaunchpadPage() {
  const [copied, setCopied] = useState(false);
  const command = 'npm run prepare:preprod';
  function copyCommand() { navigator.clipboard?.writeText(command); setCopied(true); window.setTimeout(() => setCopied(false), 1_800); }
  return <><PageIntro eyebrow="DEVELOPER LAUNCHPAD" title={<>From local proof<br />to Preprod.</>} body="The KageVote UI is a local demo. This launchpad keeps the path to an honest Midnight deployment visible, including the tooling that must exist before a real contract address is shown." />
    <section className="launch-grid"><article className="launch-checklist manga-panel reveal"><p className="eyebrow"><span /> RELEASE CHECKLIST</p><h2>Preprod readiness</h2><Checklist checked label="Node 22 runtime" detail="Detected for this workspace." /><Checklist label="Compact compiler" detail="Install the official compiler before running contract:compile." /><Checklist label="Proof server / Docker" detail="Required for local proving and deployment validation." /><Checklist label="Funded Preprod wallet" detail="Configure outside this repository; never commit secrets." /><Checklist label="Contract address" detail="Set only after a successful deployment." /></article>
      <article className="contract-card reveal delay-1"><div className="contract-card-top"><FileCode2 size={22} /><span>contracts/KageVote.compact</span></div><pre><code>{`witness eligibleMember(): Boolean;

export ledger totalBallots: Counter;

export circuit castPrivateBallot(): [] {
  assert(disclose(eligibleMember()),
    "Eligibility proof failed");
  totalBallots.increment(1);
}`}</code></pre><p>Public: the aggregate count. Private: eligibility data and the voter’s local witness.</p><button onClick={copyCommand}><Copy size={15} /> {copied ? 'Copied' : command}</button></article></section>
    <section className="integration-strip reveal"><Sparkles size={22} /><div><strong>Gemini is optional.</strong><p>Set <code>GEMINI_API_KEY</code> on the server to give Kiri live answers. The browser never receives the key; without it, Kiri uses local privacy responses.</p></div><a href="https://ai.google.dev/api" target="_blank" rel="noreferrer">API docs <ExternalLink size={14} /></a></section>
  </>;
}

function Checklist({ checked, label, detail }: { checked?: boolean; label: string; detail: string }) { return <div className="checklist-row"><span className={checked ? 'check-state done' : 'check-state'}>{checked ? <Check size={15} /> : '—'}</span><div><strong>{label}</strong><p>{detail}</p></div></div>; }

function KiriChat({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'guide' | 'user'; text: string }>>([{ role: 'guide', text: 'I’m Kiri. Ask what the public can see, what stays private, or how a proof works.' }]);
  const [loading, setLoading] = useState(false);

  async function send(message = input) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/kiri', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: trimmed }) });
      if (!response.ok) throw new Error('Guide server unavailable');
      const data = await response.json() as { text?: string };
      const answer = data.text;
      if (!answer) throw new Error('Empty response');
      setMessages((current) => [...current, { role: 'guide', text: answer }]);
    } catch {
      const fallback = localGuideReply(trimmed);
      setMessages((current) => [...current, { role: 'guide', text: `${fallback.title} ${fallback.body}` }]);
    } finally { setLoading(false); }
  }

  function onSubmit(event: FormEvent) { event.preventDefault(); void send(); }

  return <><button className="chat-fab" onClick={() => onOpenChange(!open)} aria-label="Open Kiri privacy guide"><img src="/assets/kiri-guide.png" alt="" /><span><i />Kiri</span></button>{open && <section className="chat-panel" aria-label="Kiri privacy guide"><header><div><img src="/assets/kiri-guide.png" alt="Kiri" /><span><strong>KIRI</strong><small><i /> LOCAL GUIDE {loading ? '· THINKING' : '· ONLINE'}</small></span></div><button className="icon-button" onClick={() => onOpenChange(false)} aria-label="Close guide"><X size={18} /></button></header><div className="chat-messages">{messages.map((message, index) => <p key={`${message.role}-${index}`} className={message.role}>{message.text}</p>)}{loading && <p className="guide typing"><span /><span /><span /></p>}</div><div className="quick-questions">{starterQuestions.map((question) => <button key={question} onClick={() => void send(question)}>{question}</button>)}</div><form onSubmit={onSubmit}><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} placeholder="Ask Kiri about privacy…" aria-label="Ask Kiri" /><button type="submit" aria-label="Send question"><ArrowRight size={18} /></button></form><footer>Never share seed phrases, private keys, or ballot choices.</footer></section>}</>;
}

function Footer() { return <footer className="site-footer"><div className="footer-mark">KAGE<span>//</span>VOTE</div><p>Private ballot · public tally · Midnight-ready demo</p><div><a href="https://midnight.network" target="_blank" rel="noreferrer">Midnight <ExternalLink size={13} /></a><a href="https://github.com" target="_blank" rel="noreferrer"><Code2 size={14} /> Source</a></div></footer>; }
function NotFound() { return <section className="not-found"><p className="eyebrow"><span /> LOST IN THE SHADOW</p><h1>This panel does not exist.</h1><Link className="primary-button" to="/">Return to the voting chamber <ArrowRight size={16} /></Link></section>; }

export default App;
