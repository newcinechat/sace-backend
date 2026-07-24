const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Garante que a pasta 'uploads' física exista no diretório do projeto para receber os PDFs dos clientes
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configuração do Multer para recebimento seguro dos PDFs dos contratos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // Limite de 15MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos PDF são permitidos!'), false);
        }
    }
});

// Estado global unificado do SACE (Memória e Sincronia Real)
const saceState = {
    slots: {},
    orcamentos: [],
    historicoNacional: []
};

// Inicializa os 30 slots da Sala Master
for (let i = 1; i <= 30; i++) {
    saceState.slots[i] = {
        status: "OFFLINE",
        user: `Filial / Slot ${i}`,
        pedindoPalavra: false
    };
}

// Middlewares do Express
useMiddlewares();
function useMiddlewares() {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));
}

// --- ROTA DE ENTRADA DO CLIENTE: CAPTURA DO CADASTRO + UPLOAD DO PDF ---
app.post('/api/analisar-contrato', upload.single('pdfContrato'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhum arquivo PDF foi enviado pelo cliente.' });
        }

        const dadosCliente = {
            nome: req.body.nome,
            email: req.body.email,
            telefone: req.body.telefone || 'Não informado'
        };

        const caminhoPdfServidor = req.file.path;
        console.log(`[SACE IA DETETIVE] PDF recebido com sucesso de ${dadosCliente.nome}. Salvo em: ${caminhoPdfServidor}`);

        // Aqui o arquivo já está fisicamente salvo em 'uploads/' e pronto para a IA processar.

        res.status(200).json({
            sucesso: true,
            mensagem: 'PDF capturado e enviado para a IA Detetive com sucesso!',
            arquivoSalvo: req.file.filename,
            cliente: dadosCliente
        });

    } catch (error) {
        console.error('[ERRO NO UPLOAD DO CLIENTE]', error);
        res.status(500).json({ erro: 'Erro interno no servidor ao processar o PDF.' });
    }
});

// Rota principal servindo o painel frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- GERENCIAMENTO DE TEMPO REAL (SOCKET.IO) ---
io.on('connection', (socket) => {
    console.log(`[SACE Backend] Cliente conectado: ${socket.id}`);
    
    // Envia o estado atual para o cliente recém-conectado
    socket.emit('atualizar_slots', saceState.slots);
    socket.emit('atualizar_caixa_entrada', saceState.orcamentos);

    // Eventos da Sala Master (Fila de Voz)
    socket.on('solicitar_palavra', (data) => {
        const slotId = data.slot;
        if (saceState.slots[slotId]) {
            saceState.slots[slotId].pedindoPalavra = true;
            io.emit('atualizar_slots', saceState.slots);
        }
    });

    socket.on('atender_slot', (data) => {
        const slotId = data.slot;
        if (saceState.slots[slotId]) {
            saceState.slots[slotId].pedindoPalavra = false;
            io.emit('atualizar_slots', saceState.slots);
        }
    });

    // Eventos da Caixa de Entrada e Relatório Nacional
    socket.on('novo_orcamento', (dados) => {
        const registroCompleto = {
            id: Date.now(),
            cliente: dados.cliente,
            servico: dados.servico,
            valor: dados.valor,
            filial: dados.filial || 'Matriz / Distrito Federal',
            status: 'Pendente',
            dataHora: new Date().toLocaleString('pt-BR')
        };
        
        saceState.orcamentos.unshift(registroCompleto);
        saceState.historicoNacional.unshift(registroCompleto);

        console.log(`[SACE NACIONAL] Novo orçamento lançado pela filial: ${registroCompleto.filial}`);
        
        io.emit('atualizar_caixa_entrada', saceState.orcamentos);
        io.emit('atualizar_relatorio_nacional', saceState.historicoNacional);
    });

    // Autenticação do Relatório Nacional (Protegido por senha Master)
    socket.on('acessar_relatorio_nacional', (credenciais) => {
        if (credenciais.senha === 'genius-master-sace') {
            socket.emit('autorizacao_nacional_concedida', saceState.historicoNacional);
        } else {
            socket.emit('erro_autorizacao', "Senha Master incorreta!");
        }
    });

    socket.on('disconnect', () => {
        console.log(`[SACE Backend] Cliente desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=== SACE BACKEND ONLINE NA PORTA ${PORT} ===`);
});
