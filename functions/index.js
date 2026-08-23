import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from .next/static
const staticDir = path.join(__dirname, "../.next/standalone/.next/static");
if (fs.existsSync(staticDir)) {
  app.use("/_next/static", express.static(staticDir));
}

// Serve public files
const publicDir = path.join(__dirname, "../public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// For all other routes, we need to handle server-side rendering
// Since we're using standalone mode, we'll use the built server
let nextServer = null;

async function initNextServer() {
  if (nextServer) return nextServer;

  try {
    // Try to use the standalone server if available
    const serverPath = path.join(__dirname, "../.next/standalone/server.js");
    if (fs.existsSync(serverPath)) {
      console.log("Using Next.js standalone server");
      // Import and return the handler
      const { default: handler } = await import(serverPath);
      return handler;
    }
  } catch (error) {
    console.error("Error initializing Next.js server:", error);
  }

  return null;
}

// Handle all other requests with Next.js
app.all("*", async (req, res) => {
  try {
    const server = await initNextServer();
    if (server) {
      return server(req, res);
    } else {
      // Fallback: serve a simple message
      res.status(500).json({
        error: "Next.js server not initialized. Please rebuild the application.",
      });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export the Cloud Function
export const api = onRequest(
  { memory: "512MB", timeoutSeconds: 60, secrets: ["RESEND_API_KEY", "ADMIN_EMAILS"] },
  app
);
