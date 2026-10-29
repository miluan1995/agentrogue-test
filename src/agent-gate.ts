/*
 * Agent ID gate (AgentRogue test fork).
 * Only a Binance Agentic Wallet holding an Agent ID can enter.
 * Flow: the player's agent signs an EIP-712 "Login" message with its wallet,
 * the page recovers the signer and checks registry.balanceOf(signer) > 0 on BNB Chain.
 */
import { createPublicClient, http, parseAbi, recoverTypedDataAddress, getAddress, isAddress, type Hex } from "viem";
import { bsc } from "viem/chains";

const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F" as const;
const SESSION_KEY = "agentGateSession";
const SESSION_MS = 24 * 60 * 60 * 1000;
const RPCS = ["https://bsc-dataseed.bnbchain.org", "https://bsc-dataseed1.defibit.io", "https://bsc-rpc.publicnode.com"];

const DOMAIN = { name: "AgentRogue", version: "1", chainId: 56 } as const;
const TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
  ],
  Login: [
    { name: "wallet", type: "address" },
    { name: "nonce", type: "string" },
    { name: "issuedAt", type: "uint256" },
    { name: "statement", type: "string" },
  ],
} as const;
const STATEMENT = "Enter AgentRogue with my Agent ID. This signature costs no gas and grants no token approval.";

interface Session {
  wallet: string;
  exp: number;
}

function getSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Session | null;
    if (s && s.exp > Date.now() && isAddress(s.wallet)) {
      return s;
    }
  } catch {}
  return null;
}

