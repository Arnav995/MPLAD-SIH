import React from "react";
import { useStitchNavigation } from "../navigation";

const markup = `
<!-- TOP APP BAR -->
<header class="fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest border-b border-outline-variant z-30 flex items-center justify-between px-6">
<div class="flex items-center gap-6 w-64 shrink-0">
<div>
<h1 class="font-headline-sm text-headline-sm text-on-surface leading-tight tracking-tight">MPLADS Portal</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant font-normal">MP Project Oversight</p>
</div>
</div>
<!-- Center Search Bar -->
<div class="flex-1 max-w-2xl px-4">
<div class="relative flex items-center">
<span class="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none" data-icon="search">search</span>
<input class="w-full h-9 pl-9 pr-4 bg-surface text-on-surface placeholder:text-outline border border-outline-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors" placeholder="Search projects, reference codes, or locations..." type="text">
</div>
</div>
<!-- Right Actions & MP Profile Pill -->
<div class="flex items-center gap-3 shrink-0">
<div class="flex items-center gap-2 bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-full">
<span class="w-2 h-2 rounded-full bg-[#06C167] shrink-0"></span>
<span class="font-label-md text-label-md text-on-surface font-medium">Member of Parliament</span>
</div>
<button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors" title="Notifications">
<span class="material-symbols-outlined text-[20px]" data-icon="notifications">notifications</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors" title="Support &amp; Help">
<span class="material-symbols-outlined text-[20px]" data-icon="help">help</span>
</button>
</div>
</header>
<div class="flex pt-14">
<!-- LEFT SIDEBAR -->
<aside class="fixed top-0 left-0 w-64 h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between p-4 z-30">
  <div>
    <!-- Branding -->
    <div class="h-14 flex items-center px-2 mb-2 border-b border-outline-variant"><div>
        <h1 class="text-lg font-bold text-neutral-900 leading-tight tracking-tight">MPLADS Portal</h1>
        <p class="text-xs text-neutral-500 font-normal mt-0.5">MP Project Oversight</p>
      </div></div>
    <!-- Primary Navigation Links -->
    <nav class="space-y-1"><a class="flex items-center gap-3 px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg text-sm font-medium transition-colors" href="#">
        <span class="material-symbols-outlined text-[22px]" data-icon="dashboard">dashboard</span>
        <span class="">Overview</span>
      </a>
      <a class="flex items-center gap-3 px-3.5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium shadow-none" href="#">
        <span class="material-symbols-outlined text-[22px] text-white" data-icon="fact_check">fact_check</span>
        <span class="font-semibold text-white">My Projects</span>
      </a></nav>
  </div>
  <!-- Bottom Area Anchored to Very Bottom -->
  <div class="space-y-4 pt-4 border-t border-outline-variant"><div class="space-y-1">
      <a class="flex items-center gap-3 px-3.5 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg text-sm font-medium transition-colors" href="#">
        <span class="material-symbols-outlined text-[20px]" data-icon="settings">settings</span>
        <span class="">Settings</span>
      </a>
      <a class="flex items-center gap-3 px-3.5 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg text-sm font-medium transition-colors" href="#">
        <span class="material-symbols-outlined text-[20px]" data-icon="help_outline">help_outline</span>
        <span class="">Support</span>
      </a>
    </div>
    <div class="flex items-center gap-3 pt-3 border-t border-outline-variant px-1">
      <div class="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-sm font-bold text-neutral-900 shrink-0">
        MP
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-neutral-900 truncate">Member of Parliament</p>
        <p class="text-xs text-neutral-500 truncate mt-0.5">Gaya Constituency</p>
      </div>
    </div></div>
</aside>
<!-- MAIN CONTENT CANVAS -->
<main class="ml-64 flex-1 p-8 max-w-7xl">
<!-- Breadcrumb -->
<div class="font-label-sm text-label-sm font-medium text-neutral-400 mb-2">
        MPLADS / Parliamentary Oversight / Gaya
      </div>
<!-- Page Titles -->
<h1 class="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">My Projects</h1>
<p class="text-base text-neutral-500 mt-1 mb-6">All MPLADS projects recommended by you.</p>
<!-- 1. COMPACT SUMMARY STRIP -->
<div class="inline-flex items-center gap-3 px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm mb-6 shadow-none">
<span class="text-neutral-900 font-semibold">24 projects</span>
<span class="text-neutral-300">·</span>
<span class="text-neutral-700 font-medium">5 flagged</span>
<span class="text-neutral-300">·</span>
<span class="inline-flex items-center gap-1.5 text-[#B91C1C] font-semibold">
<span class="w-2 h-2 rounded-full bg-[#B91C1C]"></span>
2 high risk
</span>
</div>
<!-- 2. SEARCH & FILTER CONTROL BAR -->
<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4"><!-- Search input -->
<div class="relative w-full sm:w-80">
<span class="material-symbols-outlined absolute left-3.5 top-3 text-neutral-400 text-[20px] pointer-events-none" data-icon="search">search</span>
<input class="w-full h-11 pl-10 pr-4 bg-white text-neutral-900 placeholder:text-neutral-400 border border-outline-variant rounded-lg text-sm font-normal focus:outline-none focus:border-primary focus:ring-0 transition-colors" placeholder="Search projects..." type="text">
</div>
<!-- Filters -->
<div class="flex items-center gap-3">
<div class="relative">
<select class="appearance-none h-11 pl-3.5 pr-9 bg-white border border-outline-variant rounded-lg text-sm font-medium text-neutral-800 focus:outline-none focus:border-primary focus:ring-0 cursor-pointer">
<option>Risk: All</option>
<option>Risk: High</option>
<option>Risk: Medium</option>
<option>Risk: Low</option>
</select>
<span class="material-symbols-outlined absolute right-2.5 top-3 text-neutral-400 text-[20px] pointer-events-none" data-icon="arrow_drop_down">arrow_drop_down</span>
</div>
<div class="relative">
<select class="appearance-none h-11 pl-3.5 pr-9 bg-white border border-outline-variant rounded-lg text-sm font-medium text-neutral-800 focus:outline-none focus:border-primary focus:ring-0 cursor-pointer">
<option>Category: All</option>
<option>Community Infrastructure</option>
<option>Rural Electrification</option>
<option>Drinking Water</option>
<option>Education &amp; Public Facilities</option>
<option>Healthcare</option>
</select>
<span class="material-symbols-outlined absolute right-2.5 top-3 text-neutral-400 text-[20px] pointer-events-none" data-icon="arrow_drop_down">arrow_drop_down</span>
</div>
</div></div>
<!-- 3. PROJECT DIRECTORY TABLE / LIST HYBRID -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-none">
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse"><thead>
<tr class="border-b border-outline-variant bg-[#F9FAFB] text-xs font-semibold text-neutral-500 uppercase tracking-wider">
<th class="py-3.5 px-6 w-[32%]">PROJECT</th>
<th class="py-3.5 px-6 w-[12%]">LOCATION</th>
<th class="py-3.5 px-6 w-[13%]">CATEGORY</th>
<th class="py-3.5 px-6 w-[14%] text-right">SANCTIONED AMOUNT</th>
<th class="py-3.5 px-6 w-[9%]">RISK</th>
<th class="py-3.5 px-6 w-[15%]">WHY FLAGGED</th>
<th class="py-3.5 px-6 w-[5%] text-right">ACTION</th>
</tr>
</thead>
<tbody class="divide-y divide-[#F3F4F6]">
<!-- Row 1: High Risk -->
<tr class="hover:bg-[#F9FAFB] transition-colors">
<td class="py-4.5 px-6">
<div class="text-base font-semibold text-neutral-900 leading-snug">Construction of Community Hall, Ward 12</div>
<div class="font-mono text-xs text-neutral-500 mt-1">MPLADS-GY-2023-881</div>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Tekari Block, Gaya
</td>
<td class="py-4.5 px-6 text-sm text-neutral-600 leading-normal">
Community Infrastructure
</td>
<td class="py-4.5 px-6 text-right font-mono text-base font-semibold text-neutral-900 tabular-nums">
₹24,50,000
</td>
<td class="py-4.5 px-6">
<span class="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50/70 border border-red-200 px-2.5 py-1 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-[#B91C1C]"></span>
High
</span>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Possible duplicate work identified
</td>
<td class="py-4.5 px-6 text-right">
<a class="text-sm font-semibold text-neutral-900 hover:text-black transition-colors whitespace-nowrap" href="#">View →</a>
</td>
</tr>
<!-- Row 2: High Risk -->
<tr class="hover:bg-[#F9FAFB] transition-colors">
<td class="py-4.5 px-6">
<div class="text-base font-semibold text-neutral-900 leading-snug">Solar High-Mast Street Lighting Installation</div>
<div class="font-mono text-xs text-neutral-500 mt-1">MPLADS-GY-2023-904</div>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Fatehpur Panchayat, Gaya
</td>
<td class="py-4.5 px-6 text-sm text-neutral-600 leading-normal">
Rural Electrification
</td>
<td class="py-4.5 px-6 text-right font-mono text-base font-semibold text-neutral-900 tabular-nums">
₹18,20,000
</td>
<td class="py-4.5 px-6">
<span class="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50/70 border border-red-200 px-2.5 py-1 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-[#B91C1C]"></span>
High
</span>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Cost unusually high for comparable works
</td>
<td class="py-4.5 px-6 text-right">
<a class="text-sm font-semibold text-neutral-900 hover:text-black transition-colors whitespace-nowrap" href="#">View →</a>
</td>
</tr>
<!-- Row 3: High Risk -->
<tr class="hover:bg-[#F9FAFB] transition-colors">
<td class="py-4.5 px-6">
<div class="text-base font-semibold text-neutral-900 leading-snug">Installation of Deep Tube Well &amp; RO Plant</div>
<div class="font-mono text-xs text-neutral-500 mt-1">MPLADS-GY-2023-956</div>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Bodhan Bigha Village, Gaya
</td>
<td class="py-4.5 px-6 text-sm text-neutral-600 leading-normal">
Drinking Water
</td>
<td class="py-4.5 px-6 text-right font-mono text-base font-semibold text-neutral-900 tabular-nums">
₹12,80,000
</td>
<td class="py-4.5 px-6">
<span class="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50/70 border border-red-200 px-2.5 py-1 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-[#B91C1C]"></span>
High
</span>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Possible duplicate work identified
</td>
<td class="py-4.5 px-6 text-right">
<a class="text-sm font-semibold text-neutral-900 hover:text-black transition-colors whitespace-nowrap" href="#">View →</a>
</td>
</tr>
<!-- Row 4: Medium Risk -->
<tr class="hover:bg-[#F9FAFB] transition-colors">
<td class="py-4.5 px-6">
<div class="text-base font-semibold text-neutral-900 leading-snug">Upgradation of Government Middle School Library</div>
<div class="font-mono text-xs text-neutral-500 mt-1">MPLADS-GY-2023-810</div>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Wazirganj, Gaya
</td>
<td class="py-4.5 px-6 text-sm text-neutral-600 leading-normal">
Education &amp; Public Facilities
</td>
<td class="py-4.5 px-6 text-right font-mono text-base font-semibold text-neutral-900 tabular-nums">
₹15,00,000
</td>
<td class="py-4.5 px-6">
<span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
Medium
</span>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Spending pattern requires review
</td>
<td class="py-4.5 px-6 text-right">
<a class="text-sm font-semibold text-neutral-900 hover:text-black transition-colors whitespace-nowrap" href="#">View →</a>
</td>
</tr>
<!-- Row 5: Medium Risk -->
<tr class="hover:bg-[#F9FAFB] transition-colors">
<td class="py-4.5 px-6">
<div class="text-base font-semibold text-neutral-900 leading-snug">Construction of CC Road from Main Road to Harijan Tola</div>
<div class="font-mono text-xs text-neutral-500 mt-1">MPLADS-GY-2023-742</div>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Manpur Block, Gaya
</td>
<td class="py-4.5 px-6 text-sm text-neutral-600 leading-normal">
Rural Road Infrastructure
</td>
<td class="py-4.5 px-6 text-right font-mono text-base font-semibold text-neutral-900 tabular-nums">
₹22,40,000
</td>
<td class="py-4.5 px-6">
<span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
Medium
</span>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Cost variation vs district rate schedule
</td>
<td class="py-4.5 px-6 text-right">
<a class="text-sm font-semibold text-neutral-900 hover:text-black transition-colors whitespace-nowrap" href="#">View →</a>
</td>
</tr>
<!-- Row 6: Low Risk -->
<tr class="hover:bg-[#F9FAFB] transition-colors">
<td class="py-4.5 px-6">
<div class="text-base font-semibold text-neutral-900 leading-snug">Renovation of Primary Health Centre Sub-centre</div>
<div class="font-mono text-xs text-neutral-500 mt-1">MPLADS-GY-2023-619</div>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Belaganj, Gaya
</td>
<td class="py-4.5 px-6 text-sm text-neutral-600 leading-normal">
Healthcare Infrastructure
</td>
<td class="py-4.5 px-6 text-right font-mono text-base font-semibold text-neutral-900 tabular-nums">
₹8,50,000
</td>
<td class="py-4.5 px-6">
<span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
Low
</span>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-400 italic leading-normal">
No current risk signal
</td>
<td class="py-4.5 px-6 text-right">
<a class="text-sm font-semibold text-neutral-900 hover:text-black transition-colors whitespace-nowrap" href="#">View →</a>
</td>
</tr>
<!-- Row 7: Low Risk -->
<tr class="hover:bg-[#F9FAFB] transition-colors">
<td class="py-4.5 px-6">
<div class="text-base font-semibold text-neutral-900 leading-snug">Provision of Dual Desk Benches in 14 Primary Schools</div>
<div class="font-mono text-xs text-neutral-500 mt-1">MPLADS-GY-2023-533</div>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-700 leading-normal">
Sherghati, Gaya
</td>
<td class="py-4.5 px-6 text-sm text-neutral-600 leading-normal">
Education &amp; Public Facilities
</td>
<td class="py-4.5 px-6 text-right font-mono text-base font-semibold text-neutral-900 tabular-nums">
₹11,60,000
</td>
<td class="py-4.5 px-6">
<span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
Low
</span>
</td>
<td class="py-4.5 px-6 text-sm text-neutral-400 italic leading-normal">
No current risk signal
</td>
<td class="py-4.5 px-6 text-right">
<a class="text-sm font-semibold text-neutral-900 hover:text-black transition-colors whitespace-nowrap" href="#">View →</a>
</td>
</tr>
</tbody></table>
</div>
<!-- Minimalist Pagination / Footer Row -->
<div class="px-6 py-3.5 border-t border-outline-variant bg-[#FAFAFA] flex items-center justify-between"><p class="text-sm text-neutral-500">
Showing <span class="font-semibold text-neutral-900">1–7</span> of <span class="font-semibold text-neutral-900">24</span> recommended projects
</p>
<div class="flex items-center gap-2">
<button class="px-3.5 py-2 border border-outline-variant rounded-lg bg-white text-sm font-medium text-neutral-400 cursor-not-allowed" disabled="">
Previous
</button>
<button class="px-3.5 py-2 border border-outline-variant rounded-lg bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
Next
</button>
</div></div>
</div>
</main>
</div>


`;

export default function MPProjects() {
  useStitchNavigation();
  return (
    <div
      className="stitch-page-root"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
