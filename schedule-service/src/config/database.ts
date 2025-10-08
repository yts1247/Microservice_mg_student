import mongoose from "mongoose";
import logger from "./logger";

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/schedule_service";

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info("Connected to MongoDB - Schedule Service");

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected - Schedule Service");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected - Schedule Service");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed due to application termination");
        process.exit(0);
      } catch (error) {
        logger.error("Error during database disconnection:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
};

export { connectDatabase };
