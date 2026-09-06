import * as THREE from "three";
import { scene, camera } from "./scene.js";
import { descartarObjeto3D } from "./utils.js";
import {
  containerHPs,
  updateHUD,
  verificarMortePlayer,
  avisoAcao,
  telaCapitulo2,
} from "./ui.js";
import {
  texturaRostoMafiosoGlobal,
  criarTexturaBracoTatuagem,
} from "./inimigos.js";
import { spawnarCaixaLoot } from "./caixas.js";
import { estadoJogo } from "./estado.js";
import { checarPosicaoValida } from "./mapa.js";
import { executarSom, somAmbiente, musicaBoss } from "./audio.js";
import { controles } from "./controles.js";

// ==========================================
// O BRUTO — BOSS
// ==========================================
// Ataques implementados: soco, investida (carga telegrafada), pisão (área),
// arremesso de escombro (ranged) e fases de fúria (fica mais
// rápido/agressivo perdendo vida). Kit completo, mais a sequência de morte
// (quebra ao meio, revela robô, larga peças recolhíveis) que leva ao
// capítulo 2.

// ---- Constantes de combate ----
const VELOCIDADE_PERSEGUICAO = 0.07;
const MARGEM_COLISAO = 0.6;

const ALCANCE_SOCO = 3.2;
const DANO_SOCO = 15;
const COOLDOWN_SOCO = 900; // ms

const ALCANCE_INVESTIDA_MIN = 6.0;
const ALCANCE_INVESTIDA_MAX = 22.0;
const COOLDOWN_INVESTIDA = 4000; // ms entre uma investida e a próxima
const DURACAO_PREPARACAO = 600; // ms de "aviso" antes de disparar
const VELOCIDADE_INVESTIDA = 0.5;
const DURACAO_MAX_INVESTIDA = 500; // ms — se não acertar até aqui, desiste
const DANO_INVESTIDA = 30;
const FORCA_EMPURRAO = 2.5;
const DURACAO_RECUPERACAO = 900; // ms parado e vulnerável após a investida

// passos.wav é um som de UM passo só — toco ele repetidamente nesse
// intervalo pra simular a caminhada. Mais rápido durante o dash (correndo).
const INTERVALO_PASSO_ANDANDO = 450; // ms
const INTERVALO_PASSO_INVESTIDA = 150; // ms

// Acima desse valor de dano numa pancada só, toca o grunhido de dor mais forte
const LIMIAR_DOR_FORTE = 50;

const ALCANCE_PISAO = 4.2; // um pouco maior que o soco — pega quem tenta ficar só fora do alcance dele
const DANO_PISAO = 25;
const COOLDOWN_PISAO = 5000; // ms
const DURACAO_PREPARACAO_PISAO = 450; // ms de aviso
const DURACAO_RECUPERACAO_PISAO = 700; // ms

// FASES DE FÚRIA: quanto mais vida ele perde, mais rápido ele se move e
// ataca. Os limiares batem com os mesmos 500 de vida perdida do loot
// (fase 2 = já perdeu 500, fase 3 = já perdeu 1000).
const MULTIPLICADORES_FURIA = {
  1: { velocidade: 1.0, cooldown: 1.0 },
  2: { velocidade: 1.25, cooldown: 0.8 },
  3: { velocidade: 1.5, cooldown: 0.6 },
};

// ARREMESSO DE ESCOMBRO — opção à distância, pra ele não ficar 100% indefeso
// se o player ficar só correndo e atirando de longe. Pedra e dano aumentados
// a pedido (era 0.3/20/1.3, virou 0.5/35/1.6).
const ALCANCE_ARREMESSO_MIN = 8.0; // não incomoda em jogar pedra em quem tá muito perto
const COOLDOWN_ARREMESSO = 3500; // ms
const DURACAO_PREPARACAO_ARREMESSO = 500; // ms de aviso
const DURACAO_RECUPERACAO_ARREMESSO = 500; // ms
const DANO_ARREMESSO = 35;
const RAIO_ACERTO_ARREMESSO = 1.6;
const RAIO_PEDRA = 0.5;
// Dentro do alcance da investida, ele às vezes prefere jogar pedra em vez de
// investir, só pra variar (fora desse alcance, o arremesso é a única opção
// e sempre acontece quando o cooldown libera)
const CHANCE_ARREMESSO_NO_ALCANCE_INVESTIDA = 0.4;

