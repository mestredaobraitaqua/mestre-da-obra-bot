const { createClient } = require("@supabase/supabase-js");

// Cliente único exportado — usado por todos os módulos (item 2)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const MAX_HISTORICO = 20;

// Sanitiza nome do perfil do WhatsApp (item 5)
function sanitizarNome(nome) {
  if (!nome) return "Cliente";
  return nome
    .replace(/[<>'"\\;{}]/g, "")
    .substring(0, 100)
    .trim() || "Cliente";
}

// Busca ou cria cliente — retorna { cliente, isNovo } (item 15)
async function buscarOuCriarCliente(telefone, nome) {
  const nomeLimpo = sanitizarNome(nome);

  let { data: cliente, error: errBusca } = await supabase
    .from("clientes")
    .select("*")
    .eq("telefone", telefone)
    .single();

  if (errBusca && errBusca.code !== "PGRST116") {
    console.error("[DB] Erro ao buscar cliente:", errBusca.message);
  }

  if (!cliente) {
    const { data: novo, error } = await supabase
      .from("clientes")
      .insert({ telefone, nome: nomeLimpo, aguardando_humano: false, bloqueado: false })
      .select()
      .single();
    if (error) {
      console.error("[DB] Erro ao criar cliente:", error.message);
      throw error;
    }
    return { cliente: novo, isNovo: true };
  }

  return { cliente, isNovo: false };
}

// Busca historico: 20 mais recentes em ordem cronologica (item 14)
async function buscarHistorico(clienteId) {
  const { data, error } = await supabase
    .from("mensagens")
    .select("role, content")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORICO);

  if (error) {
    console.error("[DB] Erro ao buscar historico:", error.message);
    throw error;
  }

  // Reverte para ordem cronologica (mais antiga primeiro)
  return (data || []).reverse();
}

// Salva mensagens do cliente e do bot (item 6 — logging)
async function salvarMensagens(clienteId, mensagemUsuario, respostaBot) {
  const { error } = await supabase.from("mensagens").insert([
    { cliente_id: clienteId, role: "user", content: mensagemUsuario },
    { cliente_id: clienteId, role: "assistant", content: respostaBot },
  ]);
  if (error) {
    console.error("[DB] Erro ao salvar mensagens:", error.message);
    throw error;
  }
}

// Verifica se cliente esta aguardando atendimento humano (item 6)
async function clienteAguardandoHumano(telefone) {
  const { data, error } = await supabase
    .from("clientes")
    .select("aguardando_humano")
    .eq("telefone", telefone)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("[DB] Erro ao verificar humano:", error.message);
  }
  return data?.aguardando_humano === true;
}

// Marca cliente para atendimento humano (item 6)
async function marcarParaHumano(telefone, motivo) {
  const { error } = await supabase
    .from("clientes")
    .update({
      aguardando_humano: true,
      motivo_transferencia: motivo,
      transferido_em: new Date().toISOString(),
    })
    .eq("telefone", telefone);
  if (error) {
    console.error("[DB] Erro ao marcar para humano:", error.message);
  } else {
    console.log(`[DB] ${telefone} marcado para humano: ${motivo}`);
  }
}

// Libera cliente de volta para o bot (item 6)
async function liberarParaBot(telefone) {
  const { error } = await supabase
    .from("clientes")
    .update({ aguardando_humano: false, motivo_transferencia: null })
    .eq("telefone", telefone);
  if (error) {
    console.error("[DB] Erro ao liberar para bot:", error.message);
  }
}

// Registra orcamento dado — reseta follow-up para novo ciclo D+1/D+2/D+3 (item 18)
async function registrarOrcamento(telefone, equipamento) {
  const { error } = await supabase
    .from("clientes")
    .update({
      orcamento_enviado_em: new Date().toISOString(),
      equipamento_interesse: equipamento,
      followup_enviado_em: null,
      followup_count: 0,
      followup_cancelado: false,
    })
    .eq("telefone", telefone);
  if (error) {
    console.error("[DB] Erro ao registrar orcamento:", error.message);
  }
}

// Cancela follow-ups para um cliente (desinteresse detectado) (item 18)
async function cancelarFollowUps(telefone) {
  const { error } = await supabase
    .from("clientes")
    .update({ followup_cancelado: true })
    .eq("telefone", telefone);
  if (error) {
    console.error("[DB] Erro ao cancelar follow-ups:", error.message);
  } else {
    console.log(`[DB] Follow-ups cancelados para ${telefone}`);
  }
}

// Registra consulta de equipamento para tracking de demanda (item 20)
async function registrarConsulta(equipamento) {
  const { error } = await supabase
    .from("consultas_equipamento")
    .insert({ equipamento, consultado_em: new Date().toISOString() });
  if (error) {
    console.error("[DB] Erro ao registrar consulta:", error.message);
  }
}

module.exports = {
  supabase,
  buscarOuCriarCliente,
  buscarHistorico,
  salvarMensagens,
  clienteAguardandoHumano,
  marcarParaHumano,
  liberarParaBot,
  registrarOrcamento,
  cancelarFollowUps,
  registrarConsulta,
};
