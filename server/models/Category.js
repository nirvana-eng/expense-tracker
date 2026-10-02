const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
  },
  icon: {
    type: String,
    maxlength: 50,
    default: '📦',
  },
  color: {
    type: String,
    maxlength: 7,
    default: '#6C63FF',
  },
});

module.exports = mongoose.model('Category', categorySchema);
