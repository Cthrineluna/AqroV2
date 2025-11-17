// backend/routes/chat.js
const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');

const faqPath = path.join(__dirname, '..', 'data', 'faq.json');

router.get('/faq', (req, res) => {
  try {
    if (fs.existsSync(faqPath)) {
      const raw = fs.readFileSync(faqPath, 'utf8');
      const json = JSON.parse(raw);
      return res.json({ ok: true, faq: json });
    } else {
      return res.status(404).json({ ok: false, message: 'FAQ file not found' });
    }
  } catch (err) {
    console.error('Failed to read faq:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
