export function isBootstrapReviewModeEnabled(): boolean {
  const raw = String(process.env.NEXT_PUBLIC_SHUI_BOOTSTRAP_REVIEW_MODE || process.env.SHUI_BOOTSTRAP_REVIEW_MODE || "").toLowerCase().trim();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
