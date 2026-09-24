import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useViewer } from '../context/ViewerContext';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { MobileSidebar } from '../components/navigation/MobileSidebar';
import { RoleSwitcherModal } from '../components/navigation/RoleSwitcherModal';

export const DistrictLayout = () => {
  const { switchRole } = useViewer();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    switchRole('district');
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Locked Canonical District Sidebar */}
      <Sidebar
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
      />

      {/* Locked Canonical District Navbar */}
      <Navbar
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Viewport Area */}
      <main
        className={`pt-[82px] pb-10 flex-1 px-4 md:px-6 overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
};
