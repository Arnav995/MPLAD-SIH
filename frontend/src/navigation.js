import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const routesByLabel = {
  "National Overview": "/ministry/overview",
  "Tier-2 Digest": "/ministry/tier-2",
  "Benford’s Law": "/ministry/benford",
  "Benford's Law": "/ministry/benford",
  "District Overview": "/district/overview",
  "Project Verification": "/district/projects/demo-project",
  "Duplicate Detection": "/district/duplicates",
  "Cost Anomalies": "/district/cost-anomalies",
  "Audit Logs": "/district/audit-logs",
  "MP Dashboard": "/mp/overview",
  "My Projects": "/mp/projects",
};

export function useStitchNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.querySelector(".stitch-page-root");
    if (!root) return;

    const handler = (event) => {
      const anchor = event.target.closest?.("a");
      if (!anchor || !root.contains(anchor)) return;

      const href = anchor.getAttribute("href");
      const label = anchor.textContent.trim().replace(/\s+/g, " ");

      if (href === "#" || href === "") {
        const target = routesByLabel[label];
        if (target) {
          event.preventDefault();
          navigate(target);
        } else {
          event.preventDefault();
        }
      } else if (href?.startsWith("#")) {
        event.preventDefault();
        const id = href.slice(1);
        const target = document.getElementById(id);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    root.addEventListener("click", handler);
    return () => root.removeEventListener("click", handler);
  }, [navigate]);
}
