import React from "react";
import { useStitchNavigation } from "../navigation";

const markup = `
  <div class="flex flex-1 min-h-screen">
    <!-- MP Navigation Sidebar -->
    <aside class="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between shrink-0 p-4 fixed top-0 bottom-0 left-0 z-20">
      <div class="space-y-6">
        <!-- Brand Header -->
        <div class="px-2 pt-1">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-xl text-primary">account_balance</span>
            <div>
              <h1 class="text-sm font-bold text-on-surface tracking-tight leading-tight">MPLADS Portal</h1>
              <p class="text-[11px] text-on-surface-variant font-medium">MP Project Oversight</p>
            </div>
          </div>
        </div>

        <!-- Navigation Items -->
        <nav class="space-y-1">
          <a href="#" class="flex items-center gap-3 px-3 py-2 bg-primary text-white rounded-[10px] text-xs font-semibold shadow-sm transition-colors">
            <span class="material-symbols-outlined text-[18px] text-white">dashboard</span>
            <span class="">Overview</span>
          </a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-[10px] text-xs font-medium transition-colors">
            <span class="material-symbols-outlined text-[18px]">folder_open</span>
            <span class="">My Projects</span>
          </a>
        </nav>
      </div>

      <!-- Bottom Profile & Support -->
      <div class="space-y-4 pt-4 border-t border-outline-variant">
        <div class="space-y-1">
          <a href="#" class="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant hover:text-on-surface text-xs font-medium rounded-md hover:bg-surface-container-low transition-colors">
            <span class="material-symbols-outlined text-[18px]">settings</span>
            <span class="">Settings</span>
          </a>
          <a href="#" class="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant hover:text-on-surface text-xs font-medium rounded-md hover:bg-surface-container-low transition-colors">
            <span class="material-symbols-outlined text-[18px]">help_outline</span>
            <span class="">Support</span>
          </a>
        </div>

        <!-- User Block -->
        <div class="flex items-center gap-3 p-2.5 bg-surface-container-low rounded-[10px] border border-outline-variant">
          <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs shrink-0">
            MP
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-on-surface truncate">Member of Parliament</p>
            <p class="text-[11px] text-on-surface-variant truncate">Gaya Constituency</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Workspace Content Area -->
    <main class="flex-1 ml-64 flex flex-col min-w-0 bg-surface">
      <!-- Top Minimal Header -->
      <header class="h-14 bg-surface-container-lowest border-b border-outline-variant px-8 flex items-center justify-between sticky top-0 z-10"><div class="flex items-center gap-4 flex-1 max-w-xl"><div class="relative w-full"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span><input type="text" placeholder="Search projects, reference codes, or locations..." class="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-md text-xs text-on-surface placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"></div></div><div class="flex items-center gap-3"><div class="flex items-center gap-2 px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded-md"><span class="w-1.5 h-1.5 rounded-full bg-verified-green shrink-0"></span><span class="text-xs font-medium text-on-surface">Member of Parliament</span></div><button type="button" class="p-1.5 text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container-low transition-colors"><span class="material-symbols-outlined text-[18px]">notifications</span></button><button type="button" class="p-1.5 text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container-low transition-colors"><span class="material-symbols-outlined text-[18px]">help_outline</span></button></div></header>

      <!-- Content Container -->
      <div class="px-8 py-6 max-w-7xl mx-auto w-full space-y-6"><div class="space-y-1"><div class="flex items-center gap-2 text-xs text-on-surface-variant"><span class="font-medium">MPLADS</span><span class="text-slate-300">/</span><span class="font-medium">Parliamentary Oversight</span><span class="text-slate-300">/</span><span class="text-on-surface font-semibold">Gaya</span></div><div class="pt-1 space-y-1"><h1 class="text-2xl font-bold text-on-surface tracking-tight">MP Overview</h1><p class="text-xs text-on-surface-variant">Review risk signals across your recommended MPLADS projects</p></div></div><section aria-label="Summary KPIs"><div class="bg-surface-container-lowest border border-outline-variant rounded-[10px] divide-x divide-outline-variant grid grid-cols-4 shadow-sm"><div class="p-3.5 px-5 flex flex-col justify-between"><span class="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">Recommended Projects</span><span class="text-2xl font-bold text-on-surface tracking-tight mt-1">24</span></div><div class="p-3.5 px-5 flex flex-col justify-between"><span class="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">Flagged Projects</span><span class="text-2xl font-bold text-on-surface tracking-tight mt-1">5</span></div><div class="p-3.5 px-5 flex flex-col justify-between"><div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-risk-high"></span><span class="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">High Risk</span></div><span class="text-2xl font-bold text-risk-high tracking-tight mt-1">2</span></div><div class="p-3.5 px-5 flex flex-col justify-between"><span class="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">Projects to Review</span><span class="text-2xl font-bold text-on-surface tracking-tight mt-1">5</span></div></div></section><section class="space-y-4" aria-label="Monitored Projects"><div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1"><div><h2 class="text-base font-bold text-on-surface tracking-tight">My Projects</h2><p class="text-xs text-on-surface-variant mt-0.5">Your recommended projects with current risk signals.</p></div><div class="flex items-center gap-2.5"><div class="relative"><span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span><input type="text" placeholder="Search projects..." class="pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-[8px] text-xs text-on-surface placeholder:text-slate-400 focus:outline-none focus:border-primary w-52 transition-colors"></div><div class="flex items-center bg-surface-container-lowest border border-outline-variant rounded-[8px] px-2.5 py-1.5 text-xs text-on-surface font-medium"><span class="text-on-surface-variant mr-1.5 font-normal">Risk:</span><select class="bg-transparent focus:outline-none cursor-pointer pr-1 text-on-surface font-medium text-xs"><option selected="">All</option><option>High</option><option>Medium</option></select></div><div class="flex items-center bg-surface-container-lowest border border-outline-variant rounded-[8px] px-2.5 py-1.5 text-xs text-on-surface font-medium"><span class="text-on-surface-variant mr-1.5 font-normal">Category:</span><select class="bg-transparent focus:outline-none cursor-pointer pr-1 text-on-surface font-medium text-xs"><option selected="">All</option><option>Community Infrastructure</option><option>Rural Electrification</option><option>Drinking Water</option><option>Education &amp; Public Facilities</option><option>Roads &amp; Bridges</option></select></div></div></div><div class="space-y-3"><!-- Project 1: High Risk -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 transition-all hover:border-slate-300 space-y-2.5 shadow-sm">
  <div class="flex items-start justify-between gap-4">
    <div class="space-y-1 min-w-0">
      <h3 class="text-base font-semibold text-on-surface tracking-tight truncate">Construction of Community Hall, Ward 12</h3>
      <div class="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span class="font-mono text-xs text-slate-400">MPLADS-GY-2023-881</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-slate-700 font-medium">Tekari Block, Gaya</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-on-surface-variant">Community Infrastructure</span>
      </div>
    </div>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-risk-high bg-risk-high-bg border border-risk-high-border shrink-0">
      <span class="w-1.5 h-1.5 rounded-full bg-risk-high"></span>High Risk
    </span>
  </div>
  <div class="flex items-center gap-2">
    <span class="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">Sanctioned Amount:</span>
    <span class="text-sm font-semibold text-on-surface">₹24,50,000</span>
  </div>
  <div class="bg-surface-container-low rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-4">
    <div class="space-y-0.5 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-risk-high shrink-0"></span>
        <span class="text-[10px] font-bold uppercase tracking-wider text-risk-high">Why this was flagged</span>
      </div>
      <p class="text-xs text-slate-700 leading-relaxed truncate md:whitespace-normal">Possible duplicate work identified. A related project appears to overlap in location and scope within the same ward.</p>
    </div>
    <a href="#" class="inline-flex items-center gap-1 text-xs font-medium text-on-surface hover:text-primary hover:underline transition-colors shrink-0">
      <span class="">View project</span>
      <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
    </a>
  </div>
</div>

<!-- Project 2: High Risk -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 transition-all hover:border-slate-300 space-y-2.5 shadow-sm">
  <div class="flex items-start justify-between gap-4">
    <div class="space-y-1 min-w-0">
      <h3 class="text-base font-semibold text-on-surface tracking-tight truncate">Solar High-Mast Street Lighting Installation</h3>
      <div class="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span class="font-mono text-xs text-slate-400">MPLADS-GY-2023-904</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-slate-700 font-medium">Fatehpur Panchayat, Gaya</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-on-surface-variant">Rural Electrification</span>
      </div>
    </div>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-risk-high bg-risk-high-bg border border-risk-high-border shrink-0">
      <span class="w-1.5 h-1.5 rounded-full bg-risk-high"></span>High Risk
    </span>
  </div>
  <div class="flex items-center gap-2">
    <span class="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">Sanctioned Amount:</span>
    <span class="text-sm font-semibold text-on-surface">₹18,20,000</span>
  </div>
  <div class="bg-surface-container-low rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-4">
    <div class="space-y-0.5 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-risk-high shrink-0"></span>
        <span class="text-[10px] font-bold uppercase tracking-wider text-risk-high">Why this was flagged</span>
      </div>
      <p class="text-xs text-slate-700 leading-relaxed truncate md:whitespace-normal">Project cost is unusually high compared with comparable works in historical district rate schedules.</p>
    </div>
    <a href="#" class="inline-flex items-center gap-1 text-xs font-medium text-on-surface hover:text-primary hover:underline transition-colors shrink-0">
      <span class="">View project</span>
      <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
    </a>
  </div>
</div>

<!-- Project 3: High Risk -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 transition-all hover:border-slate-300 space-y-2.5 shadow-sm">
  <div class="flex items-start justify-between gap-4">
    <div class="space-y-1 min-w-0">
      <h3 class="text-base font-semibold text-on-surface tracking-tight truncate">Installation of Deep Tube Well &amp; RO Plant</h3>
      <div class="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span class="font-mono text-xs text-slate-400">MPLADS-GY-2023-956</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-slate-700 font-medium">Bodhan Bigha Village, Gaya</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-on-surface-variant">Drinking Water</span>
      </div>
    </div>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-risk-high bg-risk-high-bg border border-risk-high-border shrink-0">
      <span class="w-1.5 h-1.5 rounded-full bg-risk-high"></span>High Risk
    </span>
  </div>
  <div class="flex items-center gap-2">
    <span class="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">Sanctioned Amount:</span>
    <span class="text-sm font-semibold text-on-surface">₹12,80,000</span>
  </div>
  <div class="bg-surface-container-low rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-4">
    <div class="space-y-0.5 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-risk-high shrink-0"></span>
        <span class="text-[10px] font-bold uppercase tracking-wider text-risk-high">Why this was flagged</span>
      </div>
      <p class="text-xs text-slate-700 leading-relaxed truncate md:whitespace-normal">Possible duplicate work identified. Another proposal in proximate boundary requests equivalent water extraction infrastructure.</p>
    </div>
    <a href="#" class="inline-flex items-center gap-1 text-xs font-medium text-on-surface hover:text-primary hover:underline transition-colors shrink-0">
      <span class="">View project</span>
      <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
    </a>
  </div>
</div>

<!-- Project 4: Medium Risk -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 transition-all hover:border-slate-300 space-y-2.5 shadow-sm">
  <div class="flex items-start justify-between gap-4">
    <div class="space-y-1 min-w-0">
      <h3 class="text-base font-semibold text-on-surface tracking-tight truncate">Upgradation of Government Middle School Library</h3>
      <div class="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span class="font-mono text-xs text-slate-400">MPLADS-GY-2023-810</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-slate-700 font-medium">Wazirganj, Gaya</span>
        <span class="text-slate-300">·</span>
        <span class="text-xs text-on-surface-variant">Education &amp; Public Facilities</span>
      </div>
    </div>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 shrink-0">
      <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Medium Risk
    </span>
  </div>
  <div class="flex items-center gap-2">
    <span class="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">Sanctioned Amount:</span>
    <span class="text-sm font-semibold text-on-surface">₹15,00,000</span>
  </div>
  <div class="bg-surface-container-low rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-4">
    <div class="space-y-0.5 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-600">Why this was flagged</span>
      </div>
      <p class="text-xs text-slate-700 leading-relaxed truncate md:whitespace-normal">Civil renovation expenditure per sq. meter deviates from historical district baseline benchmarks.</p>
    </div>
    <a href="#" class="inline-flex items-center gap-1 text-xs font-medium text-on-surface hover:text-primary hover:underline transition-colors shrink-0">
      <span class="">View project</span>
      <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
    </a>
  </div>
</div></div></section><section class="space-y-3 pt-2" aria-label="Unflagged Projects"><div class="flex items-center justify-between"><div><h2 class="text-xs font-semibold text-on-surface tracking-tight flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-verified-green"></span><span class="">Projects without current risk signals</span><span class="text-[11px] font-normal text-on-surface-variant">(19 projects)</span></h2><p class="text-[11px] text-on-surface-variant">These recommended works have satisfied baseline duplicate and cost verification checks.</p></div><button class="text-xs text-on-surface-variant hover:text-on-surface font-medium transition-colors">Show all unflagged projects ▾</button></div><div class="bg-surface-container-lowest border border-outline-variant rounded-[10px] divide-y divide-slate-100"><div class="p-3 px-4 flex items-center justify-between text-xs"><div class="flex items-center gap-3"><span class="text-[11px] font-mono text-on-surface-variant">MPLADS-GY-2023-612</span><span class="font-medium text-on-surface">Construction of Primary Health Sub-Centre Boundary</span><span class="text-slate-300">·</span><span class="text-on-surface-variant">Fatehpur</span></div><div class="flex items-center gap-4"><span class="text-on-surface-variant">₹8,40,000</span><span class="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium"><span class="w-1.5 h-1.5 rounded-full bg-verified-green"></span>Verified Baseline</span><a href="#" class="text-on-surface-variant hover:text-on-surface text-xs">View →</a></div></div><div class="p-3 px-4 flex items-center justify-between text-xs"><div class="flex items-center gap-3"><span class="text-[11px] font-mono text-on-surface-variant">MPLADS-GY-2023-589</span><span class="font-medium text-on-surface">Community Drainage System, Ward 8</span><span class="text-slate-300">·</span><span class="text-on-surface-variant">Tekari</span></div><div class="flex items-center gap-4"><span class="text-on-surface-variant">₹11,20,000</span><span class="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium"><span class="w-1.5 h-1.5 rounded-full bg-verified-green"></span>Verified Baseline</span><a href="#" class="text-on-surface-variant hover:text-on-surface text-xs">View →</a></div></div></div></section></div>

      <!-- Institutional Footer -->
      <footer class="mt-auto border-t border-outline-variant bg-surface-container-lowest py-3.5 px-8 text-xs text-on-surface-variant flex justify-between items-center">
        <span class="">National Informatics Centre · Ministry of Statistics and Programme Implementation</span>
        <span class="">Government of India Oversight Framework</span>
      </footer>
    </main>
  </div>






`;

export default function MPOverview() {
  useStitchNavigation();
  return (
    <div
      className="stitch-page-root"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
