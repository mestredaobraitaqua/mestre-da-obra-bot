require("dotenv").config();
const express = require("express");
const {
  enviarMensagem,
  enviarMensagemComBotoes,
  marcarComoLida,
  extrairMensagem,
} = require("./whatsapp");
const { processarMensagem } = require("./ai");
const {
  buscarOuCriarCliente,
  buscarHistorico,
  salvarMensagens,
  clienteAguardandoHumano,
  marcarParaHumano,
} = require("./database");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// =============================================================
// ROTA DE VERIFICAÇÃO DO WEBHOOK (Meta exige isso na configuração)
// =============================================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] Verificado com sucesso!");
    return res.status(200).send(challenge);
  }

  console.error("[Webhook] Falha na verificação. Token inválido.");
  return res.sendStatus(403);
});

// =============================================================
// ROTA PRINCIPAL: RECEBE MENSAGENS DO WHATSAPP
// =============================================================
app.post("/webhook", async (req, res) => {
  // Responde 200 imediatamente para o Meta não reenviar
  res.sendStatus(200);

  try {
    const mensagem = extrairMensagem(req.body);
    if (!mensagem) return;

    const { messageId, de, nome, texto } = mensagem;

    console.log(`[Mensagem recebida] ${nome} (${de}): ${texto}`);

    // Marca como lida no WhatsApp
    await marcarComoLida(messageId);

    // Verifica se cliente está aguardando atendimento humano
    const aguardando = await clienteAguardandoHumano(de);
    if (aguardando) {
      console.log(`[Bot] ${de} está com humano — mensagem ignorada pelo bot`);
      return;
    }

    // Busca ou cria o cliente no banco
    const cliente = await buscarOuCriarCliente(de, nome);

    // Busca histórico da conversa
    const historico = await buscarHistorico(cliente.id);

    // Processa com IA
    const { resposta, precisaTransferir, motivoTransferencia } =
      await processarMensagem(historico, texto);

    // Salva no banco
    await salvarMensagens(cliente.id, texto, resposta);

    // Se precisa transferir para humano
    if (precisaTransferir) {
      await marcarParaHumano(de, motivoTransferencia);

      // Envia resposta da IA + botão de confirmação
      await enviarMensagem(de, resposta);

      // Notifica a equipe (log por enquanto — futuramente pode ser Telegram/email)
      console.log(`
========================================
🚨 TRANSFERÊNCIA PARA HUMANO
Cliente: ${nome} (${de})
Motivo: ${motivoTransferencia}
Hora: ${new Date().toLocaleString("pt-BR")}
========================================`);
    } else {
      // Resposta normal do bot
      await enviarMensagem(de, resposta);
    }
  } catch (error) {
    console.error("[Erro no webhook]:", error.message);

    // Tenta informar o cliente que houve um problema
    try {
      const mensagem = extrairMensagem(req.body);
      if (mensagem?.de) {
        await enviarMensagem(
          mensagem.de,
          "Desculpe, ocorreu um problema técnico. Tente novamente em instantes ou ligue para a loja. 🙏"
        );
      }
    } catch (_) {}
  }
});

// =============================================================
// ROTA DE SAÚDE: verifica se o servidor está rodando
// =============================================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    app: "Mestre da Obra Bot",
    hora: new Date().toLocaleString("pt-BR"),
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`
====================================
🤖 Mestre da Obra Bot iniciado!
🌐 Porta: ${PORT}
⏰ ${new Date().toLocaleString("pt-BR")}
====================================`);
});
