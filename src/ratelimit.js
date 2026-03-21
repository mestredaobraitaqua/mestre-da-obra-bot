// =============================================================
// RATE LIMITING E BLOQUEIO DE CLIENTES MALICIOSOS
// - Limite: 15 mensagens por minuto por número
// - Bloqueio automático: acima de 30 mensagens por minuto
// - Clientes bloqueados são registrados no banco de dados
// =============================================================
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Contadores em memória — suficiente para instância única
const contadores = new Map();

const LIMITE_AVISO = 15;      // msgs/min antes de ignorar silenciosamente
const LIMITE_BLOQUEIO = 30;   // msgs/min para bloqueio permanente
const JANELA_MS = 60 * 1000;  // janela de 1 minuto

// Cache local de bloqueados para evitar consulta DB a cada mensagem
const bloqueadosCache = new Set();
let cacheCarregado = false;

async function carregarBloqueados() {
  if (cacheCarregado) return;
  try {
    const { data } = await supabase
      .from("clientes")
      .select("telefone")
      .eq("bloqueado", true);
    if (data) data.forEach((c) => bloqueadosCache.add(c.telefone));
    cacheCarregado = true;
  } catch (_) {}
}

// Verifica se o número pode ser atendido
// Retorna: { ok: true } | { limitado: true } | { bloqueado: true, motivo }
async function verificarRateLimit(telefone) {
  await carregarBloqueados();

  // Verifica cache de bloqueados
  if (bloqueadosCache.has(telefone)) {
    return { bloqueado: true, motivo: "permanente" };
  }

  const agora = Date.now();
  const contador = contadores.get(telefone) || { count: 0, windowStart: agora };

  // Reseta a janela se passou 1 minuto
  if (agora - contador.windowStart > JANELA_MS) {
    contador.count = 0;
    contador.windowStart = agora;
  }

  contador.count++;
  contadores.set(telefone, contador);

  // Bloqueio automático por spam
  if (contador.count > LIMITE_BLOQUEIO) {
    await bloquearCliente(telefone, `spam automático — ${contador.count} msgs em menos de 1 minuto`);
    bloqueadosCache.add(telefone);
    return { bloqueado: true, motivo: "spam" };
  }

  // Limite de rate (ignora silenciosamente, sem bloquear)
  if (contador.count > LIMITE_AVISO) {
    return { limitado: true };
  }

  return { ok: true };
}

// Bloqueia permanentemente um número
async function bloquearCliente(telefone, motivo) {
  console.log(`[SEGURANÇA] Bloqueando ${telefone}: ${motivo}`);
  try {
    await supabase
      .from("clientes")
      .upsert(
        {
          telefone,
          bloqueado: true,
          motivo_bloqueio: motivo,
          bloqueado_em: new Date().toISOString(),
        },
        { onConflict: "telefone" }
      );
  } catch (err) {
    console.error("[SEGURANÇA] Erro ao bloquear cliente:", err.message);
  }
}

module.exports = { verificarRateLimit, bloquearCliente };
