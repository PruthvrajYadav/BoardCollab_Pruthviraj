const request = require('supertest');
const app = require('../src/app');

describe('App Middlewares & Base Endpoints', () => {
    it('should return CORS and JSON middleware success on root endpoint', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('BoardCollab API is running');
    });

    it('should return 401 unauthorized when accessing protected room export without token', async () => {
        const res = await request(app).get('/api/rooms/testRoom/export');
        expect(res.statusCode).toEqual(401);
    });
});
