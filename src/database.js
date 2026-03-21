const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const MAX_HISTORICO = 20;

// Busca ou cria cliente
async function buscarOuCriarCliente(telefone, nome) {
  let { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("telefone", telefone)
    .single();

  if (!cliente) {
    const { data: novo, error } = await supabase
      .from("clientes")
      .insert({ telefone, nome, aguardando_humano: false, bloqueado: false })
      .select()
      .single();
    if (error) throw error;
    cliente = novo;
    cliente._novo = true; // flag para welcome message (B8)
  }

  return cliente;
}

// Busca histórico de conversa
async function buscarHistorico(clienteId) {
  const { data, error } = await supabase
    .from("mensagens")
    .select("role, content")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORICO);

  if (error) throw error;
  return data || [];
}

// Salva mensagens do cliente e do bot
async function salvarMensagens(clienteId, mensagemUsuario, respostaBot) {
  const { error } = await supabase.from("mensagens").insert([
    { cliente_id: clienteId, role: "user", content: mensagemUsuario },
    { cliente_id: clienteId, role: "assistant", content: respostaBot },
  ]);
  if (error) throw error;
}

// Verifica se cliente está aguardando atendimento humano
async function clienteAguardandoHumano(telefone) {
  const { data } = await supabase
    .from("clientes")
    .select("aguardando_humano")
    .eq("telefone", telefone)
    .single();
  return data?.aguardando_humano === true;
}

// Marca cliente para atendimento humano
async function marcarParaHumano(telefone, motivo) {
  await supabase
    .from("clientes")
    .update({
      aguardando_humano: true,
      motivo_transferencia: motivo,
      transferido_em: new Date().toISOString(),
    })
    .eq("telefone", telefone);
  console.log(`[DB] ${telefone} marcado para humano: ${motivo}`);
}

// Libera cliente de volta para o bot
async function liberarParaBot(telefone) {
  await supabase
    .from("clientes")
    .update({ aguardando_humano: false, motivo_transferencia: null })
    .eq("telefone", telefone);
}

// Registra orçamento dado (C2 — follow-up)
async function registrarOrcamento(telefone, equipamento) {
  await supabase
    .from("clientes")
    .update({
      orcamento_enviado_em: new Date().toISOString(),
      equipamento_interesse: equipamento,
      followup_enviado_em: null, // reseta para permitir novo follow-up
    })
    .eq("telefone", telefone);
}

module.exports = {
  buscarOuCriarCliente,
  buscarHistorico,
  salvarMensagens,
  clienteAguardandoHumano,
  marcarParaHumano,
  liberarParaBot,
  registrarOrcamento,
};
