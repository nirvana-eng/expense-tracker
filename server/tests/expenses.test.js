/**
 * Edge Case Tests for Expenses API
 * Covers: CRUD operations, filtering, pagination, validation, and authorization
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

let authToken = '';
let expenseId = null;
const uniqueEmail = `exptest_${Date.now()}@example.com`;

// Connect to test DB before tests
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Expense Tester',
      email: uniqueEmail,
      password: 'TestPass123!',
    });
  authToken = res.body.data.token;
});

// Cleanup after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Expenses API Edge Cases', () => {
  // ─── CREATE EXPENSE ────────────────────────────────────────────────────────

  describe('POST /api/expenses', () => {
    test('should create a valid expense', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 25.50,
          category: 'Food & Dining',
          description: 'Lunch at restaurant',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expense).toBeDefined();
      expenseId = res.body.data.expense.id || res.body.data.expense._id;
    });

    test('should reject negative amount', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -10,
          category: 'Food & Dining',
          description: 'Negative test',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(400);
    });

    test('should reject zero amount', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 0,
          category: 'Food & Dining',
          description: 'Zero test',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(400);
    });

    test('should reject extremely large amount', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 999999999999,
          category: 'Food & Dining',
          description: 'Huge amount test',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(400);
    });

    test('should reject future date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'Food & Dining',
          description: 'Future date test',
          expense_date: futureDate.toISOString().split('T')[0],
        });

      expect(res.status).toBe(400);
    });

    test('should reject invalid category', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'InvalidCategory',
          description: 'Invalid category test',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(400);
    });

    test('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    test('should sanitize XSS in description', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'Other',
          description: '<script>alert("xss")</script>Normal text',
          expense_date: '2024-06-15',
        });

      if (res.status === 201) {
        expect(res.body.data.expense.description).not.toContain('<script>');
      }
    });

    test('should reject request without auth token', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .send({
          amount: 10,
          category: 'Food & Dining',
          description: 'No auth test',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(401);
    });

    test('should reject very long description', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'Other',
          description: 'A'.repeat(600),
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(400);
    });

    test('should reject invalid date format', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'Other',
          description: 'Bad date',
          expense_date: 'not-a-date',
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET EXPENSES ──────────────────────────────────────────────────────────

  describe('GET /api/expenses', () => {
    test('should return paginated expenses', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.expenses).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    test('should filter by category', async () => {
      const res = await request(app)
        .get('/api/expenses?category=Food%20%26%20Dining')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should filter by date range', async () => {
      const res = await request(app)
        .get('/api/expenses?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should search by description', async () => {
      const res = await request(app)
        .get('/api/expenses?search=Lunch')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should handle page 0 gracefully', async () => {
      const res = await request(app)
        .get('/api/expenses?page=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    test('should handle negative page', async () => {
      const res = await request(app)
        .get('/api/expenses?page=-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    test('should handle limit > 100', async () => {
      const res = await request(app)
        .get('/api/expenses?limit=500')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    test('should handle NoSQL injection in search', async () => {
      const res = await request(app)
        .get("/api/expenses?search='; DROP TABLE expenses; --")
        .set('Authorization', `Bearer ${authToken}`);

      // Should not crash — Mongoose protects against injection
      expect([200, 400]).toContain(res.status);
    });

    test('should sort by amount ascending', async () => {
      const res = await request(app)
        .get('/api/expenses?sortBy=amount&order=ASC')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── UPDATE EXPENSE ────────────────────────────────────────────────────────

  describe('PUT /api/expenses/:id', () => {
    test('should update an existing expense', async () => {
      if (!expenseId) return;

      const res = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 35.00,
          category: 'Food & Dining',
          description: 'Updated lunch expense',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.expense.amount).toBe(35);
    });

    test('should reject update of non-existent expense', async () => {
      // Use a valid but non-existent ObjectId
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'Other',
          description: 'Non-existent',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(404);
    });

    test('should reject invalid ID format', async () => {
      const res = await request(app)
        .put('/api/expenses/abc')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'Other',
          description: 'Invalid ID',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(400);
    });

    test('should reject non-ObjectId ID', async () => {
      const res = await request(app)
        .put('/api/expenses/123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          category: 'Other',
          description: 'Numeric ID',
          expense_date: '2024-06-15',
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE EXPENSE ────────────────────────────────────────────────────────

  describe('DELETE /api/expenses/:id', () => {
    test('should delete an existing expense', async () => {
      if (!expenseId) return;

      const res = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should return 404 for already deleted expense', async () => {
      if (!expenseId) return;

      const res = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    test('should reject deleting non-existent expense', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── STATS ─────────────────────────────────────────────────────────────────

  describe('GET /api/expenses/stats', () => {
    test('should return statistics', async () => {
      const res = await request(app)
        .get('/api/expenses/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.overview).toBeDefined();
      expect(res.body.data.categories).toBeDefined();
      expect(res.body.data.monthly).toBeDefined();
    });

    test('should reject without auth', async () => {
      const res = await request(app).get('/api/expenses/stats');

      expect(res.status).toBe(401);
    });
  });
});
