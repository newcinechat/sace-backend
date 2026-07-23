global.Headers = global.Headers || require('node-fetch').Headers;
global.fetch = global.fetch || require('node-fetch');

// CORREÇÃO DO ERRO: Injetamos o WebSocket globalmente para o Supabase
global.WebSocket = global.WebSocket || require('ws');

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Verificação de segurança para garantir que as variáveis estão carregadas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("❌ ERRO: Variáveis de ambiente ausentes no arquivo .env");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY
);

async function testar() {
    console.log("Testando conexão com Supabase...");
    
    try {
        // Tenta buscar um registro simples
        const { data, error } = await supabase
            .from('empresas') 
            .select('*')
            .limit(1);

        if (error) {
            console.error("❌ Erro de Conexão:", error.message);
        } else {
            console.log("✅ Conexão bem-sucedida!");
            console.log("📊 Dados recuperados:", data);
        }
    } catch (e) {
        console.error("❌ Falha crítica na execução:", e.message);
    }
}

testar();