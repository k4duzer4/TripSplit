const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlement');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlement', settlementRoutes);

// Inicializar banco de dados e iniciar o servidor
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});
