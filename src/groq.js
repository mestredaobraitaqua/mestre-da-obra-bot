// =============================================================
// TRANSCRIÇÃO DE ÁUDIO — Groq Whisper Large v3
// Gratuito: até 28.800 segundos/mês (~480 min)
// Excelente suporte a português brasileiro
// =============================================================
const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const os = require("os");

let groqClient = null;

function getClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// Transcreve um buffer de áudio para texto em português
async function transcreverAudio(audioBuffer, mimeType = "audio/ogg") {
  // Determina a extensão correta pelo MIME type
  let ext = "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) ext = "mp4";
  else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) ext = "mp3";
  else if (mimeType.includes("webm")) ext = "webm";

  // Salva em arquivo temporário (Groq exige stream ou file)
  const tmpFile = path.join(os.tmpdir(), `audio_${Date.now()}.${ext}`);

  try {
    fs.writeFileSync(tmpFile, audioBuffer);

    const transcription = await getClient().audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: "whisper-large-v3",
      language: "pt",
      response_format: "text",
    });

    const texto = typeof transcription === "string"
      ? transcription.trim()
      : transcription?.text?.trim() || "";

    console.log(`[Groq] Áudio transcrito: "${texto.substring(0, 80)}..."`);
    return texto;
  } finally {
    // Sempre remove o arquivo temporário
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// Item 8 — Cleanup periodico de arquivos temporarios de audio (a cada hora)
const CLEANUP_INTERVAL = 60 * 60 * 1000;
setInterval(() => {
  try {
    const tmpDir = os.tmpdir();
    const files = fs.readdirSync(tmpDir);
    const agora = Date.now();
    let removidos = 0;
    files.forEach((f) => {
      if (f.startsWith("audio_") && /\.(ogg|mp4|mp3|webm)$/.test(f)) {
        const filepath = path.join(tmpDir, f);
        try {
          const stats = fs.statSync(filepath);
          if (agora - stats.mtimeMs > CLEANUP_INTERVAL) {
            fs.unlinkSync(filepath);
            removidos++;
          }
        } catch (_) {}
      }
    });
    if (removidos > 0) {
      console.log(`[Groq] Cleanup: ${removidos} arquivo(s) temporario(s) removido(s)`);
    }
  } catch (_) {}
}, CLEANUP_INTERVAL);

module.exports = { transcreverAudio };
