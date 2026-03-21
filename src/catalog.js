// =============================================================
// CATÁLOGO COMPLETO - MESTRE DA OBRA ITAQUAQUECETUBA
// Atualizado com preços reais das planilhas
// Campos de locação: diaria, semanal (7d), quinzenal (15d), mensal (30d)
// =============================================================

// ---------- LOCAÇÃO DE FERRAMENTAS ----------
const catalogLocacao = {

  "Alisamento e Acabamento": [
    { nome: "Alisadora de piso Bambolê Menegotti MAC36 V2", diaria: 315, semanal: 525, quinzenal: 765, mensal: 1025 },
  ],

  "Andaimes e Escoras": [
    { nome: "Andaime - Guarda-corpo 1,00m com porta (por unidade)", diaria: 16.25, semanal: 17.50, quinzenal: 20, mensal: 22.50 },
    { nome: "Andaime - Guarda-corpo 1,00m sem porta (por unidade)", diaria: 16.25, semanal: 17.50, quinzenal: 20, mensal: 22.50 },
    { nome: "Andaime - Guarda-corpo 1,50m com porta (por unidade)", diaria: 16.25, semanal: 17.50, quinzenal: 20, mensal: 22.50 },
    { nome: "Andaime - Guarda-corpo 1,50m sem porta (por unidade)", diaria: 16.25, semanal: 17.50, quinzenal: 20, mensal: 22.50 },
    { nome: "Andaime - Escada 1,00m", diaria: 7, semanal: 12, quinzenal: 16, mensal: 20 },
    { nome: "Andaime - Escada 2,00m", diaria: 10, semanal: 14, quinzenal: 17, mensal: 22 },
    { nome: "Andaime - Perna 1,00 x 1,00m", diaria: 9, semanal: 9, quinzenal: 10, mensal: 12 },
    { nome: "Andaime - Perna 1,00 x 1,50m", diaria: 10, semanal: 10, quinzenal: 11, mensal: 12 },
    { nome: "Andaime - Plataforma 1,0m", diaria: 10, semanal: 13, quinzenal: 15, mensal: 18 },
    { nome: "Andaime - Plataforma 1,5m", diaria: 12, semanal: 13, quinzenal: 15, mensal: 19 },
    { nome: "Andaime - Roda 6\" com freio (por unidade)", diaria: 12, semanal: 12, quinzenal: 15, mensal: 20 },
    { nome: "Andaime - Sapata tubular 1 1/4\" x 450mm (por unidade)", diaria: 6, semanal: 10, quinzenal: 16, mensal: 16 },
    { nome: "Escora metálica 3,10m (alcance 2,00 - 3,20m)", diaria: 16, semanal: 16, quinzenal: 18, mensal: 18 },
  ],

  "Aspiradores": [
    { nome: "Aspirador de pó e água Karcher NT 3.000 30L", diaria: 110, semanal: 210, quinzenal: 290, mensal: 390 },
  ],

  "Betoneiras": [
    { nome: "Betoneira 150 litros - 1/2CV", diaria: 100, semanal: 175, quinzenal: 250, mensal: 350 },
    { nome: "Betoneira 250 litros - 1CV", diaria: 170, semanal: 200, quinzenal: 270, mensal: 370 },
    { nome: "Betoneira 400 litros - 2CV", diaria: 190, semanal: 230, quinzenal: 310, mensal: 410 },
  ],

  "Bombas": [
    { nome: "Bomba submersível 2\" sem boia Buffalo", diaria: 120, semanal: 280, quinzenal: 320, mensal: 440 },
  ],

  "Compactadores": [
    { nome: "Compactador de percussão (Sapo) 4HP", diaria: 240, semanal: 590, quinzenal: 790, mensal: 1150 },
    { nome: "Placa vibratória 6,5HP", diaria: 170, semanal: 490, quinzenal: 560, mensal: 910 },
  ],

  "Compressores": [
    { nome: "Compressor 10PL / 50 litros", diaria: 160, semanal: 360, quinzenal: 460, mensal: 680 },
  ],

  "Corte de Piso e Parede": [
    { nome: "Cortador de pisos e porcelanatos Hessen 122cm", diaria: 100, semanal: 235, quinzenal: 335, mensal: 390 },
    { nome: "Cortadora de parede elétrica 2400W", diaria: 160, semanal: 260, quinzenal: 320, mensal: 400 },
    { nome: "Cortadora de pisos a gasolina 6,5HP", diaria: 235, semanal: 495, quinzenal: 735, mensal: 995 },
  ],

  "Demolição e Rompimento": [
    { nome: "Martelo demolidor 10Kg 32J", diaria: 150, semanal: 420, quinzenal: 520, mensal: 730 },
    { nome: "Martelo demolidor 18Kg 50J", diaria: 170, semanal: 520, quinzenal: 690, mensal: 890 },
    { nome: "Martelo demolidor 30Kg 62J", diaria: 240, semanal: 590, quinzenal: 760, mensal: 970 },
    { nome: "Martelo rompedor rotativo 6Kg 9J", diaria: 140, semanal: 290, quinzenal: 390, mensal: 440 },
  ],

  "Detecção": [
    { nome: "Detector scanner de materiais Bosch TECT 200 C", diaria: 330, semanal: 550, quinzenal: 750, mensal: 970 },
  ],

  "Escadas": [
    { nome: "Escada articulada alumínio 4x4 (16 degraus)", diaria: 100, semanal: 210, quinzenal: 295, mensal: 390 },
    { nome: "Escada de extensão alumínio/fibra 4,80 x 8,40m", diaria: 100, semanal: 230, quinzenal: 265, mensal: 330 },
    { nome: "Escada tesoura alumínio/fibra 4,20m", diaria: 100, semanal: 245, quinzenal: 390, mensal: 440 },
  ],

  "Ferramentas Elétricas": [
    { nome: "Esmerilhadeira angular 4 1/2\"", diaria: 80, semanal: 125, quinzenal: 185, mensal: 255 },
    { nome: "Esmerilhadeira angular 7\"", diaria: 80, semanal: 140, quinzenal: 200, mensal: 255 },
    { nome: "Furadeira de impacto Bosch GSB 16 RE", diaria: 100, semanal: 165, quinzenal: 245, mensal: 295 },
    { nome: "Parafusadeira/furadeira de impacto", diaria: 70, semanal: 160, quinzenal: 205, mensal: 320 },
    { nome: "Morsa de bancada com base giratória 201mm", diaria: 70, semanal: 160, quinzenal: 240, mensal: 290 },
  ],

  "Geradores": [
    { nome: "Gerador a gasolina 6500W 220/110V bifásico", diaria: 195, semanal: 580, quinzenal: 650, mensal: 990 },
  ],

  "Içamento e Movimentação": [
    { nome: "Guincho elétrico 300/600Kg - cabo 12m", diaria: 100, semanal: 180, quinzenal: 290, mensal: 360 },
    { nome: "Guincho elétrico 500/1.000Kg - cabo 12m", diaria: 150, semanal: 220, quinzenal: 320, mensal: 440 },
    { nome: "Talha de corrente 2,0 toneladas - 3m", diaria: 50, semanal: 90, quinzenal: 130, mensal: 180 },
    { nome: "Talha de corrente 3,0 toneladas - 3m", diaria: 60, semanal: 165, quinzenal: 220, mensal: 275 },
    { nome: "Transpallet 2,0 toneladas", diaria: 90, semanal: 280, quinzenal: 340, mensal: 450 },
  ],

  "Inversoras de Solda": [
    { nome: "Inversora de solda MMA 200A (Volcano)", diaria: 100, semanal: 240, quinzenal: 350, mensal: 480 },
    { nome: "Inversora de solda MMA/TIG 127/220V", diaria: 100, semanal: 235, quinzenal: 320, mensal: 420 },
    { nome: "Máscara de solda com auto escurecimento (Noll)", diaria: 30, semanal: 50, quinzenal: 70, mensal: 90 },
  ],

  "Jardinagem": [
    { nome: "Motosserra Husqvarna 353 18\" sabre", diaria: 280, semanal: 450, quinzenal: 590, mensal: 790 },
    { nome: "Perfurador de solo a gasolina 2 tempos com broca", diaria: 150, semanal: 340, quinzenal: 430, mensal: 580 },
    { nome: "Perfurador de solo - Alongador/extensor 1,00m", diaria: 15, semanal: 45, quinzenal: 62, mensal: 75 },
    { nome: "Podadora lança elétrica 600W", diaria: 135, semanal: 340, quinzenal: 410, mensal: 490 },
    { nome: "Roçadeira a gasolina Branco BR 220 Elite", diaria: 120, semanal: 310, quinzenal: 380, mensal: 480 },
    { nome: "Soprador costal 2 tempos Buffalo", diaria: 130, semanal: 240, quinzenal: 350, mensal: 480 },
    { nome: "Soprador de folhas elétrico", diaria: 45, semanal: 110, quinzenal: 150, mensal: 180 },
  ],

  "Lavadoras de Alta Pressão": [
    { nome: "Lavadora de alta pressão Karcher HD 585 Profissional", diaria: 150, semanal: 320, quinzenal: 400, mensal: 500 },
    { nome: "Lavadora de alta pressão Karcher HD 6/15 C Profissional", diaria: 180, semanal: 360, quinzenal: 480, mensal: 660 },
    { nome: "Lavadora extratora Karcher Puzzi 4/30 (carpete/estofado)", diaria: 140, semanal: 280, quinzenal: 460, mensal: 590 },
  ],

  "Lixadeiras": [
    { nome: "Lixadeira de parede e teto Girafinha 750W", diaria: 120, semanal: 240, quinzenal: 300, mensal: 440 },
    { nome: "Lixadeira orbital Bosch GEX 125-1 AE", diaria: 90, semanal: 190, quinzenal: 290, mensal: 390 },
  ],

  "Pintura e Pulverização": [
    { nome: "Pulverizador airless (sem ar comprimido)", diaria: 360, semanal: 600, quinzenal: 900, mensal: 1300 },
  ],

  "Serras": [
    { nome: "Serra circular 7 1/4\" (2 modelos disponíveis)", diaria: 80, semanal: 190, quinzenal: 270, mensal: 320 },
    { nome: "Serra mármore 125mm Bosch Titan", diaria: 65, semanal: 125, quinzenal: 140, mensal: 190 },
    { nome: "Serra tico-tico Bosch GST 75 E", diaria: 90, semanal: 220, quinzenal: 280, mensal: 320 },
  ],

  "Vibração de Concreto": [
    { nome: "Vibrador de concreto com mangote 35mm x 2,5m", diaria: 150, semanal: 280, quinzenal: 350, mensal: 440 },
  ],

};