// SEQUÊNCIA DE MORTE (quebra + revelação de robô)
const GRAVIDADE_QUEBRA = 0.012;
const RAIO_COLETA = 3.5; // distância pra mostrar "pressione E" e poder recolher

// Textura do tanquinho (sem camisa) — só usada na face da frente do tronco
function criarTexturaTanquinho() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#d2996c";
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(0, 0, 14, 128);
  ctx.fillRect(114, 0, 14, 128);

  ctx.strokeStyle = "rgba(60,30,15,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64, 6);
  ctx.lineTo(64, 122);
  ctx.stroke();

  for (let linha = 0; linha < 3; linha++) {
    const y = 30 + linha * 28;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(108, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(60,30,15,0.12)";
  for (let linha = 0; linha < 3; linha++) {
    const y = 14 + linha * 28;
    ctx.fillRect(22, y, 38, 20);
    ctx.fillRect(68, y, 38, 20);
  }

  ctx.fillStyle = "rgba(60,30,15,0.18)";
  ctx.beginPath();
  ctx.ellipse(40, 12, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(88, 12, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

// Pedra/escombro arremessado — mais simples que a GranadaProjetil do
// projeteis.js (sem ricochete, sem dano em área, sem explosão): só voa em
// arco até acertar o player ou bater no chão.
class EscombroProjetil {
  constructor(posInicial, alvoPos) {
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(RAIO_PEDRA, 0),
      new THREE.MeshStandardMaterial({
        color: 0x5a5a52,
        roughness: 1.0,
        flatShading: true,
      }),
    );
    this.mesh.position.copy(posInicial);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    const direcao = alvoPos.clone().sub(posInicial).normalize();
    this.velocidade = direcao.multiplyScalar(0.42);
    this.velocidade.y += 0.19; // impulso extra pra cima, pro arco

    this.tempoDeVida = 0;
  }

  atualizar() {
    this.mesh.position.add(this.velocidade);
    this.velocidade.y -= 0.01; // pedra é mais pesada que a granada, cai mais rápido
    this.mesh.rotation.x += 0.2;
    this.mesh.rotation.z += 0.15;
    this.tempoDeVida++;
  }
}

export class Boss {
  constructor(x = 0, y = 0, z = -6) {
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);

    this.saúde = 1500;
    this.saúdeMaxima = 1500;
    this.vivo = true; // continua true até as peças serem recolhidas (loop.js chama atualizarIA nele até lá)
    this.podeSerAlvo = true; // vira false assim que a vida chega a 0 — para de poder ser atirado
    this.exibirTagVida = true;
    this.proximoLimiarLoot = 1000;

    // Máquina de estados do combate: 'perseguindo' | 'preparando_investida' | 'investindo' | 'recuperando'
    this.estadoAtaque = "perseguindo";
    // Fase da morte: null (vivo) | 'quebrando' | 'aguardando_coleta' | 'concluido'
    this.faseMorte = null;
    this.ultimoSoco = 0;
    this.ultimaInvestida = 0;
    this.fimPreparacao = 0;
    this.inicioInvestida = 0;
    this.fimRecuperacao = 0;
    this.direcaoInvestida = new THREE.Vector3();
    this.ultimoPasso = 0;
    this.ultimoPisao = 0;
    this.fimPreparacaoPisao = 0;
    this.ultimoArremesso = 0;
    this.fimPreparacaoArremesso = 0;
    this.escombrosAtivos = [];
    this.faseFuria = 1; // 1, 2 ou 3 — sobe conforme perde vida

    // usados só na sequência de morte
    this.partesCima = null;
    this.partesBaixo = null;
    this.velCima = new THREE.Vector3();
    this.velBaixo = new THREE.Vector3();
    this.rotVelCima = new THREE.Vector3();
    this.rotVelBaixo = new THREE.Vector3();
    this.posicaoRecolha = new THREE.Vector3();
    this.pertoDasPartes = false;

    const matPele = new THREE.MeshStandardMaterial({
      color: 0xd2996c,
      roughness: 0.8,
    });
    const matRosto = new THREE.MeshStandardMaterial({
      map: texturaRostoMafiosoGlobal,
      roughness: 0.8,
    });
    const matTanquinho = new THREE.MeshStandardMaterial({
      map: criarTexturaTanquinho(),
      roughness: 0.7,
    });
    const matBermuda = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
    });
    const matBota = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
    });

    this.matTanquinho = matTanquinho; // guardado pra poder piscar vermelho no aviso da investida

    const matBracoDir = new THREE.MeshStandardMaterial({
      map: criarTexturaBracoTatuagem("#d2996c", "LA"),
      roughness: 0.5,
    });
    const matBracoEsq = new THREE.MeshStandardMaterial({
      map: criarTexturaBracoTatuagem("#d2996c", "A-P"),
      roughness: 0.5,
    });

    this.matBracoEsq = matBracoEsq; // guardados pra piscar laranja/ciano nos avisos
    this.matBracoDir = matBracoDir;

    const materiasCabeca = [
      matPele,
      matPele,
      matPele,
      matPele,
      matPele,
      matRosto,
    ];
    const cabeca = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.38, 0.38),
      materiasCabeca,
    );
    cabeca.position.set(0, 1.72, 0);
    cabeca.name = "cabeca";
    cabeca.castShadow = true;

    // Tronco: material por face, igual a cabeça — só a frente (-Z) tem o
    // tanquinho, o resto (inclusive as costas) fica só com a pele lisa.
    const materiaisTronco = [
      matPele,
      matPele,
      matPele,
      matPele,
      matPele,
      matTanquinho,
    ];
    const tronco = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.62, 0.32),
      materiaisTronco,
    );
    tronco.position.set(0, 1.2, 0);
    tronco.name = "tronco";
    tronco.castShadow = true;

    const bracoEsq = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.62, 0.2),
      matBracoEsq,
    );
    bracoEsq.position.set(-0.4, 1.2, 0);
    bracoEsq.name = "bracoEsq";
    bracoEsq.castShadow = true;

    const bracoDir = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.62, 0.2),
      matBracoDir,
    );
    bracoDir.position.set(0.4, 1.2, 0);
    bracoDir.name = "bracoDir";
    bracoDir.castShadow = true;

    const bermudaEsq = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.35, 0.26),
      matBermuda,
    );
    bermudaEsq.position.set(-0.16, 0.73, 0);
    bermudaEsq.name = "bermudaEsq";
    bermudaEsq.castShadow = true;

    const bermudaDir = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.35, 0.26),
      matBermuda,
    );
    bermudaDir.position.set(0.16, 0.73, 0);
    bermudaDir.name = "bermudaDir";
    bermudaDir.castShadow = true;

    const pernaEsq = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.35, 0.22),
      matPele,
    );
    pernaEsq.position.set(-0.16, 0.38, 0);
    pernaEsq.name = "pernaEsq";
    pernaEsq.castShadow = true;

    const pernaDir = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.35, 0.22),
      matPele,
    );
    pernaDir.position.set(0.16, 0.38, 0);
    pernaDir.name = "pernaDir";
    pernaDir.castShadow = true;

    const botaEsq = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.2, 0.28),
      matBota,
    );
    botaEsq.position.set(-0.16, 0.1, -0.03);
    botaEsq.name = "botaEsq";

    const botaDir = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.2, 0.28),
      matBota,
    );
    botaDir.position.set(0.16, 0.1, -0.03);
    botaDir.name = "botaDir";

    this.mesh.add(
      cabeca,
      tronco,
      bracoEsq,
      bracoDir,
      bermudaEsq,
      bermudaDir,
      pernaEsq,
      pernaDir,
      botaEsq,
      botaDir,
    );

    this.mesh.scale.setScalar(1.6);

    this.mesh.traverse((membro) => {
      if (membro instanceof THREE.Mesh) {
        membro.userData = { tipo: "boss", objeto: this, parte: membro.name };
      }
    });

    scene.add(this.mesh);

    this.hpDiv = document.createElement("div");
    this.hpDiv.style.position = "absolute";
    this.hpDiv.style.color = "#ffaa00";
    this.hpDiv.style.fontFamily = "monospace";
    this.hpDiv.style.fontSize = "24px";
    this.hpDiv.style.fontWeight = "bold";
    this.hpDiv.style.textShadow = "2px 2px #000000";
    this.hpDiv.style.willChange = "transform";
    this.hpDiv.innerText = `HP: ${this.saúde} [O BRUTO]`;
    containerHPs.appendChild(this.hpDiv);
  }

  takeDamage(amount, isHeadshot = false) {
    if (!this.podeSerAlvo) return;

    const danoFinal = isHeadshot ? amount * 2 : amount;
    this.saúde -= danoFinal;
    executarSom(danoFinal >= LIMIAR_DOR_FORTE ? "dorforte" : "dorfraca");

    const faseAnterior = this.faseFuria;
    if (this.saúde <= 500) this.faseFuria = 3;
    else if (this.saúde <= 1000) this.faseFuria = 2;
    if (this.saúde > 0 && this.faseFuria > faseAnterior) {
      executarSom("intro"); // reaproveita o rugido de spawn como "grito de fúria" ao subir de fase
    }

    while (this.proximoLimiarLoot > 0 && this.saúde <= this.proximoLimiarLoot) {
      spawnarCaixaLoot("vida");
      spawnarCaixaLoot("vida");
      spawnarCaixaLoot("munição");
      this.proximoLimiarLoot -= 500;
    }

    if (this.saúde <= 0) {
      this.iniciarSequenciaMorte();
    } else {
      this.hpDiv.innerText = isHeadshot
        ? `HP: ${this.saúde} (HS!) [O BRUTO]`
        : `HP: ${this.saúde} [O BRUTO]`;
    }
  }

  // Move na direção dada, respeitando colisão com paredes (mesmo esquema
  // dos inimigos comuns, só com uma margem maior por ele ser bem maior).
  moverNaDirecao(dirX, dirZ, vel) {
    const nextX = this.mesh.position.x + dirX * vel;
    const nextZ = this.mesh.position.z + dirZ * vel;
    if (checarPosicaoValida(nextX, this.mesh.position.z, MARGEM_COLISAO))
      this.mesh.position.x = nextX;
    if (checarPosicaoValida(this.mesh.position.x, nextZ, MARGEM_COLISAO))
      this.mesh.position.z = nextZ;
  }

  // passos.wav é um passo só — esse helper decide QUANDO tocar de novo,
  // criando o loop de caminhada manualmente
  tocarPassoSeNaHora(agora, intervalo) {
    if (agora - this.ultimoPasso >= intervalo) {
      this.ultimoPasso = agora;
      executarSom("passos");
    }
  }

  encararPlayer() {
    const posAlvo = camera.position.clone();
    posAlvo.y = this.mesh.position.y;
    this.mesh.lookAt(posAlvo);
    // mesma pegadinha do lookAt em Object3D comum (não-Camera/Light): ele
    // aponta +Z pro alvo, não -Z, que é a convenção de frente do modelo.
    this.mesh.rotateY(Math.PI);
  }

  iniciarInvestida(agora) {
    this.estadoAtaque = "preparando_investida";
    this.ultimaInvestida = agora;
    this.fimPreparacao = agora + DURACAO_PREPARACAO;
    executarSom("avisos");
    // aviso visual: tanquinho pisca vermelho durante a preparação
    this.matTanquinho.emissive.setHex(0xff0000);
    this.matTanquinho.emissiveIntensity = 0.7;
  }

  terminarInvestida(agora) {
    this.matTanquinho.emissive.setHex(0x000000);
    this.estadoAtaque = "recuperando";
    this.fimRecuperacao = agora + DURACAO_RECUPERACAO;
  }

  iniciarPisao(agora) {
    this.estadoAtaque = "preparando_pisao";
    this.ultimoPisao = agora;
    this.fimPreparacaoPisao = agora + DURACAO_PREPARACAO_PISAO;
    executarSom("avisos");
    // aviso visual: os BRAÇOS piscam laranja (diferente do tanquinho
    // vermelho da investida), pra você aprender a diferenciar os dois
    // avisos rapidinho
    this.matBracoEsq.emissive.setHex(0xff8800);
    this.matBracoEsq.emissiveIntensity = 0.8;
    this.matBracoDir.emissive.setHex(0xff8800);
    this.matBracoDir.emissiveIntensity = 0.8;
  }

  executarPisao(agora) {
    this.matBracoEsq.emissive.setHex(0x000000);
    this.matBracoDir.emissive.setHex(0x000000);
    executarSom("capote");

    const distAgora = this.mesh.position.distanceTo(camera.position);
    if (distAgora <= ALCANCE_PISAO) {
      estadoJogo.saúdePlayer = Math.max(0, estadoJogo.saúdePlayer - DANO_PISAO);
      updateHUD();
      verificarMortePlayer();
    }

    this.estadoAtaque = "recuperando";
    this.fimRecuperacao = agora + DURACAO_RECUPERACAO_PISAO;
  }

  iniciarArremesso(agora) {
    this.estadoAtaque = "preparando_arremesso";
    this.ultimoArremesso = agora;
    this.fimPreparacaoArremesso = agora + DURACAO_PREPARACAO_ARREMESSO;
    executarSom("avisos");
    // só o braço direito (o que arremessa) pisca ciano — vermelho é
    // investida, laranja é pisão, ciano é arremesso
    this.matBracoDir.emissive.setHex(0x00ffff);
    this.matBracoDir.emissiveIntensity = 0.8;
  }

  executarArremesso(agora) {
    this.matBracoDir.emissive.setHex(0x000000);
    executarSom("vento");

    const origemPedra = this.mesh.position.clone();
    origemPedra.y += 1.7; // sai da altura do ombro, não do chão
    this.escombrosAtivos.push(
      new EscombroProjetil(origemPedra, camera.position.clone()),
    );

    this.estadoAtaque = "recuperando";
    this.fimRecuperacao = agora + DURACAO_RECUPERACAO_ARREMESSO;
  }

  // ==========================================
  // SEQUÊNCIA DE MORTE — quebra ao meio e revela que ele era um robô
  // ==========================================
  iniciarSequenciaMorte() {
    this.podeSerAlvo = false;
    this.exibirTagVida = false;
    this.estadoAtaque = null;
    if (this.hpDiv && this.hpDiv.parentNode)
      containerHPs.removeChild(this.hpDiv);

    // limpa qualquer pedra ainda em voo
    this.escombrosAtivos.forEach((pedra) => {
      scene.remove(pedra.mesh);
      descartarObjeto3D(pedra.mesh);
    });
    this.escombrosAtivos.length = 0;

    if (musicaBoss.isPlaying) musicaBoss.stop();
    if (somAmbiente.buffer && !somAmbiente.isPlaying) somAmbiente.play();

    // Materiais metálicos pra revelação de robô — o tronco ganha um
    // "núcleo" que brilha, o resto vira metal fosco
    const matMetal = new THREE.MeshStandardMaterial({
      color: 0x777d82,
      roughness: 0.35,
      metalness: 0.6,
    });
    const matNucleo = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x00c8df,
      emissiveIntensity: 0.7,
    });

    this.partesCima = new THREE.Group();
    this.partesBaixo = new THREE.Group();
    [this.partesCima, this.partesBaixo].forEach((grupo) => {
      grupo.position.copy(this.mesh.position);
      grupo.rotation.copy(this.mesh.rotation);
      grupo.scale.copy(this.mesh.scale);
    });

    const nomesCima = ["cabeca", "tronco", "bracoEsq", "bracoDir"];
    const nomesBaixo = [
      "bermudaEsq",
      "bermudaDir",
      "pernaEsq",
      "pernaDir",
      "botaEsq",
      "botaDir",
    ];

    // precisa copiar a lista antes, porque .add() já remove o filho do
    // pai anterior (mexendo no array original enquanto itera nele ia
    // pular elementos)
    [...this.mesh.children].forEach((filho) => {
      const novoMaterial = filho.name === "tronco" ? matNucleo : matMetal;
      filho.material = Array.isArray(filho.material)
        ? filho.material.map(() => novoMaterial)
        : novoMaterial;

      if (nomesCima.includes(filho.name)) this.partesCima.add(filho);
      else if (nomesBaixo.includes(filho.name)) this.partesBaixo.add(filho);
    });

    scene.remove(this.mesh);
    scene.add(this.partesCima, this.partesBaixo);

    // impulso de separação, cada metade indo pra um lado diferente
    this.velCima.set(
      (Math.random() - 0.5) * 0.15,
      0.22,
      (Math.random() - 0.5) * 0.15 - 0.08,
    );
    this.velBaixo.set(
      (Math.random() - 0.5) * 0.1,
      0.08,
      (Math.random() - 0.5) * 0.1 + 0.08,
    );
    this.rotVelCima.set(
      (Math.random() - 0.5) * 0.12,
      (Math.random() - 0.5) * 0.12,
      0.14,
    );
    this.rotVelBaixo.set(
      (Math.random() - 0.5) * 0.08,
      (Math.random() - 0.5) * 0.08,
      -0.06,
    );

    this.faseMorte = "quebrando";
  }

  atualizarQuebra() {
    this.partesCima.position.add(this.velCima);
    this.velCima.y -= GRAVIDADE_QUEBRA;
    this.partesCima.rotation.x += this.rotVelCima.x;
    this.partesCima.rotation.y += this.rotVelCima.y;
    this.partesCima.rotation.z += this.rotVelCima.z;

    this.partesBaixo.position.add(this.velBaixo);
    this.velBaixo.y -= GRAVIDADE_QUEBRA;
    this.partesBaixo.rotation.x += this.rotVelBaixo.x;
    this.partesBaixo.rotation.z += this.rotVelBaixo.z;

    let cimaPousou = false;
    let baixoPousou = false;

    if (this.partesCima.position.y <= 0.3) {
      this.partesCima.position.y = 0.3;
      this.velCima.set(0, 0, 0);
      cimaPousou = true;
    }
    if (this.partesBaixo.position.y <= 0.15) {
      this.partesBaixo.position.y = 0.15;
      this.velBaixo.set(0, 0, 0);
      baixoPousou = true;
    }

    if (cimaPousou && baixoPousou) {
      this.posicaoRecolha
        .copy(this.partesCima.position)
        .add(this.partesBaixo.position)
        .multiplyScalar(0.5);
      this.faseMorte = "aguardando_coleta";
    }
  }

  atualizarColeta() {
    const dist = camera.position.distanceTo(this.posicaoRecolha);
    if (dist < RAIO_COLETA) {
      this.pertoDasPartes = true;
      avisoAcao.innerText = "PRESSIONE [E] PARA RECOLHER";
      avisoAcao.style.display = "block";
      avisoAcao.style.opacity =
        Math.floor(Date.now() / 350) % 2 === 0 ? "1" : "0.3";
    } else {
      if (this.pertoDasPartes) avisoAcao.style.display = "none";
      this.pertoDasPartes = false;
    }
  }

  recolherPartes() {
    scene.remove(this.partesCima);
    scene.remove(this.partesBaixo);
    descartarObjeto3D(this.partesCima);
    descartarObjeto3D(this.partesBaixo);
    avisoAcao.style.display = "none";

    this.faseMorte = "concluido";
    this.vivo = false; // só agora — loop.js para de chamar atualizarIA nele

    // Mini Uzi: coletada narrativamente aqui, mas o item/arma em si ainda
    // não foi desenvolvido (fica pra outra hora, com mais detalhes)

    estadoJogo.introducaoAtiva = true; // reusa a mesma pausa geral da tela inicial
    controles.unlock();
    telaCapitulo2.style.display = "flex";
  }

  atualizarIA() {
    if (!this.vivo) return;

    if (this.faseMorte === "quebrando") {
      this.atualizarQuebra();
      return;
    }
    if (this.faseMorte === "aguardando_coleta") {
      if (estadoJogo.introducaoAtiva || estadoJogo.lendoBilhete) return;
      this.atualizarColeta();
      return;
    }

    if (
      estadoJogo.introducaoAtiva ||
      estadoJogo.saúdePlayer <= 0 ||
      !estadoJogo.jogoIniciado ||
      estadoJogo.lendoBilhete
    )
      return;

    const agora = Date.now();
    const mult = MULTIPLICADORES_FURIA[this.faseFuria];

    // Atualiza qualquer pedra em voo, não importa em que estado de
    // ataque ele esteja agora (ele pode já ter partido pra outro ataque
    // enquanto a pedra ainda tá caindo)
    for (let i = this.escombrosAtivos.length - 1; i >= 0; i--) {
      const pedra = this.escombrosAtivos[i];
      pedra.atualizar();

      const acertouPlayer =
        pedra.mesh.position.distanceTo(camera.position) < RAIO_ACERTO_ARREMESSO;
      const bateuNoChao = pedra.mesh.position.y <= RAIO_PEDRA;
      const expirou = pedra.tempoDeVida > 240; // ~4s de segurança, caso a matemática falhe

      if (acertouPlayer) {
        executarSom("pedra-no-chao");
        estadoJogo.saúdePlayer = Math.max(
          0,
          estadoJogo.saúdePlayer - DANO_ARREMESSO,
        );
        updateHUD();
        verificarMortePlayer();
        scene.remove(pedra.mesh);
        descartarObjeto3D(pedra.mesh);
        this.escombrosAtivos.splice(i, 1);
      } else if (bateuNoChao || expirou) {
        executarSom("pedra-no-chao");
        scene.remove(pedra.mesh);
        descartarObjeto3D(pedra.mesh);
        this.escombrosAtivos.splice(i, 1);
      }
    }

    // Sempre encara o player, exceto durante o dash (a direção já foi
    // travada no início da investida — é o que permite desviar dela)
    if (this.estadoAtaque !== "investindo") {
      this.encararPlayer();
    }

    if (this.estadoAtaque === "recuperando") {
      if (agora >= this.fimRecuperacao) this.estadoAtaque = "perseguindo";
      return;
    }

    if (this.estadoAtaque === "preparando_investida") {
      if (agora >= this.fimPreparacao) {
        const dir = new THREE.Vector3().subVectors(
          camera.position,
          this.mesh.position,
        );
        dir.y = 0;
        dir.normalize();
        this.direcaoInvestida.copy(dir);
        this.matTanquinho.emissive.setHex(0x000000); // para de piscar assim que dispara
        this.estadoAtaque = "investindo";
        this.inicioInvestida = agora;
      }
      return;
    }

    if (this.estadoAtaque === "preparando_pisao") {
      if (agora >= this.fimPreparacaoPisao) {
        this.executarPisao(agora);
      }
      return;
    }

    if (this.estadoAtaque === "preparando_arremesso") {
      if (agora >= this.fimPreparacaoArremesso) {
        this.executarArremesso(agora);
      }
      return;
    }

    if (this.estadoAtaque === "investindo") {
      this.moverNaDirecao(
        this.direcaoInvestida.x,
        this.direcaoInvestida.z,
        VELOCIDADE_INVESTIDA * mult.velocidade,
      );
      this.tocarPassoSeNaHora(agora, INTERVALO_PASSO_INVESTIDA);

      const distAgora = this.mesh.position.distanceTo(camera.position);
      if (distAgora < ALCANCE_SOCO) {
        executarSom("capote");
        estadoJogo.saúdePlayer = Math.max(
          0,
          estadoJogo.saúdePlayer - DANO_INVESTIDA,
        );
        updateHUD();

        const empurrao = this.direcaoInvestida
          .clone()
          .multiplyScalar(FORCA_EMPURRAO);
        const novoX = camera.position.x + empurrao.x;
        const novoZ = camera.position.z + empurrao.z;
        if (checarPosicaoValida(novoX, camera.position.z))
          camera.position.x = novoX;
        if (checarPosicaoValida(camera.position.x, novoZ))
          camera.position.z = novoZ;

        verificarMortePlayer();
        this.terminarInvestida(agora);
        return;
      }

      if (agora - this.inicioInvestida > DURACAO_MAX_INVESTIDA) {
        this.terminarInvestida(agora);
      }
      return;
    }

    // ESTADO PADRÃO: perseguindo
    const dist = this.mesh.position.distanceTo(camera.position);

    // Pisão tem prioridade sobre o soco quando os dois alcances se
    // sobrepõem — é o ataque "especial", mais espaçado e chamativo
    if (
      dist <= ALCANCE_PISAO &&
      agora - this.ultimoPisao >= COOLDOWN_PISAO * mult.cooldown
    ) {
      this.iniciarPisao(agora);
      return;
    }

    if (dist <= ALCANCE_SOCO) {
      if (agora - this.ultimoSoco >= COOLDOWN_SOCO * mult.cooldown) {
        this.ultimoSoco = agora;
        executarSom("soco");
        estadoJogo.saúdePlayer = Math.max(
          0,
          estadoJogo.saúdePlayer - DANO_SOCO,
        );
        updateHUD();
        verificarMortePlayer();
      }
      return;
    }

    // Arremesso: sempre acontece além do alcance da investida (senão
    // ele ficaria sem nada pra fazer com o player bem longe); dentro do
    // alcance dela, só às vezes, pra variar entre os dois
    if (
      dist > ALCANCE_ARREMESSO_MIN &&
      agora - this.ultimoArremesso >= COOLDOWN_ARREMESSO * mult.cooldown
    ) {
      if (
        dist >= ALCANCE_INVESTIDA_MAX ||
        Math.random() < CHANCE_ARREMESSO_NO_ALCANCE_INVESTIDA
      ) {
        this.iniciarArremesso(agora);
        return;
      }
    }

    if (
      dist > ALCANCE_INVESTIDA_MIN &&
      dist < ALCANCE_INVESTIDA_MAX &&
      agora - this.ultimaInvestida >= COOLDOWN_INVESTIDA * mult.cooldown
    ) {
      this.iniciarInvestida(agora);
      return;
    }

    const dir = new THREE.Vector3().subVectors(
      camera.position,
      this.mesh.position,
    );
    dir.y = 0;
    dir.normalize();
    this.moverNaDirecao(dir.x, dir.z, VELOCIDADE_PERSEGUICAO * mult.velocidade);
    this.tocarPassoSeNaHora(agora, INTERVALO_PASSO_ANDANDO);
  }
}

export let boss = null;

export function spawnarBoss() {
  if (boss) return;
  boss = new Boss();
  executarSom("intro");
  if (somAmbiente.isPlaying) somAmbiente.stop();
  if (musicaBoss.buffer && !musicaBoss.isPlaying) musicaBoss.play();
}

// Tecla E pra recolher as peças do robô, quando estiverem prontas e o
// player estiver perto o suficiente
window.addEventListener("keydown", (e) => {
  if (
    e.key.toLowerCase() === "e" &&
    boss &&
    boss.faseMorte === "aguardando_coleta" &&
    boss.pertoDasPartes
  ) {
    boss.recolherPartes();
  }
});
