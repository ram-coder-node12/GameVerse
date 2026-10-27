// server/tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  const validUser = {
    username: 'TestPlayer',
    email: 'player@gameverse.test',
    password: 'password123'
  };

  test('POST /api/auth/register - Successfully registers user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(validUser.username);
    expect(res.body.user.passwordHash).toBeUndefined(); // ensure passwordHash is never returned
    expect(res.headers['set-cookie']).toBeDefined(); // cookie set
  });

  test('POST /api/auth/register - Rejects registration with duplicate username or email', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    // Duplicate username
    const resDupUser = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'different@test.com' });
    expect(resDupUser.statusCode).toBe(409);
    expect(resDupUser.body.success).toBe(false);

    // Duplicate email
    const resDupEmail = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, username: 'DifferentUser' });
    expect(resDupEmail.statusCode).toBe(409);
    expect(resDupEmail.body.success).toBe(false);
  });

  test('POST /api/auth/register - Rejects missing fields and short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'invalid', password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Successfully logs in with email or username', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    // Login with email
    const resEmail = await request(app)
      .post('/api/auth/login')
      .send({ identifier: validUser.email, password: validUser.password });
    expect(resEmail.statusCode).toBe(200);
    expect(resEmail.body.success).toBe(true);
    expect(resEmail.body.token).toBeDefined();

    // Login with username
    const resUser = await request(app)
      .post('/api/auth/login')
      .send({ identifier: validUser.username, password: validUser.password });
    expect(resUser.statusCode).toBe(200);
    expect(resUser.body.success).toBe(true);
  });

  test('POST /api/auth/login - Rejects invalid password', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: validUser.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me - Accesses protected user endpoint with Bearer token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUser);
    const token = regRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.username).toBe(validUser.username);
  });

  test('GET /api/auth/me - Rejects unauthorized requests without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('PATCH /api/users/profile - Successfully updates player username', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUser);
    const token = regRes.body.token;

    const patchRes = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'RenamedViper' });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.user.username).toBe('RenamedViper');

    // Confirm in DB
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.body.user.username).toBe('RenamedViper');
  });

  test('PATCH /api/users/profile - Rejects duplicate username', async () => {
    // Register user 1
    await request(app).post('/api/auth/register').send(validUser);

    // Register user 2
    const user2 = { username: 'OtherPlayer', email: 'other@test.local', password: 'password123' };
    const reg2 = await request(app).post('/api/auth/register').send(user2);
    const token2 = reg2.body.token;

    // Try to rename user 2 to TestPlayer
    const patchRes = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token2}`)
      .send({ username: 'TestPlayer' });

    expect(patchRes.statusCode).toBe(400);
    expect(patchRes.body.success).toBe(false);
    expect(patchRes.body.message).toMatch(/already taken/i);
  });

  test('GET /health - Returns 200 and healthy server status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('GameVerse server is healthy');
  });
});
