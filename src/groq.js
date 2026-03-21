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

module.exports = { transcreverAudio };
