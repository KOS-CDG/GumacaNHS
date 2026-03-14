const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "announcements.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getAnnouncements() {
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/api/announcements", async (req, res) => {
  try {
    const announcements = await getAnnouncements();

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load announcements at the moment."
    });
  }
});

app.post("/api/contact", (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const errors = {};

    if (!name || name.trim().length < 2) {
      errors.name = "Please enter your full name.";
    }

    if (!email || !isValidEmail(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!subject || subject.trim().length < 3) {
      errors.subject = "Please enter a subject with at least 3 characters.";
    }

    if (!message || message.trim().length < 10) {
      errors.message = "Please enter a message with at least 10 characters.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields and try again.",
        errors
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your message has been received by the SSLG office. Thank you for reaching out."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while processing your request."
    });
  }
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found."
    });
  }

  return res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
