// =============================================================
// RATE LIMITING E BLOQUEIO DE CLIENTES MALICIOSOS
// - Limite: 15 mensagens por minuto por numero
// - Bloqueio automatico: acima de 30 mensagens por minuto
// - Clientes bloqueados sao registrados no banco de dados
//
// LIMITACAO CONHECIDA (item 9): contadores em memoria nao
// sobrevivem restart do PM2. Apos restart, contadores reiniciam
// em zero. Aceitavel para instancia unica. Cache de bloqueados
// recarrega a cada 5 minutos (item 10).
// =============================================================
const { supabase } = require("./database"); // item 2 — cliente unico

// Contadores em memoria — suficiente para instancia unica
const contadores = new Map();

const LIMITE_AVISO = 15;      // msgs/min antes de ignorar silenciosamente
const LIMITE_BLOQUEIO = 30;   // msgs/min para bloqueio permanente
const JANELA_MS = 60 * 1000;  // janela de 1 minuto

// Cache local de bloqueados — recarrega a cada 5 min (item 10)
const bloqueadosCache = new Set();
let cacheCarregado = false;
let ultimoReloadCache = 0;
const CACHE_RELOAD_MS = 5 * 60 * 1000;

async function carregarBloqueados() {
  const agora = Date.now();

  // Recarrega se nunca carregou ou se passaram 5 minutos
  if (cacheCarregado && (agora - ultimoReloadCache) < CACHE_RELOAD_MS) return;

  try {
    const { data } = await supabase
      .from("clientes")
      .select("telefone")
      .eq("bloqueado", true);

    // Reconstroi o cache (permite desbloqueios manuais via Supabase)
    bloqueadosCache.clear();
    if (data) data.forEach((c) => bloqueadosCache.add(c.telefone));

    cacheCarregado = true;
    ultimoReloadCache = agora;
  } catch (err) {
    console.error("[Rate Limit] Erro ao carregar bloqueados:", err.message);
  }
}

// Verifica se o numero pode ser atendido
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

  // Bloqueio automatico por spam
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

// Bloqueia permanentemente um numero
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
