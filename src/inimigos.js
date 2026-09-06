import * as THREE from "three";
import { scene, camera } from "./scene.js";
import {
  estadoJogo,
  alvosInimigos,
  listaMeshesParedes,
  MAX_INIMIGOS,
} from "./estado.js";
import { checarPosicaoValida } from "./mapa.js";
import { containerHPs, updateHUD, verificarMortePlayer } from "./ui.js";
import { executarSom } from "./audio.js";
import { GranadaProjetil, criarTracerBot } from "./projeteis.js";
import { spawnarCaixaLoot } from "./caixas.js";
import { descartarObjeto3D } from "./utils.js";

// ==========================================
// GERADORES DE TEXTURAS DOS MAFIOSOS
// ==========================================

// Rosto bravo de mafioso
function criarTexturaRostoMafiosoBravo() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Fundo da pele
  ctx.fillStyle = "#d2996c";
  ctx.fillRect(0, 0, 128, 128);

  // Sobrancelhas bravas (inclinadas para o centro)
  ctx.fillStyle = "#1c130b";
  ctx.beginPath();
  ctx.moveTo(20, 42);
  ctx.lineTo(55, 58);
  ctx.lineTo(20, 50);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(108, 42);
  ctx.lineTo(73, 58);
  ctx.lineTo(108, 50);
  ctx.fill();

  // Olhos bravos/focados
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(28, 56, 22, 12);
  ctx.fillRect(78, 56, 22, 12);

  ctx.fillStyle = "#000000";
  ctx.fillRect(36, 58, 10, 10);
  ctx.fillRect(82, 58, 10, 10);

  // Nariz
  ctx.fillStyle = "#b3784f";
  ctx.fillRect(60, 68, 8, 16);

  // Boca brava/furiosa
  ctx.strokeStyle = "#2d1405";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(38, 102);
  ctx.lineTo(64, 92);
  ctx.lineTo(90, 102);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

export const texturaRostoMafiosoGlobal = criarTexturaRostoMafiosoBravo();

// Textura de tatuagem no braço (fundo colorido + texto em azul escuro).
// Usada pro braço direito de todo mundo ('LA' = Licença Azul) e reaproveitada
// pelo braço esquerdo do boss ('A-P' = Auto-Patente).
export function criarTexturaBracoTatuagem(corFundoHex, texto = "LA") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Fundo da roupa/colete do braço
  ctx.fillStyle = corFundoHex;
  ctx.fillRect(0, 0, 128, 128);

  // Símbolo em Azul Escuro
  ctx.fillStyle = "#001a80";
  ctx.font = 'bold 44px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, 64, 64);

  ctx.strokeStyle = "#000040";
  ctx.lineWidth = 3;
  ctx.strokeText(texto, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

// ==========================================
// INIMIGOS HUMANOIDES COM IA E ANATOMIA CORRIGIDA
// ==========================================

function adicionarArmaAoBot(bracoDir, tipo) {
  const grupoArmaBot = new THREE.Group();

  if (tipo === "Faca") {
    const cabo = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.025, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
    );
    const lamina = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.035, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xcccccc }),
    );
    lamina.position.set(0, 0.005, -0.15);
    grupoArmaBot.add(cabo, lamina);
  } else if (tipo === "Pistola") {
    const cano = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.04, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
    );
    const cabo = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.1, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    cabo.position.set(0, -0.06, 0.02);
    cabo.rotation.x = 0.25;
    grupoArmaBot.add(cano, cabo);
  } else if (tipo === "Rifle") {
    const corpo = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.05, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
    );
    const cano = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
    );
    cano.rotation.x = Math.PI / 2;
    cano.position.set(0, 0, -0.3);
    grupoArmaBot.add(corpo, cano);
  } else if (tipo === "Escopeta") {
    const corpo = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    const cano1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x444444 }),
    );
    cano1.rotation.x = Math.PI / 2;
    cano1.position.set(-0.01, 0, -0.25);
    const cano2 = cano1.clone();
    cano2.position.set(0.01, 0, -0.25);
    grupoArmaBot.add(corpo, cano1, cano2);
  } else if (tipo === "Sniper") {
    const corpo = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.05, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    const cano = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
    );
    cano.rotation.x = Math.PI / 2;
    cano.position.set(0, 0, -0.35);
    grupoArmaBot.add(corpo, cano);
  }

  // CORREÇÃO DA ORIENTAÇÃO DA ARMA NA MÃO DO BOT:
  // Posiciona a arma estendida para a frente da mão (orientação local -Z do corpo)
  grupoArmaBot.position.set(0, -0.2, -0.15);
  bracoDir.add(grupoArmaBot);
}

