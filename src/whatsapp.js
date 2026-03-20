const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const path = require("path");
const qrcode = require("qrcode-terminal");

const SESSION_PATH = path.join(__dirname, "..", "sessions");

let sock = null;
let onMensagemRecebida = null;

// =============================================================
// CONEXÃO COM WHATSAPP VIA BAILEYS (direto, sem Evolution API)
// =============================================================
async function conectarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // gerenciamos o QR manualmente abaixo
    logger: pino({ level: "silent" }), // silencia logs internos do Baileys
    browser: ["Ubuntu", "Chrome", "124.0.0"],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
  });

  // Salva as credenciais sempre que atualizar
  sock.ev.on("creds.update", saveCreds);

  // Gerencia estado da conexão
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n========================================");
      console.log("📱 ESCANEIE O QR CODE COM O WHATSAPP DA LOJA:");
      console.log("========================================\n");
      qrcode.generate(qr, { small: true });
      console.log("\n========================================\n");
    }

    if (connection === "close") {
      const codigo = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const deslogado = codigo === DisconnectReason.loggedOut;

      if (deslogado) {
        console.log(
          "[WhatsApp] ⚠️  Sessão encerrada (logout). Delete a pasta sessions/ e reinicie."
        );
      } else {
        console.log(
          `[WhatsApp] Conexão encerrada (código ${codigo}). Reconectando em 5s...`
        );
        setTimeout(conectarWhatsApp, 5000);
      }
    } else if (connection === "open") {
      console.log("[WhatsApp] ✅ Conectado com sucesso!");
    }
  });

  // Recebe mensagens
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue; // ignora mensagens enviadas pelo bot

      if (onMensagemRecebida) {
        try {
          await onMensagemRecebida(msg);
        } catch (err) {
          console.error("[WhatsApp] Erro ao processar mensagem:", err.message);
        }
      }
    }
  });
}

// Define o handler para mensagens recebidas
function definirHandlerMensagem(handler) {
  onMensagemRecebida = handler;
}

// Envia mensagem de texto
async function enviarMensagem(para, texto) {
  if (!sock) throw new Error("WhatsApp não conectado");
  const jid = para.includes("@") ? para : `${para}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: texto });
  console.log(`[WhatsApp] Mensagem enviada para ${para}`);
}

// Marca mensagem como lida
async function marcarComoLida(key) {
  if (!sock) return;
  try {
    await sock.readMessages([key]);
  } catch (_) {}
}

// Extrai os dados relevantes de uma mensagem Baileys
function extrairDadosMensagem(msg) {
  const remoteJid = msg.key?.remoteJid;
  if (!remoteJid) return null;

  // Ignora grupos
  if (remoteJid.endsWith("@g.us")) return null;

  const de = remoteJid.replace("@s.whatsapp.net", "");
  const nome = msg.pushName || "Cliente";

  const m = msg.message;
  if (!m) return null;

  let texto = null;
  if (m.conversation) {
    texto = m.conversation;
  } else if (m.extendedTextMessage?.text) {
    texto = m.extendedTextMessage.text;
  } else if (m.buttonsResponseMessage?.selectedDisplayText) {
    texto = m.buttonsResponseMessage.selectedDisplayText;
  } else if (m.listResponseMessage?.title) {
    texto = m.listResponseMessage.title;
  } else if (m.imageMessage?.caption) {
    texto = m.imageMessage.caption;
  }

  if (!texto) return null;

  return {
    messageKey: msg.key,
    de,
    nome,
    texto: texto.trim(),
    timestamp: msg.messageTimestamp,
  };
}

module.exports = {
  conectarWhatsApp,
  definirHandlerMensagem,
  enviarMensagem,
  marcarComoLida,
  extrairDadosMensagem,
};
