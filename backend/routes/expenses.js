const express = require('express');
const { getDbConnection } = require('../database');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// Listar despesas de uma viagem
router.get('/trip/:tripId', async (req, res) => {
    try {
        const tripId = req.params.tripId;
        const db = await getDbConnection();

        // Verificar se usuário é participante
        const isParticipant = await db.get('SELECT 1 FROM trip_participants WHERE trip_id = ? AND user_id = ?', [tripId, req.user.id]);
        if (!isParticipant) return res.status(403).json({ error: 'Acesso negado.' });

        const expenses = await db.all(`
            SELECT e.*, u.name as payer_name
            FROM expenses e
            JOIN users u ON e.payer_id = u.id
            WHERE e.trip_id = ?
            ORDER BY e.created_at DESC
        `, [tripId]);

        // Para cada despesa buscar participantes
        for (let exp of expenses) {
            const participants = await db.all(`
                SELECT u.id, u.name 
                FROM users u
                JOIN expense_participants ep ON u.id = ep.user_id
                WHERE ep.expense_id = ?
            `, [exp.id]);
            exp.participants = participants;
        }

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// UC05: Registrar despesa
router.post('/trip/:tripId', async (req, res) => {
    try {
        const tripId = req.params.tripId;
        const { description, amount, payer_id, participants_ids } = req.body;
        
        if (!description || !amount || !payer_id || !participants_ids || participants_ids.length === 0) {
            return res.status(400).json({ error: 'Dados inválidos. É necessário pagador e pelo menos um participante.' });
        }

        const db = await getDbConnection();

        const trip = await db.get('SELECT is_finished FROM trips WHERE id = ?', [tripId]);
        if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });
        
        // RN07: Após finalizar, não é possível adicionar despesas
        if (trip.is_finished) {
            return res.status(400).json({ error: 'Viagem já finalizada, não é possível adicionar despesas.' });
        }

        // RN01: Apenas participantes podem cadastrar despesas
        const isParticipant = await db.get('SELECT 1 FROM trip_participants WHERE trip_id = ? AND user_id = ?', [tripId, req.user.id]);
        if (!isParticipant) return res.status(403).json({ error: 'Acesso negado.' });

        await db.run('BEGIN TRANSACTION');

        const result = await db.run(
            'INSERT INTO expenses (trip_id, description, amount, payer_id) VALUES (?, ?, ?, ?)',
            [tripId, description, amount, payer_id]
        );
        const expenseId = result.lastID;

        for (let pId of participants_ids) {
            await db.run('INSERT INTO expense_participants (expense_id, user_id) VALUES (?, ?)', [expenseId, pId]);
        }

        await db.run('COMMIT');
        res.status(201).json({ message: 'Despesa registrada com sucesso.', expenseId });
    } catch (error) {
        console.error("Add Expense Error", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// UC06: Excluir despesa
router.delete('/:id', async (req, res) => {
    try {
        const expenseId = req.params.id;
        const db = await getDbConnection();

        const expense = await db.get('SELECT trip_id FROM expenses WHERE id = ?', [expenseId]);
        if (!expense) return res.status(404).json({ error: 'Despesa não encontrada.' });

        const trip = await db.get('SELECT is_finished FROM trips WHERE id = ?', [expense.trip_id]);
        if (trip.is_finished) return res.status(400).json({ error: 'Viagem finalizada, não é possível excluir despesa.' });

        await db.run('DELETE FROM expenses WHERE id = ?', [expenseId]);
        res.json({ message: 'Despesa excluída com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = router;
