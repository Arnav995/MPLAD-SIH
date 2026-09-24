import React from 'react';
import { Modal } from '../common/Modal';
import { useViewer } from '../../context/ViewerContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, UserCheck, CheckCircle2 } from 'lucide-react';

export const RoleSwitcherModal = ({ isOpen, onClose }) => {
  const { activeRole, switchRole, VIEWERS } = useViewer();
  const navigate = useNavigate();

  const handleSelectRole = (roleKey) => {
    switchRole(roleKey);
    const viewer = VIEWERS[roleKey.toUpperCase()];
    if (viewer && viewer.defaultRoute) {
      navigate(viewer.defaultRoute);
    }
    onClose();
  };

  const roles = [
    {
      key: 'MINISTRY',
      title: 'Ministry Oversight',
      description: 'National overview, bi-weekly executive digests, Benford statistical forensics across all States & UTs.',
      icon: Shield,
      route: '/ministry/overview'
    },
    {
      key: 'DISTRICT',
      title: 'District Authority — Varanasi',
      description: 'District Collector terminal, AI duplicate detection, unit cost variance radar, and compliance audit logs.',
      icon: Building2,
      route: '/district/overview'
    },
    {
      key: 'MP',
      title: 'Member of Parliament — Shri Narendra Modi',
      description: 'Constituency recommendation portal, my projects tracking, fund allocation status.',
      icon: UserCheck,
      route: '/mp/dashboard'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Viewer Persona"
      maxWidth="max-w-lg"
    >
      <div className="space-y-space-sm">
        <p className="text-body-sm text-on-surface-variant mb-4">
          Select an administrative persona to experience the platform from different governance perspectives:
        </p>

        {roles.map((r) => {
          const isSelected = activeRole.toUpperCase() === r.key;
          const Icon = r.icon;
          return (
            <div
              key={r.key}
              onClick={() => handleSelectRole(r.key)}
              className={`p-space-md border rounded cursor-pointer transition-all flex items-start justify-between gap-space-md ${
                isSelected
                  ? 'border-primary bg-surface-container-low shadow-sm'
                  : 'border-surface-container-high hover:border-outline-variant hover:bg-surface-container-low/40'
              }`}
            >
              <div className="flex items-start gap-space-md">
                <div className={`p-2 rounded mt-0.5 ${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-headline-sm font-headline-sm font-semibold text-on-surface flex items-center gap-2">
                    {r.title}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              </div>
              {isSelected && <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
