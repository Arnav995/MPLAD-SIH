import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useViewer } from '../../context/ViewerContext';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  CopyCheck,
  AlertTriangle,
  History,
  FolderGit2,
  UserCheck
} from 'lucide-react';

/**
 * MobileSidebar — left-slide overlay for mobile viewports.
 * Uses the same native CSS + React patterns as the existing Drawer.jsx,
 * but slides from the left side. No Radix Dialog dependency.
 */
export const MobileSidebar = ({ isOpen, onClose, onOpenRoleModal }) => {
  const { activeRole, currentViewer } = useViewer();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const getNavLinks = () => {
    switch (activeRole) {
      case 'district':
        return [
          { to: '/district/overview', label: 'District Overview', icon: LayoutDashboard },
          { to: '/district/financial-analytics', label: 'Financial Utilization', icon: BarChart3 },
          { to: '/district/duplicate-detection', label: 'Duplicate Detection', icon: CopyCheck },
          { to: '/district/cost-anomalies', label: 'Cost Anomalies', icon: AlertTriangle },
          { to: '/district/audit-logs', label: 'Audit Logs', icon: History }
        ];
      case 'mp':
        return [
          { to: '/mp/dashboard', label: 'MP Dashboard', icon: LayoutDashboard },
          { to: '/mp/projects', label: 'My Recommended Projects', icon: FolderGit2 }
        ];
      case 'ministry':
      default:
        return [
          { to: '/ministry/overview', label: 'National Overview', icon: LayoutDashboard },
          { to: '/ministry/tier-2-digest', label: 'Tier-2 Digest', icon: FileText },
          { to: '/ministry/benfords-law', label: "Benford's Law", icon: BarChart3 }
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-[1px] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-container-lowest border-r border-surface-container-high flex flex-col shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-container-high">
          <span className="text-[17px] font-semibold text-on-surface tracking-larger">
            MPLADS Sentinel
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="px-2 mb-2 text-[11px] font-semibold text-outline uppercase tracking-wider">
            Navigation
          </div>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary font-semibold shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-normal'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Role Indicator */}
        <div className="p-4 border-t border-surface-container-high">
          <div
            onClick={() => { onOpenRoleModal(); onClose(); }}
            className="p-3 bg-surface-container-low border border-surface-container-high rounded-[6px] cursor-pointer hover:border-outline-variant transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block shrink-0 animate-pulse" />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-on-surface truncate">
                  {currentViewer.label}
                </div>
                <div className="text-[11px] text-on-surface-variant">Tap to switch persona</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => { onOpenRoleModal(); onClose(); }}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
          >
            <UserCheck className="w-4 h-4 text-secondary" />
            <span>Change Role</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-on-surface rounded-[4px] uppercase font-bold">
              {activeRole}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