// ---------- LOCAÇÃO DE INSUMOS ----------
// Itens que acompanham ou complementam as ferramentas, também disponíveis para locação
const catalogLocacaoInsumos = [
  { nome: "Extensão elétrica 2,5mm² x 10m", diaria: 9, semanal: 15.50, quinzenal: 21, mensal: 27.60 },
  { nome: "Extensão elétrica 2,5mm² x 20m", diaria: 16.70, semanal: 28.75, quinzenal: 38.95, mensal: 51.35 },
  { nome: "Extensão elétrica 4mm² x 10m", diaria: 12.85, semanal: 22.10, quinzenal: 30, mensal: 39.50 },
  { nome: "Extensão elétrica 4mm² x 20m", diaria: 24.40, semanal: 42, quinzenal: 56.95, mensal: 75.05 },
  { nome: "Transformador 110V x 220V - 3.000W", diaria: 12, semanal: 20.75, quinzenal: 28.10, mensal: 37.05 },
  { nome: "Disco de flotação 940mm (exclusivo Alisadora MAC36)", diaria: 85, semanal: 175, quinzenal: 350, mensal: 550 },
  { nome: "Protetor de roçagem retrátil 3m x 1,5m", diaria: 120, semanal: 150, quinzenal: 170, mensal: 240 },
];

