const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const authenticate = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const {
  expenseValidation,
  expenseQueryValidation,
  idParamValidation,
} = require('../middleware/validate');

const router = express.Router();

// All expense routes require authentication
router.use(authenticate);

// ─── GET /api/expenses/stats ─────────────────────────────────────────────────
// Must be defined BEFORE /:id to avoid route conflict
router.get('/stats', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Total spending
    const totalAgg = await Expense.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalSpending = totalAgg.length > 0 ? totalAgg[0].total : 0;
    const totalExpenses = totalAgg.length > 0 ? totalAgg[0].count : 0;

    // Monthly spending (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyAgg = await Expense.aggregate([
      {
        $match: {
          user_id: userId,
          expense_date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$expense_date' },
            month: { $month: '$expense_date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = monthlyAgg.map((r) => {
      const monthStr = String(r._id.month).padStart(2, '0');
      return {
        month: `${r._id.year}-${monthStr}`,
        label: `${monthNames[r._id.month - 1]} ${r._id.year}`,
        total: r.total,
        count: r.count,
      };
    });

    // Category breakdown
    const categoryAgg = await Expense.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const categories = categoryAgg.map((r) => ({
      name: r._id,
      total: r.total,
      count: r.count,
      average: Math.round(r.average * 100) / 100,
    }));

    // This month vs last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const thisMonthAgg = await Expense.aggregate([
      {
        $match: {
          user_id: userId,
          expense_date: { $gte: thisMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const lastMonthAgg = await Expense.aggregate([
      {
        $match: {
          user_id: userId,
          expense_date: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const thisMonth = thisMonthAgg.length > 0 ? thisMonthAgg[0].total : 0;
    const lastMonth = lastMonthAgg.length > 0 ? lastMonthAgg[0].total : 0;
    const percentChange = lastMonth > 0
      ? parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1))
      : thisMonth > 0 ? 100 : 0;

    // Recent expenses (last 5)
    const recent = await Expense.find({ user_id: userId })
      .select('amount category description expense_date receipt_url')
      .sort({ expense_date: -1, created_at: -1 })
      .limit(5)
      .lean();

    // Remap _id to id for consistency
    const recentMapped = recent.map((r) => ({
      id: r._id,
      amount: r.amount,
      category: r.category,
      description: r.description,
      expense_date: r.expense_date,
      receipt_url: r.receipt_url,
    }));

    // Top spending day
    const topDayAgg = await Expense.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$expense_date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    const topSpendingDay = topDayAgg.length > 0
      ? { expense_date: topDayAgg[0]._id, total: topDayAgg[0].total }
      : null;

    res.json({
      success: true,
      data: {
        overview: {
          totalSpending,
          totalExpenses,
          thisMonth,
          lastMonth,
          percentChange,
        },
        monthly,
        categories,
        recent: recentMapped,
        topSpendingDay,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics.',
    });
  }
});

// ─── GET /api/expenses ───────────────────────────────────────────────────────
router.get('/', expenseQueryValidation, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = 'expense_date',
      order = 'DESC',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { user_id: userId };

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.expense_date = {};
      if (startDate) filter.expense_date.$gte = new Date(startDate);
      if (endDate) filter.expense_date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    // Whitelist sort columns
    const allowedSorts = ['expense_date', 'amount', 'category', 'created_at'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'expense_date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 1 : -1;

    // Count total matching records
    const totalCount = await Expense.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Fetch paginated results
    const expenses = await Expense.find(filter)
      .select('amount category description expense_date receipt_url created_at updated_at')
      .sort({ [safeSort]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Remap _id to id for consistency
    const mappedExpenses = expenses.map((e) => ({
      id: e._id,
      amount: e.amount,
      category: e.category,
      description: e.description,
      expense_date: e.expense_date,
      receipt_url: e.receipt_url,
      created_at: e.created_at,
      updated_at: e.updated_at,
    }));

    res.json({
      success: true,
      data: {
        expenses: mappedExpenses,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses.',
    });
  }
});

// ─── GET /api/expenses/:id ───────────────────────────────────────────────────
router.get('/:id', idParamValidation, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    }).lean();

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      });
    }

    res.json({
      success: true,
      data: { expense: { ...expense, id: expense._id } },
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense.',
    });
  }
});

// ─── POST /api/expenses ──────────────────────────────────────────────────────
router.post('/', expenseValidation, async (req, res) => {
  try {
    const { amount, category, description, expense_date, receipt_url } = req.body;

    const expense = await Expense.create({
      user_id: req.user.id,
      amount,
      category,
      description: description || '',
      expense_date,
      receipt_url: receipt_url || null,
    });

    const expenseObj = expense.toObject();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully!',
      data: { expense: { ...expenseObj, id: expenseObj._id } },
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating expense.',
    });
  }
});

// ─── PUT /api/expenses/:id ───────────────────────────────────────────────────
router.put('/:id', idParamValidation, expenseValidation, async (req, res) => {
  try {
    const { amount, category, description, expense_date, receipt_url } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      {
        amount,
        category,
        description: description || '',
        expense_date,
        receipt_url: receipt_url || null,
      },
      { new: true }
    ).lean();

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or you do not have permission to edit it.',
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully!',
      data: { expense: { ...expense, id: expense._id } },
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense.',
    });
  }
});

// ─── DELETE /api/expenses/:id ────────────────────────────────────────────────
router.delete('/:id', idParamValidation, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or you do not have permission to delete it.',
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully!',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense.',
    });
  }
});

module.exports = router;
