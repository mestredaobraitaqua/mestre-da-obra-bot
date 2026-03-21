// =============================================================
// D3 — VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// Falha na inicialização em vez de falhar silenciosamente depois
// =============================================================
const VARS_OBRIGATORIAS = [
  "ANTHROPIC_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NUMERO_PAULO",
  "GROQ_API_KEY",
];

require("dotenv").config();

const faltando = VARS_OBRIGATORIAS.filter((v) => !process.env[v]);
if (faltando.length > 0) {
  console.error(`[ERRO FATAL] Variaveis de ambiente ausentes: ${faltando.join(", ")}`);
  console.error("Configure o arquivo .env no servidor e reinicie.");
  process.exit(1);
}

const express = require("express");
const {
  conectarWhatsApp,
  definirHandlerMensagem,
  enviarMensagem,
  marcarComoLida,
  mostrarDigitando,
  pararDigitando,
  extrairDadosMensagem,
} = require("./whatsapp");
const { processarMensagem } = require("./ai");
const { transcreverAudio } = require("./groq");
const { verificarRateLimit } = require("./ratelimit");
const { iniciarScheduler } = require("./scheduler");
const {
  buscarOuCriarCliente,
  buscarHistorico,
  salvarMensagens,
  clienteAguardandoHumano,
  marcarParaHumano,
  registrarOrcamento,
} = require("./database");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Mensagem de boas-vindas para clientes novos (B8)
const MSG_BOAS_VINDAS =
  "Bem-vindo à Mestre da Obra Itaquaquecetuba. Sou Ana, sua atendente virtual. " +
  "Posso ajudar com informações sobre locação de ferramentas, orçamentos e entrega. " +
  "Como posso ajudar?";

// Mensagem para tipos de mídia não suportados (B7)
const MSG_MIDIA_NAO_SUPORTADA =
  "Recebi sua mensagem, mas só consigo responder a textos e áudios. " +
  "Poderia descrever o que precisa em texto?";

// Mensagem de erro técnico ao cliente (B3)
const MSG_ERRO_TECNICO =
  "Desculpe, estou com uma dificuldade técnica no momento. " +
  "Tente novamente em alguns instantes ou ligue para a loja.";

