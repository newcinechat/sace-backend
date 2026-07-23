// É crucial definir Headers e fetch globalmente ANTES de importar o Supabase
global.Headers = global.Headers || require('node-fetch').Headers;
global.fetch = global.fetch || require('node-fetch');

// 2. Carregar variáveis de ambiente OBRIGATORIAMENTE no início
require('dotenv').config({ path: './.env' });

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// Verificação de segurança: checa se as variáveis foram lidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("ERRO CRÍTICO: Variáveis do Supabase não encontradas no .env!");
    process.exit(1);
}

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ... restante do seu código
app.listen(5000, () => console.log("Servidor rodando na porta 5000"));