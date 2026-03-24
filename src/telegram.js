// =============================================================
// ALERTAS VIA TELEGRAM — notificacoes de status do bot
// Configurar: TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env
// Se nao configurados, alertas sao ignorados silenciosamente
// =============================================================
const https = require("https");

function enviarAlertaTelegram(mensagem) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const data = JSON.stringify({
    chat_id: chatId,
    text: mensagem,
  });

  const req = https.request(
    {
      hostname: "api.telegram.org",
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    },
    (res) => {
      if (res.statusCode !== 200) {
        console.error(`[Telegram] Erro HTTP ${res.statusCode}`);
      }
    }
  );

  req.on("error", (err) => console.error("[Telegram] Erro:", err.message));
  req.write(data);
  req.end();
}

module.exports = { enviarAlertaTelegram };
