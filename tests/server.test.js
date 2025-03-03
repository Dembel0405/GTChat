const request = require('supertest');
const express = require('express');
const app = require('../server');

describe('Server API Tests', () => {
    describe('GET /', () => {
        it('should return 200 OK', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
        });
    });

    describe('POST /chat', () => {
        it('should return 400 when message is missing', async () => {
            const response = await request(app)
                .post('/chat')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Message is required');
        });

        it('should return AI response', async () => {
            const response = await request(app)
                .post('/chat')
                .send({ message: 'Привет' });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reply');
        });
    });

    describe('GET /api/news', () => {
        it('should return news array', async () => {
            const response = await request(app).get('/api/news');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /api/contacts', () => {
        it('should return contacts object', async () => {
            const response = await request(app).get('/api/contacts');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
    });
});
