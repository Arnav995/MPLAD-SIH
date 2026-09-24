import React from 'react';
import { NavLink } from 'react-router-dom';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useViewer } from '../../context/ViewerContext';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  CopyCheck,
  AlertTriangle,
  History,
  FolderGit2,
  UserCheck,
  Menu
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Nav link definitions per role — unchanged from existing architecture
// ---------------------------------------------------------------------------
const NAV_LINKS = {
  district: [
    { to: '/district/overview',            label: 'District Overview',     icon: LayoutDashboard },
    { to: '/district/financial-analytics', label: 'Financial Utilization', icon: BarChart3 },
    { to: '/district/duplicate-detection', label: 'Duplicate Detection',   icon: CopyCheck },
    { to: '/district/cost-anomalies',      label: 'Cost Anomalies',        icon: AlertTriangle },
    { to: '/district/audit-logs',          label: 'Audit Logs',            icon: History },
  ],
  mp: [
    { to: '/mp/dashboard', label: 'MP Dashboard',           icon: LayoutDashboard },
    { to: '/mp/projects',  label: 'My Recommended Projects', icon: FolderGit2 },
  ],
  ministry: [
    { to: '/ministry/overview',     label: 'National Overview', icon: LayoutDashboard },
    { to: '/ministry/tier-2-digest', label: 'Tier-2 Digest',   icon: FileText },
    { to: '/ministry/benfords-law', label: "Benford's Law",     icon: BarChart3 },
  ],
};

// ---------------------------------------------------------------------------
// Shared style constants — centralised so tweaks only need one change
// ---------------------------------------------------------------------------

// Fixed nav-item geometry — these must NEVER vary between states
const ITEM_H = 'h-[42px] min-h-[42px] max-h-[42px]';

// Icon container: fixed 18 × 18 icons, never shrinks
const ICON_CLS = 'w-[18px] h-[18px] shrink-0';

// Collapsed sidebar centres icons; px-3 = 12px each side keeps icon at 16+12+12=40px rail
const ICON_RAIL_W = 'w-16';   // 64px collapsed
const FULL_W      = 'w-[240px]'; // expanded

