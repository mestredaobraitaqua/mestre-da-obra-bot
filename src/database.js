const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// =============================================================
// LIMITE DE HISTÓRICO: mantém as últimas X mensagens por cliente
// Evita contexto enorme e custos altos de token
// =============================================================
const MAX_HISTORICO = 20;

// Busca ou cria um cliente pelo número de telefone
async function buscarOuCriarCliente(telefone, nome) {
  let { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("telefone", telefone)
    .single();

  if (!cliente) {
    const { data: novo, error: erroCriacao } = await supabase
      .from("clientes")
      .insert({ telefone, nome, aguardando_humano: false })
      .select()
      .single();

    if (erroCriacao) throw erroCriacao;
    cliente = novo;
  }

  return cliente;
}

// Busca histórico de conversa de um cliente
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

// Salva mensagem do cliente e resposta da IA
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

  console.log(`[DB] Cliente ${telefone} marcado para atendimento humano: ${motivo}`);
}

// Libera cliente de volta para o bot (chamado quando humano resolve)
async function liberarParaBot(telefone) {
  await supabase
    .from("clientes")
    .update({
      aguardando_humano: false,
      motivo_transferencia: null,
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
};