export class Inimigo {
  constructor(x, z) {
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);
    this.saúde = 100;
    this.alerta = false;
    this.ultimoAtaque = Date.now() + Math.random() * 1000;
    this.jogouGranada = false;

    const sorteio = Math.random() * 110;
    if (sorteio < 22) this.tipo = "Faca";
    else if (sorteio < 50) this.tipo = "Pistola";
    else if (sorteio < 78) this.tipo = "Rifle";
    else if (sorteio < 95) this.tipo = "Escopeta";
    else {
      this.tipo = "Sniper";
    }

    let corColeteHex = "#1f2e1f";
    let corColeteVal = 0x1f2e1f;
    let corCalca = 0x2e3b2e;

    if (this.tipo === "Faca") {
      corColeteHex = "#8b0000";
      corColeteVal = 0x8b0000;
    } else if (this.tipo === "Sniper") {
      corColeteHex = "#111111";
      corColeteVal = 0x111111;
      corCalca = 0x111111;
    }

    // Sorteio de cor de cabelo curto (Preto, Castanho, Loiro, Ruivo)
    const opcoesCabelo = [0x111111, 0x3d2314, 0xd4af37, 0x9e2a2b];
    const corCabelo =
      opcoesCabelo[Math.floor(Math.random() * opcoesCabelo.length)];

    const matPele = new THREE.MeshStandardMaterial({
      color: 0xd2996c,
      roughness: 0.8,
    });
    const matRosto = new THREE.MeshStandardMaterial({
      map: texturaRostoMafiosoGlobal,
      roughness: 0.8,
    });
    const matCabelo = new THREE.MeshStandardMaterial({
      color: corCabelo,
      roughness: 0.9,
    });
    const matColete = new THREE.MeshStandardMaterial({
      color: corColeteVal,
      roughness: 0.5,
    });
    const matCalca = new THREE.MeshStandardMaterial({
      color: corCalca,
      roughness: 0.9,
    });
    const matBracoEsq = new THREE.MeshStandardMaterial({
      color: corColeteVal,
      roughness: 0.5,
    });

