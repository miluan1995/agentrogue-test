/*
 * AgentRogue: on-chain run records (test).
 * At game over, show a ready-to-run `baw contract-call` command so the player's agent
 * can record the run on AgentRogueRecords (BNB Chain). Non-blocking overlay.
 */
import { encodeFunctionData, encodePacked, keccak256, parseAbi, toHex } from "viem";

export const RECORDS_ADDRESS = "0xE011596E90c90cCa54b3357ed3F15A1Cd958D060" as const;
const ABI = parseAbi(["function submitRun(uint32 wave, uint8 mode, bool victory, bytes32 seed, bytes32 runHash)"]);
const MODE_NAMES = ["经典", "无尽", "无尽·传说", "挑战", "每日"];

export interface RunInfo {
  wave: number;
  mode: number;
  victory: boolean;
  seed: string;
}

export function buildSubmit(wallet: string, run: RunInfo) {
  const seed = keccak256(toHex(run.seed || "none"));
  const runHash = keccak256(
    encodePacked(["address", "bytes32", "uint32", "uint64"], [wallet as `0x${string}`, seed, run.wave, BigInt(Date.now())]),
  );
  const data = encodeFunctionData({
    abi: ABI,
    functionName: "submitRun",
    args: [run.wave, run.mode & 0xff, run.victory, seed, runHash],
  });
  const cmd = `baw contract-call preview --binanceChainId 56 --from ${wallet} --to ${RECORDS_ADDRESS} --value 0 --inputData ${data} --json`;
  return { data, cmd };
}

export function showSubmit(run: RunInfo): void {
  const wallet: string | undefined = (window as any).agentWallet;
  if (!wallet || run.wave < 1 || document.getElementById("agent-records")) {
    return;
  }
  const { cmd } = buildSubmit(wallet, run);
  const el = document.createElement("div");
  el.id = "agent-records";
  el.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:9998;width:min(520px,calc(100% - 32px));background:#15151bf2;color:#f3eee0;border:1px solid #3a3320;border-radius:14px;padding:16px;font:14px -apple-system,'PingFang SC',sans-serif;box-shadow:0 10px 40px #0009";
  el.innerHTML = `
<div style="display:flex;justify-content:space-between;align-items:center">
  <b style="color:#f0b90b;font-size:16px">把这局记上链</b>
  <span id="ar-x" style="cursor:pointer;color:#888;font-size:18px">✕</span>
</div>
<p style="margin:6px 0;color:#b9b3a3">第 ${run.wave} 波 · ${MODE_NAMES[run.mode] ?? `模式${run.mode}`} · ${run.victory ? "通关" : "结束"}。让 agent 执行下面的命令，再执行 <code>baw contract-call execute --requestId &lt;requestId&gt; --json</code>。只花少量 gas，不转任何代币。</p>
<textarea readonly style="width:100%;box-sizing:border-box;height:90px;background:#0d0d12;color:#f3eee0;border:1px solid #333;border-radius:8px;padding:8px;font:12px ui-monospace,Menlo,monospace">${cmd}</textarea>
<div style="margin-top:8px;display:flex;gap:8px">
  <button id="ar-copy" style="background:#f0b90b;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer">复制命令</button>
  <a href="./leaderboard.html" target="_blank" style="background:#2a2a33;color:#f3eee0;border-radius:8px;padding:8px 14px;text-decoration:none">排行榜</a>
</div>`;
  document.body.appendChild(el);
  el.querySelector<HTMLElement>("#ar-x")!.onclick = () => el.remove();
  el.querySelector<HTMLElement>("#ar-copy")!.onclick = async () => {
    const ta = el.querySelector("textarea")!;
    try {
      await navigator.clipboard.writeText(ta.value);
    } catch {
      ta.select();
      document.execCommand("copy");
    }
    el.querySelector<HTMLElement>("#ar-copy")!.textContent = "已复制";
  };
}
