// =============================================================
// AGENDADOR — Relatorio diario (C1) + Follow-up D+1/D+2/D+3 (C2)
// =============================================================
const cron = require("node-cron");
const { supabase } = require("./database"); // item 2 — cliente unico

let enviarMensagemFn = null;

function iniciarScheduler(fnEnviarMensagem) {
  enviarMensagemFn = fnEnviarMensagem;

  // Relatorio diario: todo dia as 17h30 (horario de Brasilia)
  cron.schedule(
    "30 17 * * 1-6",
    () => enviarRelatorioDiario(),
    { timezone: "America/Sao_Paulo" }
  );

  // Follow-up de orcamentos: verifica a cada hora entre 8h e 16h
  cron.schedule(
    "0 8-16 * * 1-6",
    () => enviarFollowUps(),
    { timezone: "America/Sao_Paulo" }
  );

  console.log("[Scheduler] Relatorio diario: 17h30 (seg-sab)");
  console.log("[Scheduler] Follow-up D+1/D+2/D+3: verificacao horaria (8h-16h)");
}

// =============================================================
// C1 — RELATORIO DIARIO (item 13 — filtro 7 dias + item 20 — top equipamentos)
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

    // Limite de 7 dias para orcamentos pendentes (item 13)
    const limite7dias = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

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

    // Transferencias hoje
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

    // Orcamentos aguardando resposta (ultimos 7 dias apenas)
    const { count: semResposta } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .not("orcamento_enviado_em", "is", null)
      .gte("orcamento_enviado_em", limite7dias.toISOString())
      .eq("aguardando_humano", false)
      .eq("bloqueado", false)
      .or("followup_cancelado.is.null,followup_cancelado.eq.false");

    // Top 5 equipamentos consultados hoje (item 20)
    const { data: topEquipamentos } = await supabase
      .from("consultas_equipamento")
      .select("equipamento")
      .gte("consultado_em", inicioDia.toISOString())
      .lte("consultado_em", fimDia.toISOString());

    const contagem = {};
    if (topEquipamentos) {
      topEquipamentos.forEach((c) => {
        contagem[c.equipamento] = (contagem[c.equipamento] || 0) + 1;
      });
    }
    const top5 = Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Monta o relatorio
    let relatorio = `RELATORIO DIARIO — MESTRE DA OBRA\n`;
    relatorio += `Data: ${dataStr}\n`;
    relatorio += `-----------------------------------\n`;
    relatorio += `Mensagens processadas: ${totalMensagens || 0}\n`;
    relatorio += `Clientes novos: ${clientesNovos || 0}\n`;
    relatorio += `Transferencias para humano: ${transferencias?.length || 0}\n`;
    relatorio += `Clientes bloqueados: ${bloqueados?.length || 0}\n`;
    relatorio += `Orcamentos aguardando (7 dias): ${semResposta || 0}\n`;

    if (top5.length > 0) {
      relatorio += `\nEQUIPAMENTOS MAIS CONSULTADOS HOJE:\n`;
      top5.forEach(([equip, qtd], i) => {
        relatorio += `${i + 1}. ${equip} (${qtd}x)\n`;
      });
    }

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
// C2 — FOLLOW-UP D+1/D+2/D+3 (item 18 — inteligente + item 7 — nao-bloqueante)
// =============================================================
const MSGS_FOLLOWUP = [
  // D+1 — amigavel
  (nome, equip) =>
    `Ola, ${nome}. Verificamos que conversamos sobre um orcamento para ${equip}. ` +
    `Caso ainda tenha interesse ou precise de mais informacoes, estamos a disposicao. ` +
    `A Mestre da Obra agradece seu contato.`,
  // D+2 — mais direto
  (nome, equip) =>
    `Ola, ${nome}. Passando para saber se decidiu sobre ${equip}. ` +
    `Caso tenha alguma duvida sobre prazos, valores ou entrega, posso ajudar. ` +
    `Se nao tiver mais interesse, sem problema.`,
  // D+3 — ultima tentativa
  (nome, equip) =>
    `Ola, ${nome}. Esta e nossa ultima mensagem sobre o orcamento de ${equip}. ` +
    `Se mudar de ideia, e so nos chamar. A Mestre da Obra agradece pelo interesse.`,
];

