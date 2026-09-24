import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { MinistryLayout } from '../layouts/MinistryLayout';
import { DistrictLayout } from '../layouts/DistrictLayout';
import { MPLayout } from '../layouts/MPLayout';

import { NationalOverview } from '../pages/ministry/NationalOverview';
import { Tier2Digest } from '../pages/ministry/Tier2Digest';
import { BenfordsLaw } from '../pages/ministry/BenfordsLaw';

import { DistrictOverview1 } from '../pages/district/DistrictOverview1';
import { DistrictOverview2 } from '../pages/district/DistrictOverview2';
import { DuplicateDetection } from '../pages/district/DuplicateDetection';
import { CostAnomalies } from '../pages/district/CostAnomalies';
import { AuditLogs } from '../pages/district/AuditLogs';

import { MpDashboard } from '../pages/mp/MpDashboard';
import { MpMyProjects } from '../pages/mp/MpMyProjects';

import { ProjectInvestigation } from '../pages/investigation/ProjectInvestigation';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ministry/overview" replace />} />

      {/* Ministry Shared Layout Shell */}
      <Route path="/ministry" element={<MinistryLayout />}>
        <Route index element={<Navigate to="/ministry/overview" replace />} />
        <Route path="overview" element={<NationalOverview />} />
        <Route path="tier-2-digest" element={<Tier2Digest />} />
        <Route path="benfords-law" element={<BenfordsLaw />} />
      </Route>

      {/* District Authority Shared Layout Shell */}
      <Route path="/district" element={<DistrictLayout />}>
        <Route index element={<Navigate to="/district/overview" replace />} />
        <Route path="overview" element={<DistrictOverview1 />} />
        <Route path="financial-analytics" element={<DistrictOverview2 />} />
        <Route path="duplicate-detection" element={<DuplicateDetection />} />
        <Route path="cost-anomalies" element={<CostAnomalies />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* MP Shared Layout Shell */}
      <Route path="/mp" element={<MPLayout />}>
        <Route index element={<Navigate to="/mp/dashboard" replace />} />
        <Route path="dashboard" element={<MpDashboard />} />
        <Route path="projects" element={<MpMyProjects />} />
      </Route>

      {/* Shared Forensic Investigation Detail Route */}
      <Route path="/investigation" element={<DistrictLayout />}>
        <Route path=":projectId" element={<ProjectInvestigation />} />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/ministry/overview" replace />} />
    </Routes>
  );
};