// ---------- VENDA DE INSUMOS ----------
// Consumíveis e acessórios disponíveis para compra
const catalogVendas = [
  // Aspiradores
  { nome: "Filtro de papel para aspirador/extratora", equipamento: "Aspirador de pó e água", preco: 35 },
  // Bombas
  { nome: "Mangueira 2,0\" PVC azul (para bomba submersível)", equipamento: "Bomba submersível", preco: 560 },
  // Cortadoras de piso
  { nome: "Disco diamantado para asfalto", equipamento: "Cortadora de pisos", preco: 360 },
  { nome: "Disco diamantado para asfalto e concreto", equipamento: "Cortadora de pisos", preco: 360 },
  { nome: "Disco diamantado para concreto", equipamento: "Cortadora de pisos", preco: 360 },
  { nome: "Disco diamantado para concreto/asfalto refrigerador Hessen", equipamento: "Cortadora de pisos Hessen", preco: 450 },
  // Esmerilhadeiras
  { nome: "Disco de corte extra fino 7\" x 1,6mm", equipamento: "Esmerilhadeira 7\"", preco: 10 },
  { nome: "Disco flap 7\"", equipamento: "Esmerilhadeira 7\"", preco: 30 },
  { nome: "Rebolo diamantado tipo prato 115mm (rosca M14)", equipamento: "Esmerilhadeira 4 1/2\"", preco: 76 },
  { nome: "Rebolo diamantado tipo prato 180mm (rosca M14)", equipamento: "Esmerilhadeira 7\"", preco: 167 },
  // Inversoras de solda
  { nome: "Eletrodo revestido E6013 2,50mm (por unidade)", equipamento: "Inversora de solda", preco: 0.70 },
  { nome: "Eletrodo revestido E6013 3,5mm (por unidade)", equipamento: "Inversora de solda", preco: 1.25 },
  // Lixadeiras de parede
  { nome: "Disco abrasivo telado Gr80 - 225mm (Girafinha)", equipamento: "Lixadeira de parede Girafinha", preco: 9 },
  { nome: "Disco abrasivo telado Gr120 - 225mm (Girafinha)", equipamento: "Lixadeira de parede Girafinha", preco: 9 },
  { nome: "Disco abrasivo telado Gr240 - 225mm (Girafinha)", equipamento: "Lixadeira de parede Girafinha", preco: 9 },
  { nome: "Disco abrasivo telado Gr320 - 225mm (Girafinha)", equipamento: "Lixadeira de parede Girafinha", preco: 9 },
  { nome: "Disco abrasivo telado Gr400 - 225mm (Girafinha)", equipamento: "Lixadeira de parede Girafinha", preco: 9 },
  // Roçadeiras
  { nome: "Lâmina 2 facas 305 x 25,4mm (para roçadeira)", equipamento: "Roçadeira", preco: 40 },
  { nome: "Lâmina 3 facas 255mm (para roçadeira)", equipamento: "Roçadeira", preco: 40 },
  // Serras
  { nome: "Serra circular MD 24 dentes", equipamento: "Serra circular", preco: 70 },
];

