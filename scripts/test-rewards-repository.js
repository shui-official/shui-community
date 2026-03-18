const fs = require("fs");
const path = require("path");

const dataDir = path.join(process.cwd(), "data", "rewards");

const files = [
  "monthly-batches.json",
  "snapshots.json",
  "vesting-schedules.json",
  "vesting-installments.json",
  "distribution-ledger.json",
  "wallet-validations.json",
  "budget.json",
  "community-wallet.json",
];

console.log("Rewards data dir:", dataDir);

for (const file of files) {
  const fullPath = path.join(dataDir, file);
  const exists = fs.existsSync(fullPath);
  const size = exists ? fs.statSync(fullPath).size : 0;

  console.log(`- ${file}: ${exists ? "OK" : "MISSING"} (${size} bytes)`);

  if (!exists) continue;

  const raw = fs.readFileSync(fullPath, "utf8");
  try {
    JSON.parse(raw);
    console.log(`  JSON parse: OK`);
  } catch (error) {
    console.log(`  JSON parse: ERROR -> ${error.message}`);
    process.exitCode = 1;
  }
}
