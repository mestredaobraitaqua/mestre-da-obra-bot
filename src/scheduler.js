// =============================================================
// AGENDADOR — Relatório diário (C1) + Follow-up de orçamentos (C2)
// =============================================================
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

let enviarMensagemFn = null; // injetado pelo index.js

function iniciarScheduler(fnEnviarMensagem) {
  enviarMensagemFn = fnEnviarMensagem;

  // Relatório diário: todo dia às 17h30 (horário de Brasília)
  cron.schedule(
    "30 17 * * 1-6",
    () => enviarRelatorioDiario(),
    { timezone: "America/Sao_Paulo" }
  );

  // Follow-up de orçamentos: verifica a cada hora entre 8h e 16h
  cron.schedule(
    "0 8-16 * * 1-6",
    () => enviarFollowUps(),
    { timezone: "America/Sao_Paulo" }
  );

  console.log("[Scheduler] Relatório diário: 17h30 (seg-sab)");
  console.log("[Scheduler] Follow-up de orçamentos: verificação horária (8h-16h)");
}

// =============================================================
// C1 — RELATÓRIO DIÁRIO
// =============================================================
async function enviarRelatorioDiario() {
  const numeroPaulo = process.env.NUMERO_PAULO;
  if (!numeroPaulo || !enviarMensagemFn) return;

  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(hoje);
    fimDia.setHours(23, 59, 59, 999);

    const dataStr = hoje.toLocaleDateString("pt-BR");

    // Total de mensagens hoje
    const { count: totalMensagens } = await supabase
      .from("mensagens")
      .select("*", { count: "exact", head: true })
      .gte("created_at", inicioDia.toISOString())
      .lte("created_at", fimDia.toISOString());

    // Clientes novos hoje
    const { count: clientesNovos } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", inicioDia.toISOString());

    // Transferências hoje
    const { data: transferencias } = await supabase
      .from("clientes")
      .select("nome, telefone, motivo_transferencia")
      .gte("transferido_em", inicioDia.toISOString())
      .lte("transferido_em", fimDia.toISOString());

    // Clientes bloqueados hoje
    const { data: bloqueados } = await supabase
      .from("clientes")
      .select("telefone, motivo_bloqueio")
      .gte("bloqueado_em", inicioDia.toISOString())
      .lte("bloqueado_em", fimDia.toISOString());

    // Orçamentos sem resposta (enviados 22-26h atrás, sem mensagem nova depois)
    const { count: semResposta } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .not("orcamento_enviado_em", "is", null)
      .eq("aguardando_humano", false)
      .eq("bloqueado", false);

    // Monta o relatório
    let relatorio = `RELATORIO DIARIO — MESTRE DA OBRA\n`;
    relatorio += `Data: ${dataStr}\n`;
    relatorio += `-----------------------------------\n`;
    relatorio += `Mensagens processadas: ${totalMensagens || 0}\n`;
    relatorio += `Clientes novos: ${clientesNovos || 0}\n`;
    relatorio += `Transferencias para humano: ${transferencias?.length || 0}\n`;
    relatorio += `Clientes bloqueados: ${bloqueados?.length || 0}\n`;
    relatorio += `Orcamentos aguardando resposta: ${semResposta || 0}\n`;

    if (transferencias?.length > 0) {
      relatorio += `\nTRANSFERENCIAS DE HOJE:\n`;
      transferencias.forEach((t) => {
        relatorio += `- ${t.nome || t.telefone}: ${t.motivo_transferencia || "sem motivo"}\n`;
      });
    }

    if (bloqueados?.length > 0) {
      relatorio += `\nCLIENTES BLOQUEADOS HOJE:\n`;
      bloqueados.forEach((b) => {
        relatorio += `- ${b.telefone}: ${b.motivo_bloqueio || "sem motivo"}\n`;
      });
    }

    await enviarMensagemFn(numeroPaulo, relatorio);
    console.log("[Scheduler] Relatorio diario enviado para Paulo.");
  } catch (err) {
    console.error("[Scheduler] Erro ao enviar relatorio:", err.message);
  }
}

// =============================================================
// C2 — FOLLOW-UP AUTOMÁTICO 24H APÓS ORÇAMENTO
// =============================================================
async function enviarFollowUps() {
  if (!enviarMensagemFn) return;

  try {
    const agora = new Date();
    const limite22h = new Date(agora.getTime() - 22 * 60 * 60 * 1000);
    const limite26h = new Date(agora.getTime() - 26 * 60 * 60 * 1000);

    // Busca clientes com orçamento enviado entre 22h e 26h atrás
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, telefone, nome, equipamento_interesse, orcamento_enviado_em")
      .not("orcamento_enviado_em", "is", null)
      .gte("orcamento_enviado_em", limite26h.toISOString())
      .lte("orcamento_enviado_em", limite22h.toISOString())
      .eq("aguardando_humano", false)
      .eq("bloqueado", false)
      .is("followup_enviado_em", null); // não reenvia se já foi feito

    if (!clientes || clientes.length === 0) return;

    for (const cliente of clientes) {
      const nome = cliente.nome || "cliente";
      const equipamento = cliente.equipamento_interesse || "o equipamento";

      const msg =
        `Ola, ${nome}. Verificamos que conversamos sobre um orcamento para ${equipamento}. ` +
        `Caso ainda tenha interesse ou precise de mais informacoes, estamos a disposicao. ` +
        `A Mestre da Obra agradece seu contato.`;

      await enviarMensagemFn(cliente.telefone, msg);

      // Marca que o follow-up foi enviado
      await supabase
        .from("clientes")
        .update({ followup_enviado_em: new Date().toISOString() })
        .eq("id", cliente.id);

      console.log(`[Scheduler] Follow-up enviado para ${cliente.telefone}`);
    }
  } catch (err) {
    console.error("[Scheduler] Erro no follow-up:", err.message);
  }
}

module.exports = { iniciarScheduler, enviarRelatorioDiario };
