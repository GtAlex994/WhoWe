import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const standaloneDir = path.join(__dirname, ".next/standalone");

// Initialize Express app
const app = express();

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from .next/static
const staticDir = path.join(standaloneDir, ".next/static");
if (fs.existsSync(staticDir)) {
  app.use("/_next/static", express.static(staticDir));
}

// Serve public files
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// The generated `.next/standalone/server.js` binds its own HTTP listener
// (via Next's `startServer`) rather than exporting a request handler, so it
// can't be `require`d/`import`ed into an Express route directly. Instead we
// build a handler the same way Next's own custom-server docs describe:
// instantiate `next()` programmatically against the standalone build, using
// the standalone bundle's own copy of `next` (matches the exact version/deps
// it was compiled against) and the exact build config Next wrote out for
// this purpose in `required-server-files.json`.
let handlerPromise = null;

function getNextHandler() {
  if (handlerPromise) return handlerPromise;

  handlerPromise = (async () => {
    const requiredServerFiles = JSON.parse(
      fs.readFileSync(path.join(standaloneDir, ".next/required-server-files.json"), "utf8"),
    );
    const standaloneRequire = createRequire(path.join(standaloneDir, "package.json"));
    const next = standaloneRequire("next");

    const nextApp = next({
      dev: false,
      dir: standaloneDir,
      conf: requiredServerFiles.config,
    });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();
    return handle;
  })();

  return handlerPromise;
}

// Handle all other requests with Next.js
app.all("*", async (req, res) => {
  try {
    const handle = await getNextHandler();
    return handle(req, res);
  } catch (error) {
    console.error("Error handling request:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
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
