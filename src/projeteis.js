import * as THREE from "three";
import { scene, camera } from "./scene.js";
import { estadoJogo, alvosInimigos, granadasEmVoo } from "./estado.js";
import { checarPosicaoValida } from "./mapa.js";
import { executarSom } from "./audio.js";
import { updateHUD, verificarMortePlayer } from "./ui.js";
import { descartarObjeto3D } from "./utils.js";
import { boss } from "./boss.js";

const textureLoader = new THREE.TextureLoader();

// Textura da explosão carregada UMA ÚNICA VEZ e reusada em toda granada.
// Antes cada explosão recarregava 'raio.png' do zero (nova requisição +
// decode de imagem a cada granada), e o plano ficava sem dispose depois
// do fadeout — os dois juntos formavam um vazamento constante.
const texturaExplosao = textureLoader.load("raio.png");

// ==========================================
// PROJÉTEIS (GRANADAS E TRACERS)
// ==========================================
export class GranadaProjetil {
  constructor(posInicial, direcao) {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
    );
    this.mesh.position.copy(posInicial);
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this.velocidade = direcao.clone().multiplyScalar(0.5);
    this.velocidade.y += 0.15;
    granadasEmVoo.push(this);
  }

  atualizar() {
    const nextX = this.mesh.position.x + this.velocidade.x;
    const nextZ = this.mesh.position.z + this.velocidade.z;

    if (
      !checarPosicaoValida(
        nextX,
        this.mesh.position.z,
        0.3,
        this.mesh.position.y,
      )
    ) {
      this.velocidade.x *= -0.6;
    } else {
      this.mesh.position.x = nextX;
    }

    if (
      !checarPosicaoValida(
        this.mesh.position.x,
        nextZ,
        0.3,
        this.mesh.position.y,
      )
    ) {
      this.velocidade.z *= -0.6;
    } else {
      this.mesh.position.z = nextZ;
    }

    this.mesh.position.y += this.velocidade.y;
    this.velocidade.y -= 0.007;

    if (this.mesh.position.y <= 0.12) {
      this.mesh.position.y = 0.12;
      this.explodir();
    }
  }

  explodir() {
    const geoExplo = new THREE.PlaneGeometry(14, 14);
    const matExplo = new THREE.MeshStandardMaterial({
      map: texturaExplosao,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const planoRaio = new THREE.Mesh(geoExplo, matExplo);
    planoRaio.rotation.x = -Math.PI / 2;
    planoRaio.position.copy(this.mesh.position);
    planoRaio.position.y = 0.03;
    scene.add(planoRaio);

    executarSom("explosao");

    alvosInimigos.forEach((inimigo) => {
      if (this.mesh.position.distanceTo(inimigo.mesh.position) <= 14.0) {
        inimigo.takeDamage(120);
      }
    });

    if (
      boss &&
      boss.podeSerAlvo &&
      this.mesh.position.distanceTo(boss.mesh.position) <= 14.0
    ) {
      boss.takeDamage(120);
    }

    if (this.mesh.position.distanceTo(camera.position) <= 10.0) {
      estadoJogo.saúdePlayer = Math.max(0, estadoJogo.saúdePlayer - 60);
      updateHUD();
      verificarMortePlayer();
    }

    scene.remove(this.mesh);
    descartarObjeto3D(this.mesh);

    let escalaFadout = 0.3;
    const loopEfeito = setInterval(() => {
      escalaFadout += 0.38;
      planoRaio.scale.set(escalaFadout, escalaFadout, 1);
      matExplo.opacity -= 0.09;
      if (matExplo.opacity <= 0) {
        clearInterval(loopEfeito);
        scene.remove(planoRaio);
        // descartarTexturas: false -> a textura é COMPARTILHADA entre
        // explosões, só a geometria/material desse plano são únicos
        descartarObjeto3D(planoRaio, { descartarTexturas: false });
      }
    }, 25);

    const idx = granadasEmVoo.indexOf(this);
    if (idx > -1) granadasEmVoo.splice(idx, 1);
  }
}

export function criarTracerBot(origem, destino, cor) {
  if (!cor) return;
  const linha = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([origem, destino]),
    new THREE.LineBasicMaterial({ color: cor }),
  );
  scene.add(linha);
  setTimeout(() => {
    scene.remove(linha);
    descartarObjeto3D(linha);
  }, 60);
}
