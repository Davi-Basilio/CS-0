// ==========================================
// ESTADO GLOBAL COMPARTILHADO DO JOGO
// ==========================================
// Todo módulo que precisa ler/alterar esse estado importa os objetos
// abaixo e mexe nas PROPRIEDADES deles (nunca reatribui o próprio
// import, porque bindings importados em ES Modules são somente leitura).

export const estadoJogo = {
  introducaoAtiva: true,
  jogoIniciado: false,
  lendoBilhete: false,
  saúdePlayer: 100,
  saúdeMaxima: 100, // sobe pra 200 depois do capítulo 2 (colete melhor)
  kills: 0,
  bossDerrotado: false, // true depois que o player recolhe as peças do robô — libera o spawn de inimigos de novo
  multiplicadorMunicao: 1.0, // sobe pra 1.5 depois do capítulo 2 (melhoria nas armas)
};

export const MAX_INIMIGOS = 3;

// Listas compartilhadas entre vários módulos (mapa, inimigos, projéteis,
// disparos, loop principal). Os módulos só devem dar push/splice nelas,
// nunca reatribuir (ex: NÃO fazer `alvosInimigos = []`).
export const alvosInimigos = [];
export const listaCaixas = [];
export const granadasEmVoo = [];
export const listaMeshesParedes = [];

// Quantidade de munição que cada arma recebe ao recarregar numa caixa
// (multiplicada por estadoJogo.multiplicadorMunicao — por isso fica
// centralizado aqui em vez de espalhado/duplicado pelas caixas)
export const recargaMunicao = {
  pistola: 20,
  rifle: 50,
  escopeta: 15,
  granada: 5,
  sniper: 10,
};

// ==========================================
// ARMAS E INVENTÁRIO DO JOGADOR
// ==========================================
export const inventario = [
  {
    nome: "Faca",
    munição: Infinity,
    dano: 100,
    firerate: 350,
    tipo: "faca",
    corTracer: null,
  },
  {
    nome: "Pistola",
    munição: 0,
    dano: 20,
    firerate: 400,
    tipo: "bala",
    corTracer: 0xaaaaaa,
  },
  {
    nome: "Rifle",
    munição: 0,
    dano: 15,
    firerate: 100,
    tipo: "bala",
    corTracer: 0xff8c00,
  },
  {
    nome: "Escopeta",
    munição: 0,
    pelotas: 5,
    danoPelota: 10,
    firerate: 750,
    tipo: "shotgun",
    corTracer: 0x87cefa,
  },
  {
    nome: "Granada",
    munição: 0,
    dano: 120,
    firerate: 1000,
    tipo: "granada",
    corTracer: null,
  },
  {
    nome: "Sniper",
    munição: 0,
    danoDistancia: 75,
    danoPerto: 30,
    firerate: 2000,
    tipo: "sniper",
    corTracer: 0xff0000,
  },
];

export const estadoArmas = {
  armaAtualIndex: 0,
  sniperScoped: false,
  zoomAtual: 25,
  mousePressionado: false,
  ultimoTiro: 0,
  facatAtacando: false, // nome original preservado (tinha esse "typo" no código-fonte)
  facaAnimaTime: 0,
};
