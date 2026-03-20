const axios = require("axios");

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Envia mensagem de texto simples
async function enviarMensagem(para, texto) {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: para,
        type: "text",
        text: { body: texto },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[WhatsApp] Mensagem enviada para ${para}:`, JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar mensagem:", error.response?.data || error.message);
    throw error;
  }
}

// Envia mensagem com botões (ex: "Falar com atendente" / "Continuar com bot")
async function enviarMensagemComBotoes(para, texto, botoes) {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: para,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: texto },
          action: {
            buttons: botoes.map((btn, idx) => ({
              type: "reply",
              reply: { id: btn.id || `btn_${idx}`, title: btn.titulo },
            })),
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[WhatsApp] Mensagem com botões enviada para ${para}`);
    return response.data;
  } catch (error) {
    // Se botões falharem, envia texto simples como fallback
    console.warn("[WhatsApp] Botões falharam, enviando texto simples");
    return enviarMensagem(para, texto);
  }
}

// Marca mensagem como lida
async function marcarComoLida(messageId) {
  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Não crítico — ignora silenciosamente
  }
}

// Extrai dados da mensagem recebida pelo webhook
function extrairMensagem(body) {
  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) return null;

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    // Suporte a texto e botões interativos
    let texto = null;
    if (message.type === "text") {
      texto = message.text?.body;
    } else if (message.type === "interactive") {
      texto = message.interactive?.button_reply?.title ||
               message.interactive?.list_reply?.title;
    } else if (message.type === "button") {
      texto = message.button?.text;
    }

    if (!texto) return null;

    return {
      messageId: message.id,
      de: message.from, // número do cliente (ex: "5511999999999")
      nome: contact?.profile?.name || "Cliente",
      texto: texto.trim(),
      timestamp: message.timestamp,
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
