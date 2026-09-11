import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MinistryOverview from "./pages/MinistryOverview";
import MinistryTier2 from "./pages/MinistryTier2";
import MinistryBenford from "./pages/MinistryBenford";
import DistrictOverview from "./pages/DistrictOverview";
import DistrictProjectDetail from "./pages/DistrictProjectDetail";
import DistrictDuplicates from "./pages/DistrictDuplicates";
import DistrictCostAnomalies from "./pages/DistrictCostAnomalies";
import DistrictAuditLogs from "./pages/DistrictAuditLogs";
import MPOverview from "./pages/MPOverview";
import MPProjects from "./pages/MPProjects";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/ministry/overview" replace />} />
        <Route path="/ministry/overview" element={<MinistryOverview />} />
        <Route path="/ministry/tier-2" element={<MinistryTier2 />} />
        <Route path="/ministry/benford" element={<MinistryBenford />} />
        <Route path="/district/overview" element={<DistrictOverview />} />
        <Route path="/district/projects/:id" element={<DistrictProjectDetail />} />
        <Route path="/district/duplicates" element={<DistrictDuplicates />} />
        <Route path="/district/cost-anomalies" element={<DistrictCostAnomalies />} />
        <Route path="/district/audit-logs" element={<DistrictAuditLogs />} />
        <Route path="/mp/overview" element={<MPOverview />} />
        <Route path="/mp/projects" element={<MPProjects />} />
        <Route path="*" element={<Navigate to="/ministry/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
