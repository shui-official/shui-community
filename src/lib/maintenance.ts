import type { NextApiRequest } from "next";

function isEnabled(v?: string) {
  return String(v || "").trim() === "1";
}

export function isDashboardMaintenanceEnabled() {
  return isEnabled(process.env.NEXT_PUBLIC_SHUI_MAINTENANCE);
}

export function isDashboardApiMaintenanceEnabled() {
  return isEnabled(process.env.SHUI_MAINTENANCE_API) || isDashboardMaintenanceEnabled();
}

export function getMaintenanceTitle() {
  return process.env.NEXT_PUBLIC_SHUI_MAINTENANCE_TITLE || "Dashboard SHUI en maintenance";
}

export function getMaintenanceMessage() {
  return (
    process.env.NEXT_PUBLIC_SHUI_MAINTENANCE_MESSAGE ||
    "Nous effectuons une mise à jour du système de quêtes, de validation et de review. Le dashboard communautaire est temporairement indisponible."
  );
}

export function getMaintenanceUntilLabel() {
  return process.env.NEXT_PUBLIC_SHUI_MAINTENANCE_UNTIL_LABEL || "Retour estimé sous 72h";
}

export function getMaintenanceApiPayload(req?: NextApiRequest) {
  return {
    ok: false,
    error: "dashboard_maintenance",
    maintenance: true,
    title: getMaintenanceTitle(),
    message: getMaintenanceMessage(),
    untilLabel: getMaintenanceUntilLabel(),
    path: req?.url || null,
  };
}
