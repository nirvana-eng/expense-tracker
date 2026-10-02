const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      required: true,
      maxlength: 50,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    expense_date: {
      type: Date,
      required: true,
      index: true,
    },
    receipt_url: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index for user + date queries
expenseSchema.index({ user_id: 1, expense_date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
