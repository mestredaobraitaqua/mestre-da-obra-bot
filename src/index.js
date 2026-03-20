require("dotenv").config();
const express = require("express");
const {
  conectarWhatsApp,
  definirHandlerMensagem,
  enviarMensagem,
  marcarComoLida,
  extrairDadosMensagem,
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

// =============================================================
// HANDLER: PROCESSA CADA MENSAGEM RECEBIDA PELO WHATSAPP
// =============================================================
definirHandlerMensagem(async (msg) => {
  try {
    const mensagem = extrairDadosMensagem(msg);
    if (!mensagem) return;

    const { messageKey, de, nome, texto } = mensagem;

    console.log(`[Mensagem recebida] ${nome} (${de}): ${texto}`);

    // Marca como lida no WhatsApp
    await marcarComoLida(messageKey);

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
      await enviarMensagem(de, resposta);

      console.log(`
========================================
🚨 TRANSFERÊNCIA PARA HUMANO
Cliente: ${nome} (${de})
Motivo: ${motivoTransferencia}
Hora: ${new Date().toLocaleString("pt-BR")}
========================================`);
    } else {
      await enviarMensagem(de, resposta);
    }
  } catch (error) {
    console.error("[Erro ao processar mensagem]:", error.message);
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
// INICIA O SERVIDOR E CONECTA AO WHATSAPP
// =============================================================
app.listen(PORT, () => {
  console.log(`
====================================
🤖 Mestre da Obra Bot iniciado!
🌐 Porta: ${PORT}
⏰ ${new Date().toLocaleString("pt-BR")}
====================================`);
});

conectarWhatsApp().catch((err) => {
  console.error("[Erro crítico ao conectar WhatsApp]:", err.message);
  process.exit(1);
});