// ---------- TABELA DE FRETE ----------
const tabelaFrete = [
  { range: "1 a 3 km", preco: 0, descricao: "Grátis" },
  { range: "3,01 a 5 km", preco: 35, descricao: "R$ 35,00" },
  { range: "5,01 a 7 km", preco: 50, descricao: "R$ 50,00" },
  { range: "7,01 a 10 km", preco: 80, descricao: "R$ 80,00" },
  { range: "Acima de 10 km", preco: 120, descricao: "R$ 120,00" },
];

// =============================================================
// FUNÇÕES
// =============================================================

// Calcula orçamento de locação de ferramenta por número de dias
function calcularOrcamento(nomeEquipamento, dias) {
  for (const categoria of Object.values(catalogLocacao)) {
    for (const item of categoria) {
      const nomeLower = item.nome.toLowerCase();
      const buscaLower = nomeEquipamento.toLowerCase();
      const palavrasChave = buscaLower.split(" ").filter((p) => p.length > 3);
      const encontrou =
        nomeLower.includes(buscaLower) ||
        palavrasChave.some((p) => nomeLower.includes(p));

      if (encontrou) {
        let total = 0;
        let detalhes = "";

        if (dias >= 30) {
          const meses = Math.floor(dias / 30);
          const diasRestantes = dias % 30;
          total = meses * item.mensal + diasRestantes * item.diaria;
          detalhes = `${meses} mês(es)${diasRestantes > 0 ? ` + ${diasRestantes} dia(s) adicional(is)` : ""}`;
        } else if (dias >= 15) {
          const quinzenas = Math.floor(dias / 15);
          const diasRestantes = dias % 15;
          total = quinzenas * item.quinzenal + diasRestantes * item.diaria;
          detalhes = `${quinzenas} quinzena(s)${diasRestantes > 0 ? ` + ${diasRestantes} dia(s) adicional(is)` : ""}`;
        } else if (dias >= 7) {
          const semanas = Math.floor(dias / 7);
          const diasRestantes = dias % 7;
          total = semanas * item.semanal + diasRestantes * item.diaria;
          detalhes = `${semanas} semana(s)${diasRestantes > 0 ? ` + ${diasRestantes} dia(s) adicional(is)` : ""}`;
        } else {
          total = dias * item.diaria;
          detalhes = `${dias} diária(s)`;
        }

        return {
          encontrado: true,
          equipamento: item.nome,
          dias,
          detalhes,
          total: Math.round(total * 100) / 100,
          diaria: item.diaria,
          semanal: item.semanal,
          quinzenal: item.quinzenal,
          mensal: item.mensal,
        };
      }
    }
  }
  return { encontrado: false };
}