// ---------------------------------------------------------------------------
export const Sidebar = ({ onOpenRoleModal, isCollapsed, onToggle }) => {
  const { activeRole, currentViewer } = useViewer();
  const navLinks = NAV_LINKS[activeRole] ?? NAV_LINKS.ministry;

  // ── Active-item inline styles ──────────────────────────────────────────
  // primary = #000000, so we inline rgba for the tint — Tailwind can't
  // produce arbitrary rgba from a named colour.
  const activeStyle = {
    background: '#000000',
    color: '#ffffff',
  };
  const activeLabelStyle = { fontWeight: 600 };

  return (
    <aside
      className={`
        fixed top-0 bottom-0 left-0 h-full
        bg-white
        border-r border-[#e7e8ea]
        flex flex-col
        z-30 select-none hidden md:flex
        transition-[width] duration-300 ease-in-out
        overflow-hidden
        ${isCollapsed ? ICON_RAIL_W : FULL_W}
      `}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOP HEADER — fixed 56px, menu/collapse button only.
          Height never changes. Button stays left-aligned with nav icons.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={`h-14 shrink-0 flex items-center border-b border-[#e7e8ea] ${isCollapsed ? 'pl-[13px]' : 'px-[13px]'}`}>
        <button
          onClick={onToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            w-[42px] h-[42px] flex items-center justify-center
            rounded-[7px]
            text-[#747878]
            hover:text-[#191c1e] hover:bg-[#f3f4f6]
            transition-colors duration-150
            shrink-0
          "
        >
          <Menu className="w-[18px] h-[18px] shrink-0" />
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCROLLABLE NAV BODY
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ScrollAreaPrimitive.Root className="flex-1 overflow-hidden">
        <ScrollAreaPrimitive.Viewport className="h-full w-full">

          <nav className="flex flex-col px-2 pt-3 pb-2 gap-0.5">

            {/* ── Section label: always in DOM, fades to 0 height when collapsed ── */}
            <div
              className="overflow-hidden whitespace-nowrap transition-[max-height,opacity] duration-200 ease-in-out"
              style={{
                maxHeight: isCollapsed ? '0px' : '24px',
                opacity: isCollapsed ? 0 : 1,
                marginBottom: isCollapsed ? '0px' : '4px',
              }}
              aria-hidden={isCollapsed}
            >
              <p className="px-[13px] text-[10.5px] font-semibold text-[#747878] uppercase tracking-[0.07em]">
                Navigation
              </p>
            </div>

            {/* ── Nav items ── */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  title={isCollapsed ? link.label : undefined}
                  className={({ isActive }) => `
                    relative flex items-center gap-3
                    ${ITEM_H}
                    overflow-hidden whitespace-nowrap
                    rounded-[7px]
                    transition-colors duration-150
                    ${isCollapsed ? 'pl-[13px]' : 'px-[13px]'}
                    ${isActive
                      ? 'text-[#ffffff]'
                      : 'text-[#444748] hover:text-[#191c1e]'}
                    group
                  `}
                  style={({ isActive }) => isActive ? activeStyle : {}}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active left accent bar — 2px, sits at the far-left edge */}
                      <span
                        className="absolute left-0 top-[8px] bottom-[8px] w-[2.5px] rounded-full bg-[#ffffff] transition-opacity duration-150"
                        style={{ opacity: isActive ? 1 : 0 }}
                        aria-hidden="true"
                      />

                      {/* Icon — fixed 18×18, never shrinks, always vertically centred */}
                      <Icon
                        className={`${ICON_CLS} transition-colors duration-150 ${
                          isActive
                            ? 'text-[#ffffff]'
                            : 'text-[#747878] group-hover:text-[#191c1e]'
                        }`}
                      />

                      {/*
                        Label — ALWAYS IN THE DOM.
                        max-width + opacity animate; the parent item height never changes.
                        whitespace-nowrap + overflow-hidden prevent any wrapping.
                      */}
                      <span
                        className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out text-[13px]"
                        style={{
                          maxWidth: isCollapsed ? '0px' : '180px',
                          opacity: isCollapsed ? 0 : 1,
                          ...(isActive ? activeLabelStyle : {}),
                        }}
                        aria-hidden={isCollapsed}
                      >
                        {link.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

        </ScrollAreaPrimitive.Viewport>

        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className="flex touch-none select-none transition-colors w-[6px] border-l border-l-transparent p-[1px]"
        >
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-[#e7e8ea]" />
        </ScrollAreaPrimitive.Scrollbar>
      </ScrollAreaPrimitive.Root>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM — Role switcher.
          Same fixed-height pattern as nav items. Label fades in/out.
          No separate collapse button here.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="shrink-0 border-t border-[#e7e8ea] px-2 py-2">

        {/* Section label — fades out when collapsed */}
        <div
          className="overflow-hidden whitespace-nowrap transition-[max-height,opacity] duration-200 ease-in-out"
          style={{
            maxHeight: isCollapsed ? '0px' : '24px',
            opacity: isCollapsed ? 0 : 1,
            marginBottom: isCollapsed ? '0px' : '4px',
          }}
          aria-hidden={isCollapsed}
        >
          <p className="px-[13px] text-[10.5px] font-semibold text-[#747878] uppercase tracking-[0.07em]">
            Viewer Mode
          </p>
        </div>

        {/* Role switcher button — same fixed-height contract as nav items */}
        <button
          onClick={onOpenRoleModal}
          title={isCollapsed ? currentViewer.label : undefined}
          className={`
            w-full flex items-center gap-3
            ${ITEM_H}
            overflow-hidden whitespace-nowrap
            rounded-[7px]
            text-[#444748] hover:text-[#191c1e] hover:bg-[#f3f4f6]
            transition-colors duration-150
            ${isCollapsed ? 'pl-[13px]' : 'px-[13px]'}
            group
          `}
        >
          {/* Live-status dot + icon — fixed, never shrinks */}
          <span className="relative shrink-0 flex items-center justify-center w-[18px] h-[18px]">
            <UserCheck className="w-[18px] h-[18px] text-[#006d37] shrink-0" />
            {/* Pulsing green dot — status indicator */}
            <span
              className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-[#006d37] animate-pulse"
              aria-hidden="true"
            />
          </span>

          {/* Label + role badge — always in DOM, fades with sidebar */}
          <span
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out min-w-0"
            style={{
              maxWidth: isCollapsed ? '0px' : '180px',
              opacity: isCollapsed ? 0 : 1,
            }}
            aria-hidden={isCollapsed}
          >
            <span className="truncate text-[13px] text-[#444748] group-hover:text-[#191c1e] transition-colors">
              {currentViewer.label}
            </span>
            <span className="shrink-0 text-[10px] px-1.5 py-[2px] bg-[#e7e8ea] text-[#444748] rounded-[4px] uppercase font-semibold tracking-wide">
              {activeRole}
            </span>
          </span>
        </button>

      </div>
    </aside>
  );
};
