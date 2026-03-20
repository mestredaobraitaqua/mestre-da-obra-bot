-- =============================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS - MESTRE DA OBRA BOT
-- Execute este SQL no Supabase: SQL Editor > New Query
-- =============================================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT UNIQUE NOT NULL,
  nome TEXT,
  aguardando_humano BOOLEAN DEFAULT FALSE,
  motivo_transferencia TEXT,
  transferido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens (histórico das conversas)
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_mensagens_cliente_id ON mensagens(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_created_at ON mensagens(created_at);

-- Habilita RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permite que o servidor leia e escreva)
CREATE POLICY "service_clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "service_mensagens" ON mensagens FOR ALL USING (true);

-- =============================================================
-- VERIFICAÇÃO: rode isto para confirmar que funcionou
-- =============================================================
-- SELECT COUNT(*) FROM clientes; -- deve retornar 0
-- SELECT COUNT(*) FROM mensagens; -- deve retornar 0