// Gera texto do catálogo de locação de ferramentas para o prompt da IA
function gerarTextoCatalogo() {
  let texto = "### FERRAMENTAS PARA LOCACAO\n";
  for (const [categoria, itens] of Object.entries(catalogLocacao)) {
    texto += `\n**${categoria}**\n`;
    for (const item of itens) {
      texto += `- ${item.nome}: R$${item.diaria}/dia | R$${item.semanal}/semana | R$${item.quinzenal}/quinzena | R$${item.mensal}/mes\n`;
    }
  }

  texto += "\n### INSUMOS PARA LOCACAO\n";
  texto += "(Itens que podem ser locados junto com as ferramentas)\n";
  for (const item of catalogLocacaoInsumos) {
    texto += `- ${item.nome}: R$${item.diaria}/dia | R$${item.semanal}/semana | R$${item.quinzenal}/quinzena | R$${item.mensal}/mes\n`;
  }

  texto += "\n### INSUMOS E CONSUMIVEIS PARA VENDA\n";
  texto += "(Produtos vendidos avulsos, nao locados)\n";
  for (const item of catalogVendas) {
    texto += `- ${item.nome}: R$${item.preco.toFixed(2)} cada\n`;
  }

  texto += "\n### TABELA DE FRETE (entrega e retirada)\n";
  for (const f of tabelaFrete) {
    texto += `- ${f.range}: ${f.descricao}\n`;
  }

  return texto;
}

module.exports = {
  catalogLocacao,
  catalogLocacaoInsumos,
  catalogVendas,
  tabelaFrete,
  calcularOrcamento,
  gerarTextoCatalogo,
};
