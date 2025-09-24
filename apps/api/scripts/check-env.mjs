const REQUIRED = ["DATABASE_URL", "REDIS_URL", "JWT_SECRET"];
const missing = REQUIRED.filter((k) => !process.env[k] || String(process.env[k]).trim() === "");

if (missing.length) {
  console.error("❌ Missing required environment variables:\n  - " + missing.join("\n  - "));
  console.error("\nSet them in Railway → Service → Variables. Hints:");
  console.error("  • DATABASE_URL: from Railway Postgres plugin (Connection URL)");
  console.error("  • REDIS_URL: from Railway Redis plugin (Connection string)");
  console.error("  • JWT_SECRET: a random 32+ char string (e.g., `openssl rand -base64 32`)");
  process.exit(1);
} else {
  console.log("✅ Env check: all required variables present.");
}

