import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useViewer } from '../context/ViewerContext';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { MobileSidebar } from '../components/navigation/MobileSidebar';
import { RoleSwitcherModal } from '../components/navigation/RoleSwitcherModal';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

export const MPLayout = () => {
  const { switchRole } = useViewer();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewWorkModalOpen, setIsNewWorkModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Form state for MP New Work Recommendation Modal
  const [workTitle, setWorkTitle] = useState('');
  const [workSector, setWorkSector] = useState('Roads & Bridges');
  const [workCost, setWorkCost] = useState('');
  const [workLocation, setWorkLocation] = useState('');

  useEffect(() => {
    switchRole('mp');
  }, []);

  const handleRecommendSubmit = (e) => {
    e.preventDefault();
    alert(`Work Recommendation "${workTitle}" (Estimated: ₹${workCost} Lakhs) submitted successfully to District Authority Varanasi.`);
    setWorkTitle('');
    setWorkCost('');
    setWorkLocation('');
    setIsNewWorkModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Locked Canonical MP Sidebar */}
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

      {/* Locked Canonical MP Navbar */}
      <Navbar
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenNewWorkModal={() => setIsNewWorkModalOpen(true)}
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

      {/* MP New Work Recommendation Modal */}
      <Modal
        isOpen={isNewWorkModalOpen}
        onClose={() => setIsNewWorkModalOpen(false)}
        title="Recommend New Infrastructure Work"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewWorkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecommendSubmit}>
              Submit Recommendation
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecommendSubmit} className="space-y-4 text-body-sm">
          <div>
            <label className="block text-label-sm font-label-sm uppercase font-semibold text-on-surface-variant mb-1">
              Work Title / Description
            </label>
            <input
              type="text"
              required
              value={workTitle}
              onChange={(e) => setWorkTitle(e.target.value)}
              placeholder="e.g. Construction of Community Health Center Annex..."
              className="w-full px-3 py-1.5 bg-surface border border-surface-container-high rounded-[6px] text-on-surface text-body-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-label-sm uppercase font-semibold text-on-surface-variant mb-1">
                Sector / Domain
              </label>
              <select
                value={workSector}
                onChange={(e) => setWorkSector(e.target.value)}
                className="w-full px-3 py-1.5 bg-surface border border-surface-container-high rounded-[6px] text-on-surface text-body-sm focus:outline-none focus:border-primary"
              >
                <option>Roads & Bridges</option>
                <option>Drinking Water</option>
                <option>Education</option>
                <option>Healthcare</option>
                <option>Sanitation & Waste</option>
                <option>Rural Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm font-label-sm uppercase font-semibold text-on-surface-variant mb-1">
                Estimated Cost (₹ Lakhs)
              </label>
              <input
                type="number"
                required
                value={workCost}
                onChange={(e) => setWorkCost(e.target.value)}
                placeholder="e.g. 45"
                className="w-full px-3 py-1.5 bg-surface border border-surface-container-high rounded-[6px] text-on-surface text-body-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-label-sm uppercase font-semibold text-on-surface-variant mb-1">
              Proposed Location / Ward
            </label>
            <input
              type="text"
              required
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="e.g. Sevapuri Block, Varanasi Constituency"
              className="w-full px-3 py-1.5 bg-surface border border-surface-container-high rounded-[6px] text-on-surface text-body-sm focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
