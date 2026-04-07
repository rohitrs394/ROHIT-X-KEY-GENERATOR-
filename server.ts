import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import firebaseConfig from "./firebase-applet-config.json";
import rateLimit from "express-rate-limit";

// Initialize firebase-admin
initializeApp({
  projectId: firebaseConfig.projectId,
});

// Rate limiter for verification API
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { status: "error", message: "Too many requests from this IP, please try again after 15 minutes" }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin Login with Password -> Custom Token
  app.post("/api/admin-login", async (req, res) => {
    const { password } = req.body;

    if (password === "777") {
      try {
        const auth = getAuth();
        // Generate a custom token for a fixed admin UID
        const customToken = await auth.createCustomToken("admin_rohit", {
          role: "admin",
          admin: true
        });
        
        res.json({ status: "success", token: customToken });
      } catch (error) {
        console.error("Error creating custom token:", error);
        res.status(500).json({ status: "error", message: "Failed to generate access token" });
      }
    } else {
      res.status(401).json({ status: "error", message: "Invalid admin password" });
    }
  });

  // POST /verify-key
  app.post("/api/verify-key", verifyLimiter, async (req, res) => {
    const { key, deviceId } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!key) {
      return res.status(400).json({ status: "invalid", message: "Key is required" });
    }

    try {
      const db = getFirestore();
      const keysRef = db.collection('keys');
      const snapshot = await keysRef.where('key', '==', key).limit(1).get();

      if (snapshot.empty) {
        return res.status(404).json({ status: "invalid", message: "Key not found" });
      }

      const keyDoc = snapshot.docs[0];
      const keyData = keyDoc.data();

      // Check status
      if (keyData.status !== 'active') {
        return res.status(403).json({ 
          status: "invalid", 
          message: `Key is currently ${keyData.status}`,
          reason: keyData.status 
        });
      }

      // Check expiry
      if (keyData.expiryDate !== 'lifetime') {
        const expiry = keyData.expiryDate.toDate();
        if (new Date() > expiry) {
          // Update status to expired
          await keyDoc.ref.update({ status: 'expired' });
          return res.status(403).json({ status: "invalid", message: "Key has expired", reason: "expired" });
        }
      }

      // Device Binding (Optional)
      if (keyData.deviceId && deviceId && keyData.deviceId !== deviceId) {
        return res.status(403).json({ status: "invalid", message: "Key is bound to another device", reason: "device_mismatch" });
      }

      // Log the verification with IP
      await db.collection('logs').add({
        type: 'key_verification',
        details: `Key verified: ${key} ${deviceId ? `(Device: ${deviceId})` : ''} from IP: ${ip}`,
        timestamp: new Date(),
        adminId: 'system',
        ip: ip
      });

      res.json({
        status: "valid",
        message: "Key verified successfully",
        data: {
          key: keyData.key,
          appName: keyData.appName,
          expiry: keyData.expiryDate === 'lifetime' ? 'lifetime' : keyData.expiryDate.toDate().toISOString()
        }
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ status: "error", message: "Internal server error during verification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
