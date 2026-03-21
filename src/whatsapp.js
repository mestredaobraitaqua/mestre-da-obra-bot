const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const path = require("path");
const qrcode = require("qrcode-terminal");

const SESSION_PATH = path.join(__dirname, "..", "sessions");

let sock = null;
let onMensagemRecebida = null;

// =============================================================
// CONEXÃO COM WHATSAPP VIA BAILEYS
// =============================================================
async function conectarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "124.0.0"],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n========================================");
      console.log("ESCANEIE O QR CODE COM O WHATSAPP DA LOJA:");
      console.log("========================================\n");
      qrcode.generate(qr, { small: true });
      console.log("\n========================================\n");
    }

    if (connection === "close") {
      const codigo = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const deslogado = codigo === DisconnectReason.loggedOut;

      if (deslogado) {
        console.log("[WhatsApp] Sessao encerrada (logout). Delete a pasta sessions/ e reinicie.");
      } else {
        console.log(`[WhatsApp] Conexao encerrada (codigo ${codigo}). Reconectando em 5s...`);
        setTimeout(conectarWhatsApp, 5000);
      }
    } else if (connection === "open") {
      console.log("[WhatsApp] Conectado com sucesso.");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;

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

// Mostra indicador "digitando..." (B1)
async function mostrarDigitando(jid) {
  if (!sock) return;
  try {
    const jidFormatado = jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
    await sock.sendPresenceUpdate("composing", jidFormatado);
  } catch (_) {}
}

// Para o indicador "digitando..."
async function pararDigitando(jid) {
  if (!sock) return;
  try {
    const jidFormatado = jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
    await sock.sendPresenceUpdate("paused", jidFormatado);
  } catch (_) {}
}

// =============================================================
// EXTRAÇÃO DE MENSAGENS — texto, áudio e outros tipos
// =============================================================
async function extrairDadosMensagem(msg) {
  const remoteJid = msg.key?.remoteJid;
  if (!remoteJid) return null;

  // Ignora grupos
  if (remoteJid.endsWith("@g.us")) return null;

  const de = remoteJid.replace("@s.whatsapp.net", "");
  const nome = msg.pushName || "Cliente";
  const m = msg.message;
  if (!m) return null;

  // ÁUDIO (B6)
  if (m.audioMessage) {
    try {
      const buffer = await downloadMediaMessage(
        msg,
        "buffer",
        {},
        { logger: pino({ level: "silent" }), reuploadRequest: sock.updateMediaMessage }
      );
      return {
        tipo: "audio",
        messageKey: msg.key,
        de,
        nome,
        audioBuffer: buffer,
        mimeType: m.audioMessage.mimetype || "audio/ogg",
        timestamp: msg.messageTimestamp,
      };
    } catch (err) {
      console.error("[WhatsApp] Erro ao baixar áudio:", err.message);
      return {
        tipo: "audio_erro",
        messageKey: msg.key,
        de,
        nome,
        timestamp: msg.messageTimestamp,
      };
    }
  }

  // TEXTO (todos os formatos possíveis)
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

  if (texto) {
    return {
      tipo: "texto",
      messageKey: msg.key,
      de,
      nome,
      texto: texto.trim(),
      timestamp: msg.messageTimestamp,
    };
  }

  // TIPOS NÃO SUPORTADOS (imagem sem legenda, sticker, documento, localização, etc.) (B7)
  const tipoNaoSuportado = Object.keys(m)[0] || "desconhecido";
  return {
    tipo: "nao_suportado",
    tipoOriginal: tipoNaoSuportado,
    messageKey: msg.key,
    de,
    nome,
    timestamp: msg.messageTimestamp,
  };
}

module.exports = {
  conectarWhatsApp,
  definirHandlerMensagem,
  enviarMensagem,
  marcarComoLida,
  mostrarDigitando,
  pararDigitando,
  extrairDadosMensagem,
};
