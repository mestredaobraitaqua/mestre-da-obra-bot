// =============================================================
// D3 — VALIDACAO DE VARIAVEIS DE AMBIENTE
// Falha na inicializacao em vez de falhar silenciosamente depois
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
const QRCode = require("qrcode");
const {
  conectarWhatsApp,
  definirHandlerMensagem,
  enviarMensagem,
  marcarComoLida,
  mostrarDigitando,
  pararDigitando,
  extrairDadosMensagem,
  obterQRCode,
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
  cancelarFollowUps,
  registrarConsulta,
} = require("./database");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// =============================================================
// DETECCAO DE DESINTERESSE — cancela follow-ups (item 18)
// =============================================================
const PALAVRAS_DESINTERESSE = [
  "nao quero", "não quero", "sem interesse", "nao preciso", "não preciso",
  "desisto", "cancela", "nao obrigado", "não obrigado", "deixa pra la",
  "deixa pra lá", "esquece", "nao tenho interesse", "não tenho interesse",
  "para de mandar", "pare de mandar", "nao manda mais", "não manda mais",
];

// =============================================================
// MENSAGENS PADRAO
// =============================================================

// Boas-vindas personalizada por horario (item 16)
function gerarBoasVindas() {
  const hora = new Date().getHours();
  let cumprimento;
  if (hora >= 5 && hora < 12) cumprimento = "Bom dia";
  else if (hora >= 12 && hora < 18) cumprimento = "Boa tarde";
  else cumprimento = "Boa noite";

  return (
    `${cumprimento}! Sou a Ana, atendente virtual da Mestre da Obra Itaquaquecetuba. ` +
    `Posso ajudar com locacao de ferramentas, orcamentos e entrega. ` +
    `O que voce precisa?`
  );
}

// Mensagem para tipos de midia nao suportados (B7)
const MSG_MIDIA_NAO_SUPORTADA =
  "Recebi sua mensagem, mas só consigo responder a textos e áudios. " +
  "Poderia descrever o que precisa em texto?";

// Mensagem de erro tecnico ao cliente (B3)
const MSG_ERRO_TECNICO =
  "Desculpe, estou com uma dificuldade técnica no momento. " +
  "Tente novamente em alguns instantes ou ligue para a loja.";

