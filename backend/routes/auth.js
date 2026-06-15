const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDbConnection } = require('../database');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

// UC01: Cadastrar usuário
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        const db = await getDbConnection();
        
        // Verificar se usuário existe
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }

        // Criptografar senha (RNF02)
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Inserir usuário
        const result = await db.run(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, password_hash]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: result.lastID });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// UC02: Realizar login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const db = await getDbConnection();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Gerar JWT
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ message: 'Login realizado com sucesso', token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

module.exports = router;
