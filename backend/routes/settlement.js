const express = require('express');
const { getDbConnection } = require('../database');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// UC09: Gerar prestação de contas (Resumo e Algoritmo de Otimização)
router.get('/:tripId', async (req, res) => {
    try {
        const tripId = req.params.tripId;
        const db = await getDbConnection();

        const isParticipant = await db.get('SELECT 1 FROM trip_participants WHERE trip_id = ? AND user_id = ?', [tripId, req.user.id]);
        if (!isParticipant) return res.status(403).json({ error: 'Acesso negado.' });

        const trip = await db.get('SELECT * FROM trips WHERE id = ?', [tripId]);
        if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });

        const users = await db.all(`
            SELECT u.id, u.name 
            FROM users u
            JOIN trip_participants tp ON u.id = tp.user_id
            WHERE tp.trip_id = ?
        `, [tripId]);

        const usersMap = {};
        const balances = {};
        users.forEach(u => {
            usersMap[u.id] = u.name;
            balances[u.id] = 0;
        });

        const expenses = await db.all('SELECT * FROM expenses WHERE trip_id = ?', [tripId]);
        
        let totalTripCost = 0;

        for (let exp of expenses) {
            totalTripCost += exp.amount;
            
            // Pagador ganha crédito (+ amount)
            if (balances[exp.payer_id] !== undefined) {
                balances[exp.payer_id] += exp.amount;
            }

            const participants = await db.all('SELECT user_id FROM expense_participants WHERE expense_id = ?', [exp.id]);
            const numParticipants = participants.length;
            
            if (numParticipants > 0) {
                const splitAmount = exp.amount / numParticipants;
                for (let p of participants) {
                    if (balances[p.user_id] !== undefined) {
                        balances[p.user_id] -= splitAmount;
                    }
                }
            }
        }

        // RN08: Minimizar transferências (Greedy Algorithm)
        const debtors = [];
        const creditors = [];

        for (const [userId, balance] of Object.entries(balances)) {
            // Arredondar para evitar problemas de ponto flutuante
            const roundedBalance = Math.round(balance * 100) / 100;
            balances[userId] = roundedBalance;

            if (roundedBalance < 0) {
                debtors.push({ userId: parseInt(userId), amount: Math.abs(roundedBalance) });
            } else if (roundedBalance > 0) {
                creditors.push({ userId: parseInt(userId), amount: roundedBalance });
            }
        }

        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const transactions = [];

        let d = 0;
        let c = 0;

        while (d < debtors.length && c < creditors.length) {
            const debtor = debtors[d];
            const creditor = creditors[c];

            const transferAmount = Math.min(debtor.amount, creditor.amount);

            transactions.push({
                from: { id: debtor.userId, name: usersMap[debtor.userId] },
                to: { id: creditor.userId, name: usersMap[creditor.userId] },
                amount: transferAmount.toFixed(2)
            });

            debtor.amount -= transferAmount;
            creditor.amount -= transferAmount;

            // Arredondamento para lidar com imprecisões JS
            debtor.amount = Math.round(debtor.amount * 100) / 100;
            creditor.amount = Math.round(creditor.amount * 100) / 100;

            if (debtor.amount === 0) d++;
            if (creditor.amount === 0) c++;
        }

        const userBalanceList = Object.entries(balances).map(([userId, bal]) => ({
            id: userId,
            name: usersMap[userId],
            balance: bal.toFixed(2)
        }));

        res.json({
            trip_id: tripId,
            total_cost: totalTripCost.toFixed(2),
            balances: userBalanceList,
            transactions: transactions
        });

    } catch (error) {
        console.error("Settlement Error:", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = router;
