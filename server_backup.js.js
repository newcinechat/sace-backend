/**
 * SERVIDOR SACE - COMPLETO E UNIFICADO
 * Inclui: Express, Multer, PDF-Parse, Persistência Local e Rotas de IA
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'sace_db.json');

app.use(cors());
app.use(express.json());

// Configuração de Upload
const upload = multer({ dest: 'uploads/' });

// Função de Persistência Híbrida
const lerBanco = () => fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : { empresas: [], auditados: [] };
const salvarBanco = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// IA DETETIVE - Análise de Documentos
function analisarTexto(texto) {
    const riscos = [];
    if (!/cônjuge|casado|esposa|marido/i.test(texto)) riscos.push("⚠️ Falta outorga uxória/marital");
    if (!/CAR|INCRA|GEO|SIGEF/i.test(texto)) riscos.push("⚠️ Documentação ambiental ausente");
    if (texto.length < 500) riscos.push("⚠️ Documento insuficiente/incompleto");
    return riscos.length > 0 ? riscos : ["✅ Documento em conformidade"];
}

// ROTA: Análise de Documentos
app.post('/api/analisar-documento', upload.single('documento'), async (req, res) => {
    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdf(dataBuffer);
        const diagnostico = analisarTexto(data.text);
        
        // Persiste o resultado
        const banco = lerBanco();
        banco.auditados.push({ nome: req.file.originalname, diagnostico, data: new Date() });
        salvarBanco(banco);

        fs.unlinkSync(req.file.path);
        res.json({ status: 'sucesso', diagnostico });
    } catch (error) {
        res.status(500).json({ status: 'erro', mensagem: error.message });
    }
});

// ROTA: Radar SACE (Busca de Notícias DF)
app.get('/api/radar-noticias', (req, res) => {
    res.json([
        { titulo: "Regularização de áreas no Paranoá avança", fonte: "Diário do DF" },
        { titulo: "Edital para nova topografia no Setor de Mansões", fonte: "Portal Terra" }
    ]);
});

// ROTA: Cadastro de Empresas
app.post('/api/cadastrar/empresa', (req, res) => {
    const banco = lerBanco();
    banco.empresas.push({ ...req.body, id: Date.now() });
    salvarBanco(banco);
    res.json({ status: 'sucesso' });
});

app.listen(PORT, () => console.log(`🚀 Servidor SACE Completo ativo na porta ${PORT}`));