const { spawn } = require("child_process");
const os = require("os");

// Setup cronjob for Windows/Linux
function setupCronjob() {
  const platform = os.platform();

  if (platform === "win32") {
    // Windows Task Scheduler
    setupWindowsTask();
  } else {
    // Linux/macOS cron
    setupUnixCron();
  }
}

function setupWindowsTask() {
  console.log("Setting up Windows Task Scheduler...");

  const taskName = "LogManagementCleanup";
  const scriptPath = process.cwd();

  // Create a batch file for the task
  const batchContent = `@echo off
cd /d "${scriptPath}"
node -e "require('./src/lib/cronjob.js').cronjobService.manualCleanup()"
`;

  require("fs").writeFileSync("cleanup-task.bat", batchContent);

  // Schedule task to run daily at 2 AM
  const command = `schtasks /create /tn "${taskName}" /tr "${scriptPath}\\cleanup-task.bat" /sc daily /st 02:00 /f`;

  const child = spawn("cmd", ["/c", command], { stdio: "inherit" });

  child.on("close", (code) => {
    if (code === 0) {
      console.log("✓ Windows task scheduled successfully");
    } else {
      console.log("❌ Failed to schedule Windows task");
    }
  });
}

function setupUnixCron() {
  console.log("Setting up cron job...");

  const cronJob = `0 2 * * * cd ${process.cwd()} && node -e "require('./src/lib/cronjob.js').cronjobService.manualCleanup()" >> /var/log/log-management-cleanup.log 2>&1`;

  // Add to user's crontab
  const child = spawn(
    "bash",
    ["-c", `(crontab -l 2>/dev/null; echo "${cronJob}") | crontab -`],
    { stdio: "inherit" }
  );

  child.on("close", (code) => {
    if (code === 0) {
      console.log("✓ Cron job scheduled successfully");
      console.log("Log cleanup will run daily at 2:00 AM");
    } else {
      console.log("❌ Failed to schedule cron job");
      console.log("You can manually add this to your crontab:");
      console.log(cronJob);
    }
  });
}

setupCronjob();
