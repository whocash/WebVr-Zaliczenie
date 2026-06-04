const request = require('supertest');
const { app, pool } = require('./server');

afterAll(async () => {
    await pool.end();
});

describe('Testy Integracyjne API Układu Słonecznego', () => {
    
    it('GET /health powinien zwrócić status 200 i potwierdzić połączenie z bazą', async () => {
        const res = await request(app).get('/health');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'UP');
        expect(res.body).toHaveProperty('database', 'CONNECTED');
    });

    it('GET /api/planets powinien zwrócić listę planet z bazy danych', async () => {
        const res = await request(app).get('/api/planets');
        
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('nazwa');
            expect(res.body[0]).toHaveProperty('promienOrbity');
        }
    });

    it('POST /api/planets/:id/interact powinien zwrócić losowy opis planety', async () => {
        const res = await request(app).post('/api/planets/ziemia/interact');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('nazwa', 'Ziemia');
        expect(res.body).toHaveProperty('opis');
    });
});