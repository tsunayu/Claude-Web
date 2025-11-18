import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { build } from '../app';

describe('Auth API Integration Tests', () => {
  let app: FastifyInstance;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    app = await build();
    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    const testUser = {
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'Test1234!',
    };

    it('should register a new user successfully', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should fail with invalid email', async () => {
      await request
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail with short password', async () => {
      await request
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `test2${Date.now()}@example.com`,
          password: 'short',
        })
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      await request
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const credentials = {
      email: 'demo@iah.example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(credentials.email);
    });

    it('should fail with invalid password', async () => {
      await request
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      await request
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'demo@iah.example.com',
          password: 'password123',
        });

      token = response.body.token;
    });

    it('should return user info with valid token', async () => {
      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('demo@iah.example.com');
    });

    it('should fail without token', async () => {
      await request.get('/api/v1/auth/me').expect(401);
    });

    it('should fail with invalid token', async () => {
      await request
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
