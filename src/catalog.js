// =============================================================
// CATÁLOGO DE EQUIPAMENTOS - MESTRE DA OBRA ITAQUAQUECETUBA
// =============================================================
// ATENÇÃO: Preços são EXEMPLOS. Substitua pelos valores reais.
// =============================================================

const catalog = {

  "Acesso e Elevação": [
    { nome: "Andaime Tubular (por módulo)", diaria: 15, semanal: 60, mensal: 180 },
    { nome: "Escada de Alumínio 6m", diaria: 35, semanal: 120, mensal: 350 },
    { nome: "Escada de Alumínio 10m", diaria: 50, semanal: 180, mensal: 500 },
    { nome: "Talha Manual 1 Tonelada", diaria: 40, semanal: 140, mensal: 380 },
    { nome: "Balancim Elétrico", diaria: 120, semanal: 400, mensal: 1100 },
  ],

  "Compactação": [
    { nome: "Placa Vibratória a Gasolina", diaria: 90, semanal: 300, mensal: 800 },
    { nome: "Sapo Compactador (Rammer)", diaria: 110, semanal: 370, mensal: 980 },
    { nome: "Rolo Compactador Pequeno", diaria: 150, semanal: 500, mensal: 1300 },
  ],

  "Concretagem": [
    { nome: "Betoneira 150 Litros", diaria: 80, semanal: 260, mensal: 680 },
    { nome: "Betoneira 400 Litros", diaria: 120, semanal: 400, mensal: 1050 },
    { nome: "Vibrador de Concreto (Mangote)", diaria: 60, semanal: 200, mensal: 530 },
    { nome: "Desempenadeira Elétrica (Helicóptero)", diaria: 130, semanal: 440, mensal: 1150 },
    { nome: "Cortadora de Piso a Gasolina", diaria: 140, semanal: 470, mensal: 1230 },
  ],

  "Ferramentas Elétricas": [
    { nome: "Furadeira de Impacto", diaria: 30, semanal: 100, mensal: 260 },
    { nome: "Parafusadeira/Furadeira", diaria: 28, semanal: 95, mensal: 250 },
    { nome: "Lixadeira Angular (Esmerilhadeira) 4.5\"", diaria: 30, semanal: 100, mensal: 260 },
    { nome: "Lixadeira Angular (Esmerilhadeira) 7\"", diaria: 40, semanal: 135, mensal: 350 },
    { nome: "Lixadeira Orbital", diaria: 35, semanal: 115, mensal: 300 },
    { nome: "Politriz Elétrica", diaria: 45, semanal: 150, mensal: 390 },
  ],

  "Furação e Demolição": [
    { nome: "Martelete Elétrico SDS Plus", diaria: 55, semanal: 185, mensal: 480 },
    { nome: "Martelete Elétrico SDS Max (pesado)", diaria: 80, semanal: 270, mensal: 700 },
    { nome: "Perfuratriz de Coluna", diaria: 100, semanal: 340, mensal: 880 },
    { nome: "Rompedor / Demolidor Elétrico", diaria: 90, semanal: 300, mensal: 780 },
  ],

  "Jardinagem": [
    { nome: "Roçadeira a Gasolina", diaria: 65, semanal: 220, mensal: 570 },
    { nome: "Cortadora de Grama (Triciclo)", diaria: 70, semanal: 235, mensal: 610 },
    { nome: "Motopoda (Serra de Poda)", diaria: 60, semanal: 200, mensal: 520 },
    { nome: "Broca de Solo / Perfurador de Terreno", diaria: 80, semanal: 265, mensal: 690 },
  ],

  "Limpeza": [
    { nome: "Lavadora de Alta Pressão 1500 PSI", diaria: 60, semanal: 200, mensal: 520 },
    { nome: "Lavadora de Alta Pressão 2500 PSI", diaria: 90, semanal: 300, mensal: 780 },
    { nome: "Extratora de Sujeira (Carpet)", diaria: 80, semanal: 265, mensal: 690 },
    { nome: "Aspirador Industrial", diaria: 50, semanal: 165, mensal: 430 },
    { nome: "Enceradeira / Limpadora de Piso", diaria: 65, semanal: 215, mensal: 560 },
  ],

  "Serras": [
    { nome: "Cortadora de Cerâmica (Elétrica)", diaria: 50, semanal: 165, mensal: 430 },
    { nome: "Serra Mármore", diaria: 45, semanal: 150, mensal: 390 },
    { nome: "Serra Circular", diaria: 40, semanal: 135, mensal: 350 },
    { nome: "Serra Tico-Tico", diaria: 35, semanal: 115, mensal: 300 },
    { nome: "Serra de Mesa / Bancada", diaria: 80, semanal: 265, mensal: 690 },
  ],

  "Pintura": [
    { nome: "Pistola de Pintura + Compressor", diaria: 70, semanal: 235, mensal: 610 },
    { nome: "Compressor de Ar 50L", diaria: 55, semanal: 185, mensal: 480 },
    { nome: "Compressor de Ar 100L", diaria: 75, semanal: 250, mensal: 650 },
    { nome: "Airless (Pulverizador sem ar)", diaria: 150, semanal: 500, mensal: 1300 },
  ],

  "Outros Equipamentos": [
    { nome: "Gerador a Gasolina 2.5 kVA", diaria: 100, semanal: 335, mensal: 870 },
    { nome: "Gerador a Gasolina 5 kVA", diaria: 140, semanal: 465, mensal: 1210 },
    { nome: "Inversor de Solda Elétrica", diaria: 60, semanal: 200, mensal: 520 },
    { nome: "Bomba Submersível 1/2 CV", diaria: 50, semanal: 165, mensal: 430 },
    { nome: "Bomba Submersível 1 CV", diaria: 70, semanal: 235, mensal: 610 },
  ],

};

