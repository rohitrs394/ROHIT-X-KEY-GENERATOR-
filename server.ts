import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize firebase-admin
initializeApp({
  projectId: firebaseConfig.projectId,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // POST /verify-key
  app.post("/api/verify-key", async (req, res) => {
    const { key, deviceId } = req.body;

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

      // Log the verification
      await db.collection('logs').add({
        type: 'key_verification',
        details: `Key verified: ${key} ${deviceId ? `(Device: ${deviceId})` : ''}`,
        timestamp: new Date(),
        adminId: 'system'
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
