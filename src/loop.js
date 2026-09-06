import * as THREE from "three";
import { scene, camera, renderer } from "./scene.js";
import { controles } from "./controles.js";
import {
  estadoJogo,
  estadoArmas,
  alvosInimigos,
  listaCaixas,
  granadasEmVoo,
  inventario,
} from "./estado.js";
import { avisoAcao, avisoMira, avisoCaixa } from "./ui.js";
import { objPapel } from "./bilhete3d.js";
import { grupoFaca } from "./armas-visuais.js";
import { teclas, velocidadeCaminhar, velocidadeCorrer } from "./input.js";
import { tentarAtirar } from "./disparos.js";
import { checarPosicaoValida } from "./mapa.js";
import { boss } from "./boss.js";

// ==========================================
// LOOP DE EXECUÇÃO E ANIMAÇÃO PRINCIPAL
// ==========================================
const posProjetada = new THREE.Vector3();

let velocidadeY = 0;
const gravidade = 0.008;
let noChao = true;

function animar() {
  requestAnimationFrame(animar);

  // REVELA O BILHETE (GATILHO DO PRÉ-BOSS) SÓ DEPOIS DE 20 KILLS
  if (!objPapel.visible && estadoJogo.kills >= 20) {
    objPapel.visible = true;
  }

  // VERIFICAÇÃO DA DISTÂNCIA AO BILHETE PARA MOSTRAR AVISO
  if (
    !estadoJogo.introducaoAtiva &&
    estadoJogo.saúdePlayer > 0 &&
    !estadoJogo.lendoBilhete &&
    objPapel.visible
  ) {
    const distBilhete = camera.position.distanceTo(objPapel.position);
    if (distBilhete < 3.5) {
      avisoAcao.innerText = "PRESSIONE [E] PARA LER O BILHETE";
      avisoAcao.style.display = "block";
      avisoAcao.style.opacity =
        Math.floor(Date.now() / 350) % 2 === 0 ? "1" : "0.3";
    } else {
      avisoAcao.style.display = "none";
    }
  } else if (estadoJogo.lendoBilhete) {
    avisoAcao.style.display = "none";
  }

  if (
    controles.isLocked &&
    !estadoJogo.introducaoAtiva &&
    !estadoJogo.lendoBilhete
  ) {
    if (estadoArmas.mousePressionado) tentarAtirar();

    // Animação de ataque com a faca do jogador
    if (estadoArmas.facatAtacando) {
      const decorrido = Date.now() - estadoArmas.facaAnimaTime;
      const duracao = 200;
      if (decorrido < duracao) {
        const progresso = decorrido / duracao;
        grupoFaca.rotation.y = Math.sin(progresso * Math.PI) * 2.0;
        grupoFaca.rotation.z = Math.sin(progresso * Math.PI) * 0.5;
        grupoFaca.position.x = Math.sin(progresso * Math.PI) * 0.15;
      } else {
        estadoArmas.facatAtacando = false;
        grupoFaca.rotation.set(0, 0, 0);
        grupoFaca.position.set(0, 0, 0);
      }
    }

    // Atualização de projéteis em voo
    for (let i = granadasEmVoo.length - 1; i >= 0; i--) {
      granadasEmVoo[i].atualizar();
    }

    // IA e posições das tags dos inimigos
    alvosInimigos.forEach((inimigo) => {
      inimigo.atualizarIA();

      posProjetada.copy(inimigo.mesh.position).y += 2.1;
      posProjetada.project(camera);
      if (posProjetada.z > 1) {
        inimigo.hpDiv.style.display = "none";
      } else {
        inimigo.hpDiv.style.display = "block";
        const xPos = (posProjetada.x * 0.5 + 0.5) * window.innerWidth;
        const yPos = (posProjetada.y * -0.5 + 0.5) * window.innerHeight;
        inimigo.hpDiv.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) translate(-50%, -50%)`;
        inimigo.hpDiv.style.left = "0px";
        inimigo.hpDiv.style.top = "0px";
      }
    });

    // IA e posição na tela da tag de vida do boss
    if (boss && boss.vivo) {
      boss.atualizarIA();

      if (boss.exibirTagVida) {
        posProjetada.copy(boss.mesh.position).y += 3.4;
        posProjetada.project(camera);
        if (posProjetada.z > 1) {
          boss.hpDiv.style.display = "none";
        } else {
          boss.hpDiv.style.display = "block";
          const xPos = (posProjetada.x * 0.5 + 0.5) * window.innerWidth;
          const yPos = (posProjetada.y * -0.5 + 0.5) * window.innerHeight;
          boss.hpDiv.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) translate(-50%, -50%)`;
          boss.hpDiv.style.left = "0px";
          boss.hpDiv.style.top = "0px";
        }
      }
    }

    // Avisos na tela
    avisoMira.style.display =
      inventario[estadoArmas.armaAtualIndex].nome === "Sniper" &&
      !estadoArmas.sniperScoped
        ? "block"
        : "none";
    if (avisoMira.style.display === "block")
      avisoMira.style.opacity =
        Math.floor(Date.now() / 350) % 2 === 0 ? "1" : "0";

    let proximoDeCaixa = listaCaixas.some(
      (c) => camera.position.distanceTo(c.mesh.position) < 3.0,
    );
    avisoCaixa.style.display = proximoDeCaixa ? "block" : "none";
    if (avisoCaixa.style.display === "block")
      avisoCaixa.style.opacity =
        Math.floor(Date.now() / 350) % 2 === 0 ? "1" : "0";

    // Movimentação do jogador
    const velAtual = teclas.shift ? velocidadeCorrer : velocidadeCaminhar;

    const oldX = camera.position.x;
    const oldZ = camera.position.z;

    if (teclas.w) controles.moveForward(velAtual);
    if (teclas.s) controles.moveForward(-velAtual);
    if (teclas.d) controles.moveRight(velAtual);
    if (teclas.a) controles.moveRight(-velAtual);

    if (!checarPosicaoValida(camera.position.x, camera.position.z)) {
      camera.position.x = oldX;
      camera.position.z = oldZ;
    }

    if (teclas.space && noChao) {
      velocidadeY = 0.16;
      noChao = false;
    }
    if (!noChao) {
      camera.position.y += velocidadeY;
      velocidadeY -= gravidade;
      if (camera.position.y <= 1.6) {
        camera.position.y = 1.6;
        velocidadeY = 0;
        noChao = true;
      }
    }
  }

  renderer.render(scene, camera);
}
animar();
