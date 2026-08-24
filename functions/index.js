import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const standaloneDir = path.join(__dirname, ".next/standalone");
const INTERNAL_PORT = 3000;
const READY_TIMEOUT_MS = 30000;

// Initialize Express app
const app = express();

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// The generated `.next/standalone/server.js` binds its own HTTP listener
// (via Next's `startServer`) — it's meant to be run as its own process, not
// `require`d/`import`ed as a request handler (it has no exports, and
// invoking Next's programmatic API directly instead runs into Next's output
// file tracing missing lazily-required internals that only `server.js`'s
// own code path is guaranteed to have). So: spawn it as a child process on
// an internal-only port and reverse-proxy everything to it, same as running
// `node .next/standalone/server.js` directly per Next's own docs.
let readyPromise = null;

function waitForReady(port, deadline) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: "127.0.0.1", port, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("Next.js server did not become ready in time"));
        setTimeout(attempt, 200);
      });
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() > deadline) return reject(new Error("Next.js server did not become ready in time"));
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

function ensureNextServer() {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["server.js"], {
      cwd: standaloneDir,
      env: { ...process.env, PORT: String(INTERNAL_PORT), HOSTNAME: "127.0.0.1" },
      stdio: "inherit",
    });

    child.on("error", (err) => {
      readyPromise = null;
      reject(err);
    });
    child.on("exit", (code) => {
      console.error(`Next.js standalone server exited with code ${code}`);
      readyPromise = null;
    });

    waitForReady(INTERNAL_PORT, Date.now() + READY_TIMEOUT_MS).then(resolve, (err) => {
      readyPromise = null;
      reject(err);
    });
  });

  return readyPromise;
}

const proxy = createProxyMiddleware({
  target: `http://127.0.0.1:${INTERNAL_PORT}`,
  changeOrigin: true,
  ws: false,
});

// Handle all other requests by proxying to the Next.js standalone server
app.all("*", async (req, res, next) => {
  try {
    await ensureNextServer();
  } catch (error) {
    console.error("Failed to start Next.js server:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
  return proxy(req, res, next);
});

// Export the Cloud Function
export const api = onRequest(
  {
    memory: "512MB",
    timeoutSeconds: 60,
    // CLICKSEND_SENDER_ID isn't listed here (yet) — Cloud Functions v2 requires
    // every declared secret to already exist in Secret Manager at deploy time,
    // and it's optional/unset. Add it back once it's actually configured.
    secrets: ["RESEND_API_KEY", "ADMIN_EMAILS", "CLICKSEND_USERNAME", "CLICKSEND_API_KEY"],
  },
  app
);
