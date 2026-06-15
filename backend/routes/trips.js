const express = require('express');
const { getDbConnection } = require('../database');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'Título da viagem é obrigatório.' });

        const db = await getDbConnection();
        
        await db.run('BEGIN TRANSACTION');
        
        const result = await db.run(
            'INSERT INTO trips (title, created_by) VALUES (?, ?)',
            [title, req.user.id]
        );
        const tripId = result.lastID;

        await db.run(
            'INSERT INTO trip_participants (trip_id, user_id) VALUES (?, ?)',
            [tripId, req.user.id]
        );

        await db.run('COMMIT');

        res.status(201).json({ message: 'Viagem criada com sucesso.', tripId });
    } catch (error) {
        console.error("Create Trip Error:", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const db = await getDbConnection();
        const trips = await db.all(`
            SELECT t.* FROM trips t
            JOIN trip_participants tp ON t.id = tp.trip_id
            WHERE tp.user_id = ?
            ORDER BY t.created_at DESC
        `, [req.user.id]);
        
        res.json(trips);
    } catch (error) {
        console.error("List Trips Error:", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const db = await getDbConnection();
        const tripId = req.params.id;

        const isParticipant = await db.get('SELECT 1 FROM trip_participants WHERE trip_id = ? AND user_id = ?', [tripId, req.user.id]);
        if (!isParticipant) return res.status(403).json({ error: 'Acesso negado.' });

        const trip = await db.get('SELECT * FROM trips WHERE id = ?', [tripId]);
        
        const participants = await db.all(`
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN trip_participants tp ON u.id = tp.user_id
            WHERE tp.trip_id = ?
        `, [tripId]);

        res.json({ ...trip, participants });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
});

router.post('/:id/participants', async (req, res) => {
    try {
        const { email } = req.body;
        const tripId = req.params.id;

        const db = await getDbConnection();
        const trip = await db.get('SELECT * FROM trips WHERE id = ?', [tripId]);
        
        if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });
        
        if (trip.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Apenas o criador da viagem pode adicionar participantes.' });
        }

        if (trip.is_finished) {
            return res.status(400).json({ error: 'Viagem já finalizada.' });
        }

        const userToAdd = await db.get('SELECT id, name FROM users WHERE email = ?', [email]);
        if (!userToAdd) {
            return res.status(404).json({ error: 'Usuário com este email não encontrado no sistema.' });
        }

        const exists = await db.get('SELECT 1 FROM trip_participants WHERE trip_id = ? AND user_id = ?', [tripId, userToAdd.id]);
        if (exists) {
            return res.status(400).json({ error: 'Usuário já é participante.' });
        }

        await db.run('INSERT INTO trip_participants (trip_id, user_id) VALUES (?, ?)', [tripId, userToAdd.id]);

        res.json({ message: 'Participante adicionado com sucesso.', participant: userToAdd });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
});

router.post('/:id/finish', async (req, res) => {
    try {
        const tripId = req.params.id;
        const db = await getDbConnection();

        const trip = await db.get('SELECT * FROM trips WHERE id = ?', [tripId]);
        if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });

        if (trip.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Apenas o criador pode finalizar a viagem.' });
        }

        await db.run('UPDATE trips SET is_finished = 1 WHERE id = ?', [tripId]);

        res.json({ message: 'Viagem finalizada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = router;
