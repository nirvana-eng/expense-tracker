const express = require('express');
const authenticate = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

const router = express.Router();

// ─── POST /api/upload ────────────────────────────────────────────────────────
router.post('/', authenticate, handleUpload('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a file.',
      });
    }

    // Return the file URL path
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully!',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file.',
    });
  }
});

module.exports = router;
