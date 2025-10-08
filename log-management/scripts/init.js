const fs = require("fs-extra");
const path = require("path");

// Initialize database and basic setup
async function init() {
  try {
    console.log("🚀 Initializing Log Management System...");

    // Create data directory
    const dataDir = path.join(__dirname, "..", "data");
    await fs.ensureDir(dataDir);
    console.log("✓ Data directory created");

    // Create logs directory structure
    const services = [
      "api-gateway",
      "user-service",
      "course-service",
      "schedule-service",
      "enrollment-service",
    ];

    for (const service of services) {
      const serviceLogDir = path.join(__dirname, "..", "..", service, "logs");
      await fs.ensureDir(serviceLogDir);

      // Create sample log files if they don't exist
      const sampleLogPath = path.join(serviceLogDir, "combined.log");
      if (!(await fs.pathExists(sampleLogPath))) {
        const sampleLogs =
          [
            `{"timestamp":"${new Date().toISOString()}","level":"info","message":"${service} started","service":"${service}"}`,
            `{"timestamp":"${new Date().toISOString()}","level":"info","message":"Server listening on port","service":"${service}"}`,
            `{"timestamp":"${new Date().toISOString()}","level":"warn","message":"High memory usage detected","service":"${service}"}`,
          ].join("\n") + "\n";

        await fs.writeFile(sampleLogPath, sampleLogs);
      }

      console.log(`✓ ${service} logs directory ready`);
    }

    console.log("🎉 Initialization completed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. npm run dev        - Start development server");
    console.log("2. npm run build      - Build for production");
    console.log("3. npm start          - Start production server");
    console.log("");
    console.log("Access the application at: http://localhost:3007");
    console.log("Default login: admin / admin123");
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
}

init();