async function hasAgentId(wallet: `0x${string}`): Promise<boolean> {
  const abi = parseAbi(["function balanceOf(address) view returns (uint256)"]);
  let lastErr: unknown;
  for (const rpc of RPCS) {
    try {
      const client = createPublicClient({ chain: bsc, transport: http(rpc) });
      const bal = await client.readContract({ address: REGISTRY, abi, functionName: "balanceOf", args: [wallet] });
      return bal > 0n;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function typedData(wallet: string, nonce: string, issuedAt: number) {
  return {
    domain: DOMAIN,
    types: TYPES,
    primaryType: "Login" as const,
    message: { wallet, nonce, issuedAt: String(issuedAt), statement: STATEMENT },
  };
}

/** Accepts a 0x signature, a bare 130-hex signature, or baw's JSON output (signature + signatureRecovery). */
function normalizeSignature(raw: string): Hex {
  let text = raw.trim();
  let rec: string | undefined;
  if (text.startsWith("{")) {
    const j = JSON.parse(text);
    const d = j.data ?? j;
    text = String(d.signature ?? "");
    rec = d.signatureRecovery != null ? String(d.signatureRecovery) : undefined;
  }
  let hex = text.replace(/^0x/i, "").replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("签名格式不对");
  }
  if (hex.length === 128) {
    const r = Number.parseInt(rec ?? "0", 16);
    const v = r >= 27 ? r : r + 27;
    hex += v.toString(16).padStart(2, "0");
  } else if (hex.length === 130) {
    const v = Number.parseInt(hex.slice(128), 16);
    if (v < 27) {
      hex = hex.slice(0, 128) + (v + 27).toString(16).padStart(2, "0");
    }
  } else {
    throw new Error(`签名长度不对（${hex.length / 2} 字节）`);
  }
  return `0x${hex}` as Hex;
}

const CSS = `
#agent-gate{position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 0%,#2b2410,#0b0b0f 70%);color:#f3eee0;
font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;overflow:auto;padding:24px}
#agent-gate .card{width:min(720px,100%);background:#15151b;border:1px solid #3a3320;border-radius:16px;padding:28px;box-shadow:0 20px 60px #0008}
#agent-gate h1{margin:0 0 4px;font-size:26px;color:#f0b90b}
#agent-gate p{color:#b9b3a3;line-height:1.55;margin:8px 0}
#agent-gate label{display:block;margin:18px 0 6px;font-weight:600}
#agent-gate input,#agent-gate textarea{width:100%;box-sizing:border-box;background:#0d0d12;color:#f3eee0;border:1px solid #333;border-radius:10px;padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:13px}
#agent-gate textarea{min-height:110px;resize:vertical}
#agent-gate button{margin-top:12px;background:#f0b90b;color:#111;border:0;border-radius:10px;padding:11px 18px;font-weight:700;cursor:pointer;font-size:15px}
#agent-gate button.ghost{background:#2a2a33;color:#f3eee0;margin-left:8px}
#agent-gate .step{display:none}#agent-gate .step.on{display:block}
#agent-gate .msg{margin-top:12px;min-height:20px}#agent-gate .err{color:#ff7a6b}#agent-gate .ok{color:#7ee08a}
#agent-gate small{color:#7d786b}
`;

export function agentGate(): Promise<string> {
  const existing = getSession();
  if (existing) {
    (window as any).agentWallet = existing.wallet;
    return Promise.resolve(existing.wallet);
  }

  return new Promise(resolve => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.id = "agent-gate";
    root.innerHTML = `
<div class="card">
  <h1>AgentRogue · Agent ID 入口</h1>
  <p>测试版。只有持有 Agent ID 的币安 AI 钱包能进入。签名不花 gas，也不授权任何代币。 <a href="./leaderboard.html" target="_blank" style="color:#f0b90b">查看排行榜 →</a></p>
  <div class="step on" id="ag-s1">
    <label>你的 AI 钱包地址（BNB Chain）</label>
    <input id="ag-addr" placeholder="0x..." autocomplete="off" spellcheck="false" />
    <button id="ag-next">生成登录签名请求</button>
  </div>
  <div class="step" id="ag-s2">
    <label>1. 把下面这段交给你的 agent，让它用 AI 钱包签名</label>
    <textarea id="ag-cmd" readonly></textarea>
    <button class="ghost" id="ag-copy" style="margin-left:0">复制</button>
    <p><small>agent 先执行这条 preview，再执行 <code>baw sign-message execute --requestId &lt;requestId&gt; --json</code>，把输出整段贴回来。</small></p>
    <label>2. 粘贴签名结果（execute 的 JSON 输出，或 0x 签名）</label>
    <textarea id="ag-sig" placeholder='{"success":true,"data":{"signature":"...","signatureRecovery":"01"}}'></textarea>
    <button id="ag-verify">验证并进入</button><button class="ghost" id="ag-back">换地址</button>
  </div>
  <div class="msg" id="ag-msg"></div>
</div>`;
    document.body.appendChild(root);

    const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
    const msg = (t: string, cls = "") => {
      const m = $("ag-msg");
      m.className = `msg ${cls}`;
      m.textContent = t;
    };
    let pending: { wallet: `0x${string}`; nonce: string; issuedAt: number } | null = null;

    $("ag-next").onclick = async () => {
      const a = $<HTMLInputElement>("ag-addr").value.trim();
      if (!isAddress(a)) {
        msg("地址格式不对", "err");
        return;
      }
      const wallet = getAddress(a);
      msg("正在查链上 Agent ID…");
      try {
        if (!(await hasAgentId(wallet))) {
          msg("这个地址没有 Agent ID，无法进入。", "err");
          return;
        }
      } catch {
        msg("BNB Chain RPC 暂时连不上，请稍后再试。", "err");
        return;
      }
      const nonce = crypto.getRandomValues(new Uint32Array(4)).reduce((s, n) => s + n.toString(16).padStart(8, "0"), "");
      const issuedAt = Math.floor(Date.now() / 1000);
      pending = { wallet, nonce, issuedAt };
      const td = JSON.stringify(typedData(wallet, nonce, issuedAt));
      const req = JSON.stringify({ method: "eth_signTypedData_v4", params: [wallet, td] });
      const shellQuoted = `'${req.replace(/'/g, `'\\''`)}'`;
      $<HTMLTextAreaElement>("ag-cmd").value = `baw sign-message preview --binanceChainId 56 --signType EIP712 --message ${shellQuoted} --json`;
      $("ag-s1").classList.remove("on");
      $("ag-s2").classList.add("on");
      msg("已确认持有 Agent ID。等待签名。", "ok");
    };
    $("ag-back").onclick = () => {
      pending = null;
      $("ag-s2").classList.remove("on");
      $("ag-s1").classList.add("on");
      msg("");
    };
    $("ag-copy").onclick = async () => {
      const ta = $<HTMLTextAreaElement>("ag-cmd");
      try {
        await navigator.clipboard.writeText(ta.value);
      } catch {
        ta.select();
        document.execCommand("copy");
      }
      msg("已复制", "ok");
    };
    $("ag-verify").onclick = async () => {
      if (!pending) {
        return;
      }
      if (Date.now() / 1000 - pending.issuedAt > 15 * 60) {
        msg("签名请求已过期，请换地址重新生成。", "err");
        return;
      }
      try {
        const signature = normalizeSignature($<HTMLTextAreaElement>("ag-sig").value);
        const td = typedData(pending.wallet, pending.nonce, pending.issuedAt);
        const { EIP712Domain: _d, ...types } = td.types;
        const signer = await recoverTypedDataAddress({
          domain: td.domain,
          types,
          primaryType: "Login",
          message: { ...td.message, wallet: pending.wallet, issuedAt: BigInt(pending.issuedAt) },
          signature,
        });
        if (getAddress(signer) !== pending.wallet) {
          msg(`签名者是 ${signer}，与填写的地址不符。`, "err");
          return;
        }
        if (!(await hasAgentId(pending.wallet))) {
          msg("这个地址没有 Agent ID，无法进入。", "err");
          return;
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({ wallet: pending.wallet, exp: Date.now() + SESSION_MS }));
        (window as any).agentWallet = pending.wallet;
        msg("验证通过，正在进入…", "ok");
        setTimeout(() => {
          root.remove();
          style.remove();
          resolve(pending!.wallet);
        }, 400);
      } catch (e) {
        msg(`验证失败：${(e as Error).message}`, "err");
      }
    };
  });
}

export function agentGateLogout(): void {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}
