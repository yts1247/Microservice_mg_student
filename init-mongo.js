// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

print("Starting MongoDB initialization...");

// Switch to admin database
db = db.getSiblingDB("admin");

// Create databases for each service
const databases = [
  "user_service_db",
  "course_service_db",
  "schedule_service_db",
  "enrollment_service_db",
];

databases.forEach(function (dbName) {
  print("Initializing database: " + dbName);

  // Switch to the database
  const serviceDb = db.getSiblingDB(dbName);

  // Create a collection to initialize the database
  serviceDb.init.insertOne({
    message: "Database initialized",
    createdAt: new Date(),
  });

  print("Database " + dbName + " initialized successfully");
});

print("MongoDB initialization completed!");
