/**
 * Edge Case Tests for Authentication API
 * Covers: registration, login, token validation, and security edge cases
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

const TEST_USER = {
  name: 'Test User',
  email: `testuser_${Date.now()}@example.com`,
  password: 'SecurePass123!',
};

let authToken = '';

// Connect to test DB before tests
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

// Cleanup after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API Edge Cases', () => {
  // ─── REGISTRATION ──────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email);
      expect(res.body.data.user.password).toBeUndefined(); // password should not be returned
      authToken = res.body.data.token;
    });

    test('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, name: '', email: 'new@test.com' });

      expect(res.status).toBe(400);
    });

    test('should reject name with only spaces', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, name: '   ', email: 'new2@test.com' });

      expect(res.status).toBe(400);
    });

    test('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: 'notanemail' });

      expect(res.status).toBe(400);
    });

    test('should reject email without domain', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: 'user@' });

      expect(res.status).toBe(400);
    });

    test('should reject weak password (no uppercase)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: 'new3@test.com', password: 'weakpass123!' });

      expect(res.status).toBe(400);
    });

    test('should reject weak password (no special char)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: 'new4@test.com', password: 'WeakPass123' });

      expect(res.status).toBe(400);
    });

    test('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: 'new5@test.com', password: 'Ab1!' });

      expect(res.status).toBe(400);
    });

    test('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
    });

    test('should sanitize XSS in name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '<script>alert("xss")</script>John',
          email: `xss_${Date.now()}@test.com`,
          password: 'SecurePass123!',
        });

      if (res.status === 201) {
        expect(res.body.data.user.name).not.toContain('<script>');
      }
    });

    test('should reject extremely long name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A'.repeat(200),
          email: `long_${Date.now()}@test.com`,
          password: 'SecurePass123!',
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── LOGIN ─────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPass123!' });

      expect(res.status).toBe(401);
      // Should not reveal if email exists
      expect(res.body.message).toBe('Invalid email or password.');
    });

    test('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'Whatever123!' });

      expect(res.status).toBe(401);
      // Same message for email not found (prevents user enumeration)
      expect(res.body.message).toBe('Invalid email or password.');
    });

    test('should reject empty body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    test('should reject injection in email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: "'; DROP TABLE users; --", password: 'test' });

      expect(res.status).toBe(400);
    });
  });

  // ─── PROTECTED ROUTES ──────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    test('should return user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(TEST_USER.email);
    });

    test('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    test('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });

    test('should reject malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token');

      expect(res.status).toBe(401);
    });

    test('should reject "Bearer null"', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer null');

      expect(res.status).toBe(401);
    });

    test('should reject "Bearer undefined"', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer undefined');

      expect(res.status).toBe(401);
    });
  });
});