async function enviarFollowUps() {
  if (!enviarMensagemFn) return;

  try {
    const agora = new Date();
    const limite22h = new Date(agora.getTime() - 22 * 60 * 60 * 1000);
    const limite26h = new Date(agora.getTime() - 26 * 60 * 60 * 1000);

    // Busca clientes elegiveis para follow-up
    const { data: clientes, error } = await supabase
      .from("clientes")
      .select("id, telefone, nome, equipamento_interesse, orcamento_enviado_em, followup_enviado_em, followup_count")
      .not("orcamento_enviado_em", "is", null)
      .eq("aguardando_humano", false)
      .eq("bloqueado", false)
      .or("followup_cancelado.is.null,followup_cancelado.eq.false")
      .or("followup_count.is.null,followup_count.lt.3");

    if (error) {
      console.error("[Scheduler] Erro ao buscar clientes para follow-up:", error.message);
      return;
    }

    if (!clientes || clientes.length === 0) return;

    // Filtra clientes que estao no timing correto (22-26h desde referencia)
    const elegiveis = clientes.filter((c) => {
      const count = c.followup_count || 0;
      if (count >= 3) return false;

      const ref = count === 0
        ? new Date(c.orcamento_enviado_em)
        : new Date(c.followup_enviado_em);

      return ref >= limite26h && ref <= limite22h;
    });

    if (elegiveis.length === 0) return;

    // Verifica se cliente respondeu desde ultimo follow-up/orcamento
    const elegiveisInativos = [];
    for (const c of elegiveis) {
      const ref = (c.followup_count || 0) === 0
        ? c.orcamento_enviado_em
        : c.followup_enviado_em;

      const { count: msgRecentes } = await supabase
        .from("mensagens")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", c.id)
        .eq("role", "user")
        .gt("created_at", ref);

      // So envia follow-up se cliente NAO respondeu (conversa inativa)
      if (!msgRecentes || msgRecentes === 0) {
        elegiveisInativos.push(c);
      }
    }

    if (elegiveisInativos.length === 0) return;

    // Envia follow-ups de forma nao-bloqueante (item 7 — setTimeout chain)
    enviarFollowUpSequencial(elegiveisInativos, 0);
  } catch (err) {
    console.error("[Scheduler] Erro no follow-up:", err.message);
  }
}

// Envio sequencial nao-bloqueante: nao trava o event loop (item 7)
function enviarFollowUpSequencial(clientes, index) {
  if (index >= clientes.length) return;

  const cliente = clientes[index];
  const nome = cliente.nome || "cliente";
  const equipamento = cliente.equipamento_interesse || "o equipamento";
  const count = cliente.followup_count || 0;

  const gerarMsg = MSGS_FOLLOWUP[count] || MSGS_FOLLOWUP[2];
  const msg = gerarMsg(nome, equipamento);

  enviarMensagemFn(cliente.telefone, msg)
    .then(() =>
      supabase
        .from("clientes")
        .update({
          followup_enviado_em: new Date().toISOString(),
          followup_count: count + 1,
        })
        .eq("id", cliente.id)
    )
    .then(() => {
      console.log(`[Scheduler] Follow-up D+${count + 1} enviado para ${cliente.telefone}`);
    })
    .catch((err) => {
      console.error(`[Scheduler] Erro ao enviar follow-up para ${cliente.telefone}:`, err.message);
    })
    .finally(() => {
      // Agenda proximo com 2min de intervalo (nao-bloqueante)
      setTimeout(() => enviarFollowUpSequencial(clientes, index + 1), 2 * 60 * 1000);
    });
}

module.exports = { iniciarScheduler, enviarRelatorioDiario };