// =============================================================
// HANDLER PRINCIPAL — processa cada mensagem recebida
// =============================================================
definirHandlerMensagem(async (msg) => {
  let dadosMensagem = null;
  let textoParaIA = null;

  try {
    dadosMensagem = await extrairDadosMensagem(msg);
    if (!dadosMensagem) return;

    const { tipo, de, nome, messageKey } = dadosMensagem;

    // Marca como lida imediatamente
    await marcarComoLida(messageKey);

    // D2 — Rate limiting
    const rateCheck = await verificarRateLimit(de);
    if (rateCheck.bloqueado) {
      console.log(`[SEGURANÇA] Mensagem de ${de} ignorada (bloqueado: ${rateCheck.motivo})`);
      return;
    }
    if (rateCheck.limitado) {
      console.log(`[RATE LIMIT] ${de} excedeu o limite de mensagens por minuto`);
      return;
    }

    // Verifica se está aguardando atendimento humano
    const aguardando = await clienteAguardandoHumano(de);
    if (aguardando) {
      console.log(`[Bot] ${de} aguarda humano — mensagem ignorada`);
      return;
    }

    // B7 — Tipo não suportado (imagem sem texto, sticker, doc, localização)
    if (tipo === "nao_suportado") {
      console.log(`[Bot] ${nome} (${de}): tipo nao suportado (${dadosMensagem.tipoOriginal})`);
      await enviarMensagem(de, MSG_MIDIA_NAO_SUPORTADA);
      return;
    }

    // Busca ou cria cliente
    const cliente = await buscarOuCriarCliente(de, nome);

    // B8 — Boas-vindas para clientes novos
    if (cliente._novo) {
      console.log(`[Bot] Novo cliente: ${nome} (${de})`);
      await enviarMensagem(de, MSG_BOAS_VINDAS);
      return; // aguarda a próxima mensagem para iniciar a conversa
    }

    // B1 — Indicador "digitando..."
    await mostrarDigitando(de);

    // B6 — Transcrição de áudio
    if (tipo === "audio") {
      console.log(`[Bot] ${nome} (${de}): audio recebido, transcrevendo...`);
      try {
        textoParaIA = await transcreverAudio(dadosMensagem.audioBuffer, dadosMensagem.mimeType);
        if (!textoParaIA || textoParaIA.length < 2) {
          await pararDigitando(de);
          await enviarMensagem(de, "Não consegui entender o áudio. Poderia digitar sua mensagem?");
          return;
        }
        console.log(`[Bot] Audio transcrito: "${textoParaIA.substring(0, 60)}..."`);
      } catch (errAudio) {
        console.error("[Bot] Erro na transcricao:", errAudio.message);
        await pararDigitando(de);
        await enviarMensagem(de, "Não consegui processar o áudio. Poderia digitar sua mensagem?");
        return;
      }
    } else if (tipo === "audio_erro") {
      await pararDigitando(de);
      await enviarMensagem(de, "Não consegui carregar o áudio. Poderia digitar sua mensagem?");
      return;
    } else {
      textoParaIA = dadosMensagem.texto;
    }

    console.log(`[Mensagem] ${nome} (${de}): ${textoParaIA}`);

    // Busca histórico e processa com IA
    const historico = await buscarHistorico(cliente.id);
    const { resposta, precisaTransferir, motivoTransferencia, orcamentoDado, equipamentoOrcamento } =
      await processarMensagem(historico, textoParaIA);

    // Para o indicador de digitando
    await pararDigitando(de);

    // Salva no banco
    await salvarMensagens(cliente.id, textoParaIA, resposta);

    // C2 — Registra orçamento para follow-up automático
    if (orcamentoDado && equipamentoOrcamento) {
      await registrarOrcamento(de, equipamentoOrcamento);
      console.log(`[Orcamento] ${de}: ${equipamentoOrcamento}`);
    }

    // Envia resposta
    await enviarMensagem(de, resposta);

    // Transferência para humano
    if (precisaTransferir) {
      await marcarParaHumano(de, motivoTransferencia);
      console.log(`\n========================================`);
      console.log(`TRANSFERENCIA PARA HUMANO`);
      console.log(`Cliente: ${nome} (${de})`);
      console.log(`Motivo: ${motivoTransferencia}`);
      console.log(`Hora: ${new Date().toLocaleString("pt-BR")}`);
      console.log(`========================================\n`);
    }
  } catch (error) {
    console.error("[Erro ao processar mensagem]:", error.message);

    // B3 — Informa o cliente que houve erro
    if (dadosMensagem?.de) {
      try {
        await pararDigitando(dadosMensagem.de);
        await enviarMensagem(dadosMensagem.de, MSG_ERRO_TECNICO);
      } catch (_) {}
    }
  }
});

// =============================================================
// ROTA DE SAÚDE
// =============================================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    app: "Mestre da Obra Bot",
    hora: new Date().toLocaleString("pt-BR"),
  });
});

// =============================================================
// INICIALIZAÇÃO
// =============================================================
app.listen(PORT, () => {
  console.log("====================================");
  console.log("Mestre da Obra Bot iniciado");
  console.log(`Porta: ${PORT}`);
  console.log(`Hora: ${new Date().toLocaleString("pt-BR")}`);
  console.log("====================================");
});

// C1 + C2 — Inicia agendador de relatórios e follow-ups
iniciarScheduler(enviarMensagem);

conectarWhatsApp().catch((err) => {
  console.error("[Erro critico ao conectar WhatsApp]:", err.message);
  process.exit(1);
});
