const axios = require("axios");

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://136.248.91.8:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "mestrebot123456";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "mestre-da-obra";

// Envia mensagem de texto simples via Evolution API
async function enviarMensagem(para, texto) {
  try {
    // Remove sufixos do WhatsApp se existirem
    const numero = para.replace("@s.whatsapp.net", "").replace("@c.us", "");

    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        number: numero,
        text: texto,
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[WhatsApp] Mensagem enviada para ${numero}`);
    return response.data;
  } catch (error) {
    console.error(
      "[WhatsApp] Erro ao enviar mensagem:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Envia mensagem com opções numeradas (Evolution API não suporta botões interativos)
async function enviarMensagemComBotoes(para, texto, botoes) {
  const textoComOpcoes =
    texto + "\n\n" + botoes.map((b, i) => `${i + 1}. ${b.titulo}`).join("\n");
  return enviarMensagem(para, textoComOpcoes);
}

// Marca mensagem como lida na Evolution API
async function marcarComoLida(messageKey) {
  try {
    await axios.post(
      `${EVOLUTION_API_URL}/chat/markMessageAsRead/${EVOLUTION_INSTANCE}`,
      { readMessages: [messageKey] },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Não crítico — ignora silenciosamente
  }
}

// Extrai dados da mensagem recebida pelo webhook da Evolution API
function extrairMensagem(body) {
  try {
    // Só processa eventos de novas mensagens
    if (body.event !== "messages.upsert") return null;

    const data = body.data;
    if (!data) return null;

    // Ignora mensagens enviadas pelo próprio bot
    if (data.key?.fromMe) return null;

    const remoteJid = data.key?.remoteJid;
    if (!remoteJid) return null;

    // Extrai o número de telefone
    const de = remoteJid
      .replace("@s.whatsapp.net", "")
      .replace("@c.us", "");

    // Extrai texto de diferentes tipos de mensagem
    let texto = null;
    const msg = data.message;
    if (!msg) return null;

    if (msg.conversation) {
      texto = msg.conversation;
    } else if (msg.extendedTextMessage?.text) {
      texto = msg.extendedTextMessage.text;
    } else if (msg.buttonsResponseMessage?.selectedDisplayText) {
      texto = msg.buttonsResponseMessage.selectedDisplayText;
    } else if (msg.listResponseMessage?.title) {
      texto = msg.listResponseMessage.title;
    }

    if (!texto) return null;

    return {
      messageId: data.key?.id,
      messageKey: data.key,
      de: de,
      nome: data.pushName || "Cliente",
      texto: texto.trim(),
      timestamp: data.messageTimestamp,
    };
  } catch (error) {
    console.error("[WhatsApp] Erro ao extrair mensagem:", error.message);
    return null;
  }
}

module.exports = {
  enviarMensagem,
  enviarMensagemComBotoes,
  marcarComoLida,
  extrairMensagem,
};
