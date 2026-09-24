import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewer } from '../../context/ViewerContext';
import { ViewerBadge } from '../common/ViewerBadge';
import { Search, Bell, HelpCircle, Download, Plus, Menu } from 'lucide-react';

export const Navbar = ({ onOpenRoleModal, onToggleMobileSidebar, onOpenNewWorkModal, isSidebarCollapsed }) => {
  const { activeRole } = useViewer();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/mp/projects?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Track sidebar width: 64px (collapsed w-16) or 240px (expanded w-[240px])
  const leftOffset = isSidebarCollapsed ? 'md:left-16' : 'md:left-[240px]';

  return (
    <header
      className={`
        fixed top-0 right-0 left-0 ${leftOffset}
        h-14
        bg-white
        border-b border-[#e7e8ea]
        flex items-center justify-between
        px-5
        z-20
        transition-[left] duration-300 ease-in-out
      `}
    >
      {/* ── Left: mobile menu + search ── */}
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-sm">
        {/* Mobile hamburger — hidden on md+ */}
        <button
          onClick={onToggleMobileSidebar}
          className="
            md:hidden
            w-[38px] h-[38px] flex items-center justify-center
            rounded-[7px] text-[#747878]
            hover:text-[#191c1e] hover:bg-[#f3f4f6]
            transition-colors duration-150 shrink-0
          "
          aria-label="Open navigation menu"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-[14px] h-[14px] absolute left-3 top-1/2 -translate-y-1/2 text-[#747878] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, codes, locations…"
            className="
              w-full h-[38px]
              pl-8 pr-3
              bg-[#f8f9fb]
              border border-[#e7e8ea]
              rounded-[7px]
              text-[13px] text-[#191c1e]
              placeholder:text-[#9ca3af]
              focus:outline-none focus:border-[#191c1e] focus:bg-white
              transition-colors duration-150
            "
          />
        </form>
      </div>

      {/* ── Right: viewer badge + icon actions + CTA ── */}
      <div className="flex items-center gap-1 ml-4 shrink-0">

        {/* Viewer badge — hidden on small screens */}
        <div className="hidden sm:flex items-center pr-3 mr-2 border-r border-[#e7e8ea]">
          <ViewerBadge onClick={onOpenRoleModal} />
        </div>

        {/* Icon buttons — notifications + help */}
        <div className="hidden md:flex items-center gap-0.5 pr-3 mr-2 border-r border-[#e7e8ea]">
          <button
            className="
              relative w-[38px] h-[38px] flex items-center justify-center
              rounded-[7px] text-[#747878]
              hover:text-[#191c1e] hover:bg-[#f3f4f6]
              transition-colors duration-150
            "
            title="Notifications"
          >
            <Bell className="w-[16px] h-[16px]" />
            {/* Unread indicator dot */}
            <span
              className="absolute top-[9px] right-[9px] w-[6px] h-[6px] rounded-full bg-red-500 border border-white"
              aria-hidden="true"
            />
          </button>

          <button
            className="
              w-[38px] h-[38px] flex items-center justify-center
              rounded-[7px] text-[#747878]
              hover:text-[#191c1e] hover:bg-[#f3f4f6]
              transition-colors duration-150
            "
            title="Help / Documentation"
          >
            <HelpCircle className="w-[16px] h-[16px]" />
          </button>
        </div>

        {/* Primary CTA */}
        {activeRole === 'mp' ? (
          <button
            onClick={onOpenNewWorkModal}
            className="
              h-[38px] px-4
              bg-[#191c1e] text-white
              text-[13px] font-semibold
              rounded-[7px]
              flex items-center gap-2
              hover:bg-black
              transition-colors duration-150
            "
          >
            <Plus className="w-[15px] h-[15px]" />
            <span>Recommend Work</span>
          </button>
        ) : (
          <button
            onClick={() => alert('Dossier review export initiated. Generating PDF summary...')}
            className="
              h-[38px] px-4
              bg-[#191c1e] text-white
              text-[13px] font-semibold
              rounded-[7px]
              flex items-center gap-2
              hover:bg-black
              transition-colors duration-150
            "
          >
            <Download className="w-[15px] h-[15px]" />
            <span className="hidden sm:inline">Export Dossier</span>
          </button>
        )}
      </div>
    </header>
  );
};
