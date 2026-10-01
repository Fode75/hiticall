const express = require("express");
const QRCode = require("qrcode");
const crypto = require("crypto");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;
const PROF_PASSWORD = process.env.PROF_PASSWORD || "hetic";
const WINDOW_MINUTES = 15; // durée pendant laquelle le code est actif

app.use(express.json());
app.use(express.static("public"));

let session = null; // { code, openedAt, closesAt }
let records = [];   // { id, name, status, time }

function lanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list) if (i.family === "IPv4" && !i.internal) return i.address;
  }
  return null;
}

const isOpen = () => session && Date.now() < session.closesAt;

function requireProf(req, res, next) {
  if (req.headers["x-prof-password"] !== PROF_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  next();
}

// --- Professeur ---
app.post("/api/session", requireProf, (req, res) => {
  const now = Date.now();
  session = {
    code: crypto.randomBytes(3).toString("hex").toUpperCase(),
    openedAt: now,
    closesAt: now + WINDOW_MINUTES * 60 * 1000,
  };
  records = [];
  res.json({ code: session.code, closesAt: session.closesAt });
});

app.get("/api/session", requireProf, async (req, res) => {
  if (!session) return res.json({ started: false });
  let host = req.get("host");
  if (/^(localhost|127\.)/.test(host)) {
    const ip = lanIp(); // un téléphone ne peut pas ouvrir "localhost"
    if (ip) host = `${ip}:${PORT}`;
  }
  const url = `${req.protocol}://${host}/?code=${session.code}`;
  const qr = await QRCode.toDataURL(url, { width: 260, margin: 1 });
  res.json({ started: true, open: !!isOpen(), code: session.code, closesAt: session.closesAt, url, qr });
});

app.get("/api/records", requireProf, (req, res) => res.json(records));

app.patch("/api/records/:id", requireProf, (req, res) => {
  const rec = records.find((r) => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: "Introuvable" });
  if (!["present", "absent"].includes(req.body.status)) {
    return res.status(400).json({ error: "Statut invalide" });
  }
  rec.status = req.body.status;
  res.json(rec);
});

// --- Élève ---
app.post("/api/checkin", (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 60);
  const code = String(req.body.code || "").trim().toUpperCase();

  if (!name) return res.status(400).json({ error: "Entre ton nom." });
  if (!session || code !== session.code) return res.status(400).json({ error: "Code invalide." });
  if (records.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ error: "Tu es déjà enregistré." });
  }

  const onTime = !!isOpen();
  records.push({
    id: crypto.randomUUID(),
    name,
    status: onTime ? "present" : "absent",
    time: new Date().toISOString(),
  });

  if (!onTime) {
    return res.status(403).json({ status: "absent", error: "Délai dépassé : tu es marqué absent. Seul le professeur peut modifier." });
  }
  res.json({ status: "present" });
});

app.listen(PORT, () => console.log(`Heticall sur http://localhost:${PORT}`));