// =============================================================
// MIDDLEWARE — Token de autenticacao para rotas sensiveis (item 3)
// Se QR_TOKEN nao configurado, rotas ficam abertas (retrocompativel)
// =============================================================
function verificarToken(req, res, next) {
  const token = process.env.QR_TOKEN;
  if (!token) return next();

  if (req.query.token === token) return next();

  res.status(403).json({ error: "Acesso negado. Token invalido ou ausente." });
}

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

    // Verifica se esta aguardando atendimento humano
    const aguardando = await clienteAguardandoHumano(de);
    if (aguardando) {
      console.log(`[Bot] ${de} aguarda humano — mensagem ignorada`);
      return;
    }

    // B7 — Tipo nao suportado (imagem sem texto, sticker, doc, localizacao)
    if (tipo === "nao_suportado") {
      console.log(`[Bot] ${nome} (${de}): tipo nao suportado (${dadosMensagem.tipoOriginal})`);
      await enviarMensagem(de, MSG_MIDIA_NAO_SUPORTADA);
      return;
    }

    // Busca ou cria cliente (item 15 — retorno { cliente, isNovo })
    const { cliente, isNovo } = await buscarOuCriarCliente(de, nome);

    // B8 — Boas-vindas para clientes novos (item 16 — personalizada)
    if (isNovo) {
      console.log(`[Bot] Novo cliente: ${nome} (${de})`);
      await enviarMensagem(de, gerarBoasVindas());
      return;
    }

    // Item 18 — Detecta desinteresse para cancelar follow-ups
    if (tipo === "texto" && dadosMensagem.texto) {
      const textoLower = dadosMensagem.texto.toLowerCase();
      const temDesinteresse = PALAVRAS_DESINTERESSE.some((p) => textoLower.includes(p));
      if (temDesinteresse && cliente.orcamento_enviado_em && !cliente.followup_cancelado) {
        await cancelarFollowUps(de);
      }
    }

    // B1 — Indicador "digitando..."
    await mostrarDigitando(de);

    // B6 — Transcricao de audio
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

    // Busca historico e processa com IA
    const historico = await buscarHistorico(cliente.id);
    const { resposta, precisaTransferir, motivoTransferencia, orcamentoDado, equipamentoOrcamento } =
      await processarMensagem(historico, textoParaIA);

    // Para o indicador de digitando
    await pararDigitando(de);

    // Salva no banco
    await salvarMensagens(cliente.id, textoParaIA, resposta);

    // C2 — Registra orcamento para follow-up automatico
    if (orcamentoDado && equipamentoOrcamento) {
      await registrarOrcamento(de, equipamentoOrcamento);
      // Item 20 — tracking de demanda
      await registrarConsulta(equipamentoOrcamento);
      console.log(`[Orcamento] ${de}: ${equipamentoOrcamento}`);
    }

    // Envia resposta
    await enviarMensagem(de, resposta);

    // Transferencia para humano (item 17 — aviso de horario)
    if (precisaTransferir) {
      await marcarParaHumano(de, motivoTransferencia);

      // Verifica se esta fora do horario comercial
      const agora = new Date();
      const hora = agora.getHours();
      const dia = agora.getDay();
      const foraDoHorario = hora < 8 || hora >= 17 || dia === 0;

      if (foraDoHorario) {
        await enviarMensagem(
          de,
          "O atendimento presencial funciona de segunda a sabado, das 8h as 17h. " +
          "Sua solicitacao foi registrada e um atendente ira retornar no proximo horario comercial."
        );
      }

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
// ROTAS — protegidas por token se QR_TOKEN estiver configurado (item 3)
// =============================================================
app.get("/", verificarToken, (req, res) => {
  res.json({
    status: "online",
    app: "Mestre da Obra Bot",
    hora: new Date().toLocaleString("pt-BR"),
  });
});

app.get("/qr", verificarToken, async (req, res) => {
  const qr = obterQRCode();
  if (!qr) {
    return res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#f0f0f0">
      <h2 style="color:green">WhatsApp Conectado</h2>
      <p>O bot esta online. Nenhuma acao necessaria.</p>
      <script>setTimeout(()=>location.reload(),15000)</script>
    </body></html>`);
  }
  const qrImage = await QRCode.toDataURL(qr);
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#f0f0f0">
    <h2 style="color:#e53935">Vinculacao necessaria</h2>
    <p>Abra o WhatsApp da loja > Menu > Dispositivos Vinculados > Vincular dispositivo</p>
    <img src="${qrImage}" style="width:280px;height:280px;border:8px solid white;border-radius:12px"/>
    <p style="color:#666;font-size:14px">Esta pagina atualiza automaticamente a cada 20 segundos</p>
    <script>setTimeout(()=>location.reload(),20000)</script>
  </body></html>`);
});

// =============================================================
// INICIALIZACAO
// =============================================================
app.listen(PORT, () => {
  console.log("====================================");
  console.log("Mestre da Obra Bot iniciado");
  console.log(`Porta: ${PORT}`);
  console.log(`Hora: ${new Date().toLocaleString("pt-BR")}`);
  console.log(`Token rotas: ${process.env.QR_TOKEN ? "ativo" : "DESATIVADO (rotas abertas)"}`);
  console.log(`Alertas Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? "ativo" : "desativado"}`);
  console.log("====================================");
});

// C1 + C2 — Inicia agendador de relatorios e follow-ups
iniciarScheduler(enviarMensagem);

conectarWhatsApp().catch((err) => {
  console.error("[Erro critico ao conectar WhatsApp]:", err.message);
  process.exit(1);
});