// Função para calcular orçamento
function calcularOrcamento(nomeEquipamento, dias) {
  for (const categoria of Object.values(catalog)) {
    for (const item of categoria) {
      const nomeLower = item.nome.toLowerCase();
      const buscaLower = nomeEquipamento.toLowerCase();
      if (nomeLower.includes(buscaLower) || buscaLower.includes(nomeLower.split(" ")[0])) {
        let total = 0;
        let detalhes = "";

        if (dias >= 25) {
          // Mensal
          const meses = Math.floor(dias / 30);
          const diasRestantes = dias % 30;
          total = (meses * item.mensal) + (diasRestantes * item.diaria);
          detalhes = `${meses} mês(es)${diasRestantes > 0 ? ` + ${diasRestantes} dia(s)` : ""}`;
        } else if (dias >= 6) {
          // Semanal
          const semanas = Math.floor(dias / 7);
          const diasRestantes = dias % 7;
          total = (semanas * item.semanal) + (diasRestantes * item.diaria);
          detalhes = `${semanas} semana(s)${diasRestantes > 0 ? ` + ${diasRestantes} dia(s)` : ""}`;
        } else {
          // Diária
          total = dias * item.diaria;
          detalhes = `${dias} diária(s)`;
        }

        return {
          encontrado: true,
          equipamento: item.nome,
          dias,
          detalhes,
          total,
          diaria: item.diaria,
          semanal: item.semanal,
          mensal: item.mensal,
        };
      }
    }
  }
  return { encontrado: false };
}

// Gera texto completo do catálogo para o prompt da IA
function gerarTextoCatalogo() {
  let texto = "";
  for (const [categoria, itens] of Object.entries(catalog)) {
    texto += `\n## ${categoria}\n`;
    for (const item of itens) {
      texto += `- ${item.nome}: R$${item.diaria}/diária | R$${item.semanal}/semana | R$${item.mensal}/mês\n`;
    }
  }
  return texto;
}

module.exports = { catalog, calcularOrcamento, gerarTextoCatalogo };
