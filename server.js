const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Configura para servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

// 2. Inicializa banco de dados SQLite local
const db = new sqlite3.Database('./sace.db', (err) => {
    if (err) console.error('Erro ao abrir o SQLite', err.message);
    else console.log('Conectado ao banco de dados SQLite (sace.db).');
});

// 3. Criação das tabelas reais
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS equipe (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        cargo TEXT,
        cidade TEXT,
        tipoRem TEXT,
        valorRem TEXT,
        senha TEXT,
        endereco TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS propostas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_nome TEXT,
        imovel_descricao TEXT,
        valor_total REAL,
        status TEXT DEFAULT 'Pendente'
    )`);
});

// 4. Rotas da API e Rota Principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/equipe', (req, res) => {
    db.all("SELECT * FROM equipe", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/equipe', (req, res) => {
    const { nome, cargo, cidade, tipoRem, valorRem, senha, endereco } = req.body;
    db.run(`INSERT INTO equipe (nome, cargo, cidade, tipoRem, valorRem, senha, endereco) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nome, cargo, cidade, tipoRem, valorRem, senha, endereco],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/api/equipe/:id', (req, res) => {
    db.run(`DELETE FROM equipe WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Inicializa o Servidor
app.listen(PORT, () => {
    console.log(`🚀 SACE Rodando ativado na porta :${PORT}`);
    console.log(`🔒 Operação regulada pela Master Brasília - CEO: Antonio C Santos`);
});