    // Braço direito com símbolo 'LA'
    const matBracoDir = new THREE.MeshStandardMaterial({
      map: criarTexturaBracoTatuagem(corColeteHex),
      roughness: 0.5,
    });
    const matBota = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
    });

    // Cabeça com materiais múltiplos (frente = rosto bravo)
    const materiasCabeca = [
      matPele, // direita
      matPele, // esquerda
      matPele, // topo
      matPele, // base
      matPele, // tras
      matRosto, // frente (-Z)
    ];

    const cabeca = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.35),
      materiasCabeca,
    );
    cabeca.position.set(0, 1.7, 0);
    cabeca.name = "cabeca";
    cabeca.castShadow = true;

    // Cabelo curto no topo e laterais
    // (nome 'cabeca' propositalmente igual ao da caixa da cabeça: sem isso,
    // um tiro que acerta o cabelo não contava como headshot)
    const cabeloTopo = new THREE.Mesh(
      new THREE.BoxGeometry(0.37, 0.08, 0.37),
      matCabelo,
    );
    cabeloTopo.position.set(0, 0.18, 0);
    cabeloTopo.name = "cabeca";
    cabeca.add(cabeloTopo);

    const cabeloTras = new THREE.Mesh(
      new THREE.BoxGeometry(0.37, 0.22, 0.06),
      matCabelo,
    );
    cabeloTras.position.set(0, 0.05, 0.16);
    cabeloTras.name = "cabeca";
    cabeca.add(cabeloTras);

    // Tronco e membros
    const tronco = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.3),
      matColete,
    );
    tronco.position.set(0, 1.2, 0);
    tronco.castShadow = true;

    const bracoEsq = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.6, 0.18),
      matBracoEsq,
    );
    bracoEsq.position.set(-0.36, 1.2, 0);
    bracoEsq.castShadow = true;

    const bracoDir = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.6, 0.18),
      matBracoDir,
    );
    bracoDir.position.set(0.36, 1.2, 0);
    bracoDir.castShadow = true;

    // Aponta o braço direito para a frente para segurar a arma.
    // O sinal aqui importa: como o "rosto" da cabeça e as botas usam -Z
    // como frente, rotation.x precisa ser POSITIVO pra balançar o braço
    // (e a arma presa nele) em direção a -Z. Com sinal negativo (como
    // estava antes), o braço/arma ficava apontando para TRÁS do inimigo,
    // o que é o principal motivo dele parecer "andar de costas" ao correr.
    bracoDir.rotation.x = Math.PI / 4;

    adicionarArmaAoBot(bracoDir, this.tipo);

    const pernaEsq = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.7, 0.22),
      matCalca,
    );
    pernaEsq.position.set(-0.15, 0.55, 0);
    pernaEsq.castShadow = true;

    const pernaDir = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.7, 0.22),
      matCalca,
    );
    pernaDir.position.set(0.15, 0.55, 0);
    pernaDir.castShadow = true;

    // Botas apontando para a frente (-Z)
    const botaEsq = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.2, 0.28),
      matBota,
    );
    botaEsq.position.set(-0.15, 0.1, -0.03);

    const botaDir = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.2, 0.28),
      matBota,
    );
    botaDir.position.set(0.15, 0.1, -0.03);

    this.mesh.add(
      cabeca,
      tronco,
      bracoEsq,
      bracoDir,
      pernaEsq,
      pernaDir,
      botaEsq,
      botaDir,
    );

    this.mesh.traverse((membro) => {
      if (membro instanceof THREE.Mesh) {
        membro.userData = { tipo: "inimigo", objeto: this, parte: membro.name };
      }
    });

    scene.add(this.mesh);
    alvosInimigos.push(this);

    this.hpDiv = document.createElement("div");
    this.hpDiv.style.position = "absolute";
    this.hpDiv.style.color = "#ff3333";
    this.hpDiv.style.fontFamily = "monospace";
    this.hpDiv.style.fontSize = "16px";
    this.hpDiv.style.fontWeight = "bold";
    this.hpDiv.style.textShadow = "1.5px 1.5px #000000";
    this.hpDiv.style.willChange = "transform";
    this.hpDiv.innerText = `HP: ${this.saúde} [${this.tipo.toUpperCase()}]`;
    containerHPs.appendChild(this.hpDiv);
  }

  takeDamage(amount, isHeadshot = false) {
    this.alerta = true;
    const danoFinal = isHeadshot ? amount * 2 : amount;
    this.saúde -= danoFinal;

    if (this.saúde <= 0) {
      scene.remove(this.mesh);
      // descartarTexturas: false -> a textura do rosto (texturaRostoMafiosoGlobal)
      // é COMPARTILHADA por todos os inimigos, então não pode ser destruída
      // quando só um deles morre (quebraria o rosto dos outros/próximos bots)
      descartarObjeto3D(this.mesh, { descartarTexturas: false });
      if (this.hpDiv && this.hpDiv.parentNode)
        containerHPs.removeChild(this.hpDiv);

      const index = alvosInimigos.indexOf(this);
      if (index > -1) alvosInimigos.splice(index, 1);

      estadoJogo.kills++;
      updateHUD();

      if (estadoJogo.kills % 3 === 0) spawnarCaixaLoot("vida");
      if (estadoJogo.kills % 10 === 0) spawnarCaixaLoot("munição");

      // REGRA DE SPAWN:
      // A partir de 17 kills, NÃO nascem mais novos inimigos.
      // Os 3 inimigos existentes vão morrendo (17 -> 3, 18 -> 2, 19 -> 1, 20 -> 0).
      if (
        (estadoJogo.kills < 17 || estadoJogo.bossDerrotado) &&
        alvosInimigos.length < MAX_INIMIGOS
      ) {
        spawnarInimigoAleatorio();
      }
    } else {
      this.hpDiv.innerText = isHeadshot
        ? `HP: ${this.saúde} (HS!)`
        : `HP: ${this.saúde} [${this.tipo.toUpperCase()}]`;
    }
  }

  moverBot(dirX, dirZ, vel) {
    const nextX = this.mesh.position.x + dirX * vel;
    const nextZ = this.mesh.position.z + dirZ * vel;

    if (checarPosicaoValida(nextX, this.mesh.position.z, 0.5)) {
      this.mesh.position.x = nextX;
    }
    if (checarPosicaoValida(this.mesh.position.x, nextZ, 0.5)) {
      this.mesh.position.z = nextZ;
    }
  }

  temLinhaDeVisaoLimpa() {
    const orig = this.mesh.position.clone();
    orig.y += 1.4;
    const dest = camera.position.clone();
    const dir = dest.clone().sub(orig).normalize();

    const raycasterObstaculo = new THREE.Raycaster(
      orig,
      dir,
      0,
      orig.distanceTo(dest),
    );
    const hits = raycasterObstaculo.intersectObjects(listaMeshesParedes, false);
    return hits.length === 0;
  }

  botAtirarNoPlayer() {
    const agora = Date.now();
    let firerate = 600;
    let dano = 10;
    let headshotChance = 0.05;
    let corTracer = 0xaaaaaa;
    let som = "pistola";
    let chanceDeAcerto = 0.7;

    if (this.tipo === "Faca") {
      if (this.mesh.position.distanceTo(camera.position) < 2.5) {
        if (agora - this.ultimoAtaque > 500) {
          this.ultimoAtaque = agora;
          executarSom("faca");
          estadoJogo.saúdePlayer = Math.max(0, estadoJogo.saúdePlayer - 35);
          updateHUD();
          verificarMortePlayer();
        }
      }
      return;
    } else if (this.tipo === "Pistola") {
      firerate = 700;
      dano = 8;
      headshotChance = 0.05;
      corTracer = 0xaaaaaa;
      som = "pistola";
    } else if (this.tipo === "Rifle") {
      firerate = 300;
      dano = 6;
      headshotChance = 0;
      corTracer = 0xff8c00;
      som = "rifle";
    } else if (this.tipo === "Escopeta") {
      firerate = 1000;
      headshotChance = 0.05;
      corTracer = 0x87cefa;
      som = "escopeta";
    } else if (this.tipo === "Sniper") {
      firerate = 2500;
      dano = 35;
      headshotChance = 0.1;
      corTracer = 0xff0000;
      som = "sniper";
      chanceDeAcerto = 1.0; // a Sniper não entra no nerf de precisão — continua sempre certeira
    }

    if (agora - this.ultimoAtaque < firerate) return;
    if (!this.temLinhaDeVisaoLimpa()) return;

    this.ultimoAtaque = agora;
    executarSom(som);

    const orig = this.mesh.position.clone();
    orig.y += 1.4;

    if (this.tipo === "Escopeta") {
      // Escopeta de verdade é braba perto e fraca longe. Antes o
      // espalhamento e a chance de acerto eram fixos (mesma força a
      // qualquer distância) — agora os dois escalam linearmente entre
      // distMin (ponto ideal, ainda melhor que antes) e distMax (bem
      // longe, quase não acerta nada).
      const distAtual = this.mesh.position.distanceTo(camera.position);
      const distMin = 5.0;
      const distMax = 30.0;
      const fator = Math.min(
        1,
        Math.max(0, (distAtual - distMin) / (distMax - distMin)),
      );

      const espalhamentoAtual = 0.5 + fator * (3.0 - 0.5);
      const chanceAtual = 0.85 - fator * (0.85 - 0.3);

      let pelotasAcertaram = 0;
      for (let i = 0; i < 5; i++) {
        const dest = camera.position.clone();
        dest.x += (Math.random() - 0.5) * espalhamentoAtual;
        dest.y += (Math.random() - 0.5) * espalhamentoAtual;
        dest.z += (Math.random() - 0.5) * espalhamentoAtual;

        if (Math.random() < chanceAtual) pelotasAcertaram++;
        criarTracerBot(orig, dest, corTracer);
      }
      if (pelotasAcertaram > 0) {
        estadoJogo.saúdePlayer = Math.max(
          0,
          estadoJogo.saúdePlayer - pelotasAcertaram * 5,
        );
        updateHUD();
        verificarMortePlayer();
      }
    } else {
      // NERF DE PRECISÃO: antes o tiro sempre acertava (o "0.4" abaixo só
      // desviava a LINHA do tracer, sem afetar o dano). Agora tem uma
      // chance real de errar, igual a escopeta já tinha — e quando erra,
      // o tracer se afasta bem mais do alvo (espalhamento maior),
      // deixando visualmente claro que foi um erro. A Sniper fica de fora
      // desse nerf (chanceDeAcerto = 1.0, definido lá em cima).
      const acertou = Math.random() < chanceDeAcerto;
      const espalhamento = acertou ? 0.4 : 1.6;

      const dest = camera.position.clone();
      dest.x += (Math.random() - 0.5) * espalhamento;
      dest.y += (Math.random() - 0.5) * espalhamento;
      dest.z += (Math.random() - 0.5) * espalhamento;

      if (acertou) {
        const isHS = Math.random() < headshotChance;
        const danoFinal = isHS ? dano * 2 : dano;
        estadoJogo.saúdePlayer = Math.max(
          0,
          estadoJogo.saúdePlayer - danoFinal,
        );
        updateHUD();
        verificarMortePlayer();
      }

      criarTracerBot(orig, dest, corTracer);
    }
  }

  atualizarIA() {
    if (
      estadoJogo.introducaoAtiva ||
      estadoJogo.saúdePlayer <= 0 ||
      !estadoJogo.jogoIniciado ||
      estadoJogo.lendoBilhete
    )
      return;

    const dist = this.mesh.position.distanceTo(camera.position);

    if (!this.alerta) {
      if (this.tipo === "Sniper" && dist <= 65.0) {
        this.alerta = true;
      } else if (this.tipo !== "Sniper" && dist <= 50.0) {
        this.alerta = true;
      }
    }

    if (!this.alerta) return;

    if (this.tipo === "Sniper" && dist > 65.0) {
      return;
    }

    if (!this.jogouGranada) {
      this.jogouGranada = true;
      if (Math.random() < 0.15 && this.temLinhaDeVisaoLimpa()) {
        const orig = this.mesh.position.clone();
        orig.y += 1.5;
        const dir = camera.position.clone().sub(orig).normalize();
        new GranadaProjetil(orig, dir);
      }
    }

    // Faz o bot olhar para o jogador
    const posAlvo = camera.position.clone();
    posAlvo.y = this.mesh.position.y;

    // Corrige rotação do modelo do bot
    //
    // PEGADINHA CLÁSSICA DO THREE.JS: lookAt() em uma Camera/Light aponta o eixo
    // -Z dela pro alvo (por isso funciona "normal" numa câmera). Só que em um
    // Object3D/Group comum (como this.mesh aqui), o Three.js internamente inverte
    // os argumentos do cálculo, e o resultado é o eixo +Z apontando pro alvo, não
    // o -Z. Como a "frente" do nosso modelo (rosto, botas, braço) foi toda
    // construída em -Z, o lookAt puro deixava o bot de costas pro player. O
    // rotateY(Math.PI) abaixo desfaz essa inversão.
    this.mesh.lookAt(posAlvo);
    this.mesh.rotateY(Math.PI);

    const dir = new THREE.Vector3()
      .subVectors(posAlvo, this.mesh.position)
      .normalize();

    if (this.tipo === "Faca") {
      // VELOCIDADE DA FACA AUMENTADA PARA CORREREM MAIS RÁPIDO
      this.moverBot(dir.x, dir.z, 0.22);
      this.botAtirarNoPlayer();
    } else if (this.tipo === "Pistola") {
      if (dist > 10.0) this.moverBot(dir.x, dir.z, 0.06);
      this.botAtirarNoPlayer();
    } else if (this.tipo === "Rifle") {
      if (dist > 12.0) this.moverBot(dir.x, dir.z, 0.05);
      this.botAtirarNoPlayer();
    } else if (this.tipo === "Escopeta") {
      if (dist > 5.0) this.moverBot(dir.x, dir.z, 0.08);
      this.botAtirarNoPlayer();
    } else if (this.tipo === "Sniper") {
      if (dist < 25.0) {
        this.moverBot(-dir.x, -dir.z, 0.06);
      }
      this.botAtirarNoPlayer();
    }
  }
}

export function spawnarInimigoAleatorio() {
  if (
    alvosInimigos.length >= MAX_INIMIGOS ||
    (estadoJogo.kills >= 17 && !estadoJogo.bossDerrotado)
  )
    return;
  let x, z;
  do {
    x = (Math.random() - 0.5) * 160;
    z = (Math.random() - 0.5) * 160;
  } while (
    camera.position.distanceTo(new THREE.Vector3(x, camera.position.y, z)) <
      35.0 ||
    !checarPosicaoValida(x, z, 2.0)
  );
  new Inimigo(x, z);
}
