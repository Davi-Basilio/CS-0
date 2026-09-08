import * as THREE from "three";
import { scene, camera } from "./scene.js";
import { controles } from "./controles.js";
import {
  estadoJogo,
  estadoArmas,
  inventario,
  alvosInimigos,
  listaCaixas,
  listaMeshesParedes,
} from "./estado.js";
import { updateHUD, escopo } from "./ui.js";
import { executarSom } from "./audio.js";
import { GranadaProjetil } from "./projeteis.js";
import { grupoArmasPlayer } from "./armas-visuais.js";
import { descartarObjeto3D } from "./utils.js";
import { boss } from "./boss.js";

const raycasterTiro = new THREE.Raycaster();

// ==========================================
// DISPAROS E TIROS DO JOGADOR
// ==========================================
window.addEventListener("mousedown", (e) => {
  if (
    !controles.isLocked ||
    estadoJogo.introducaoAtiva ||
    estadoJogo.lendoBilhete
  )
    return;
  if (e.button === 0) {
    estadoArmas.mousePressionado = true;
    tentarAtirar();
  } else if (
    e.button === 2 &&
    inventario[estadoArmas.armaAtualIndex].nome === "Sniper"
  ) {
    estadoArmas.sniperScoped = !estadoArmas.sniperScoped;
    camera.fov = estadoArmas.sniperScoped ? estadoArmas.zoomAtual : 75;
    escopo.style.display = estadoArmas.sniperScoped ? "block" : "none";
    grupoArmasPlayer.visible = !estadoArmas.sniperScoped;
    camera.updateProjectionMatrix();
  }
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 0) estadoArmas.mousePressionado = false;
});

// Troca pra arma de índice `novoIndex`, resetando escopo/fov (usado tanto
// pelo scroll quanto pelos números do teclado e pela troca automática pra
// faca quando a granada acaba).
function selecionarArma(novoIndex) {
  estadoArmas.armaAtualIndex = novoIndex;
  estadoArmas.sniperScoped = false;
  camera.fov = 75;
  escopo.style.display = "none";
  grupoArmasPlayer.visible = true;
  camera.updateProjectionMatrix();
}

export function tentarAtirar() {
  const agora = Date.now();
  const weapon = inventario[estadoArmas.armaAtualIndex];
  if (agora - estadoArmas.ultimoTiro < weapon.firerate) return;

  if (weapon.munição > 0) {
    atirar();
    estadoArmas.ultimoTiro = agora;

    if (weapon.munição !== Infinity) {
      weapon.munição--;
      if (weapon.munição === 0 && weapon.nome === "Granada") {
        estadoArmas.mousePressionado = false;
        selecionarArma(0);
      }
    }
    updateHUD();
  }
}

function obterTodosMeshesAlvo() {
  const meshes = [...listaMeshesParedes, ...listaCaixas.map((c) => c.mesh)];
  alvosInimigos.forEach((inimigo) => {
    inimigo.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
  });
  if (boss && boss.podeSerAlvo) {
    boss.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
  }
  return meshes;
}

function criarTracer(destino, cor) {
  if (!cor) return;
  const offset = new THREE.Vector3(0.25, -0.2, -0.45).applyQuaternion(
    camera.quaternion,
  );
  const origem = camera.position.clone().add(offset);
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

function atirar() {
  const weapon = inventario[estadoArmas.armaAtualIndex];
  raycasterTiro.setFromCamera(new THREE.Vector2(0, 0), camera);

  const todosAlvos = obterTodosMeshesAlvo();

  if (weapon.tipo === "faca") {
    executarSom("faca");
    estadoArmas.facatAtacando = true;
    estadoArmas.facaAnimaTime = Date.now();

    const hits = raycasterTiro.intersectObjects(todosAlvos, false);
    if (hits.length > 0 && hits[0].distance < 3.0) {
      const atingido = hits[0].object.userData;
      if (atingido && atingido.tipo === "caixa") atingido.objeto.quebrar();
      else if (
        atingido &&
        (atingido.tipo === "inimigo" || atingido.tipo === "boss")
      )
        atingido.objeto.takeDamage(weapon.dano);
    }
  } else if (weapon.tipo === "bala") {
    if (weapon.nome === "Pistola") executarSom("pistola");
    if (weapon.nome === "Rifle") executarSom("rifle");
    if (weapon.nome === "Mini Uzi") executarSom("uzi");

    const hits = raycasterTiro.intersectObjects(todosAlvos, false);
    let pt =
      hits.length > 0
        ? hits[0].point
        : raycasterTiro.ray.origin
            .clone()
            .add(raycasterTiro.ray.direction.clone().multiplyScalar(100));

    // Armas sem chanceDeAcerto definida sempre acertam o que tá na
    // mira (Pistola/Rifle). A Mini Uzi é "vesga" de propósito: mesmo
    // acertando a mira, só 85% dos tiros realmente conectam.
    const chanceDeAcerto = weapon.chanceDeAcerto ?? 1.0;

    if (hits.length > 0 && Math.random() < chanceDeAcerto) {
      const atingido = hits[0].object.userData;
      if (
        atingido &&
        (atingido.tipo === "inimigo" || atingido.tipo === "boss")
      ) {
        const isHeadshot = atingido.parte === "cabeca";
        atingido.objeto.takeDamage(weapon.dano, isHeadshot);
      }
    }
    criarTracer(pt, weapon.corTracer);
  } else if (weapon.tipo === "shotgun") {
    executarSom("escopeta");

    for (let i = 0; i < weapon.pelotas; i++) {
      const dir = camera.getWorldDirection(new THREE.Vector3());
      dir.x += (Math.random() - 0.5) * 0.07;
      dir.y += (Math.random() - 0.5) * 0.07;
      dir.normalize();

      raycasterTiro.set(camera.getWorldPosition(new THREE.Vector3()), dir);

      const hits = raycasterTiro.intersectObjects(todosAlvos, false);
      let pt =
        hits.length > 0
          ? hits[0].point
          : raycasterTiro.ray.origin.clone().add(dir.multiplyScalar(60));

      if (hits.length > 0) {
        const atingido = hits[0].object.userData;
        if (
          atingido &&
          (atingido.tipo === "inimigo" || atingido.tipo === "boss")
        ) {
          const isHeadshot = atingido.parte === "cabeca";
          atingido.objeto.takeDamage(weapon.danoPelota, isHeadshot);
        }
      }
      criarTracer(pt, weapon.corTracer);
    }
  } else if (weapon.tipo === "sniper") {
    executarSom("sniper");

    const hits = raycasterTiro.intersectObjects(todosAlvos, false);
    let pt =
      hits.length > 0
        ? hits[0].point
        : raycasterTiro.ray.origin
            .clone()
            .add(raycasterTiro.ray.direction.clone().multiplyScalar(150));

    if (hits.length > 0) {
      const atingido = hits[0].object.userData;
      if (
        atingido &&
        (atingido.tipo === "inimigo" || atingido.tipo === "boss")
      ) {
        const isHeadshot = atingido.parte === "cabeca";
        const dano =
          hits[0].distance < 5 ? weapon.danoPerto : weapon.danoDistancia;
        atingido.objeto.takeDamage(dano, isHeadshot);
      }
    }
    criarTracer(pt, weapon.corTracer);
  } else if (weapon.tipo === "granada") {
    new GranadaProjetil(
      camera.position.clone(),
      camera.getWorldDirection(new THREE.Vector3()),
    );
  }
}

// ==========================================
// TROCA DE ARMA NO SCROLL (com proteção pra trackpad)
// ==========================================
// Trackpad dispara MUITOS eventos 'wheel' com deltaY pequeno pra um único
// gesto de dois dedos (bem diferente de um mouse com "cliques" de roda
// físicos), então sem um cooldown aqui um scroll no notebook pulava várias
// armas de uma vez. Esse cooldown só se aplica à TROCA de arma — o zoom da
// sniper continua liso, sem ele.
let ultimoScrollTroca = 0;
const COOLDOWN_SCROLL_TROCA = 150; // ms

window.addEventListener("wheel", (event) => {
  if (
    !controles.isLocked ||
    estadoJogo.introducaoAtiva ||
    estadoJogo.lendoBilhete
  )
    return;

  if (
    inventario[estadoArmas.armaAtualIndex].nome === "Sniper" &&
    estadoArmas.sniperScoped
  ) {
    estadoArmas.zoomAtual = Math.max(
      5,
      Math.min(45, estadoArmas.zoomAtual + (event.deltaY > 0 ? 4 : -4)),
    );
    camera.fov = estadoArmas.zoomAtual;
    camera.updateProjectionMatrix();
    return;
  }

  if (!estadoJogo.jogoIniciado) return;

  const agora = Date.now();
  if (agora - ultimoScrollTroca < COOLDOWN_SCROLL_TROCA) return;
  ultimoScrollTroca = agora;

  let indexOriginal = estadoArmas.armaAtualIndex;
  let direcaoTroca = event.deltaY > 0 ? 1 : -1;
  let novoIndex = estadoArmas.armaAtualIndex;

  do {
    novoIndex =
      (novoIndex + direcaoTroca + inventario.length) % inventario.length;
  } while (
    (inventario[novoIndex].nome === "Granada" &&
      inventario[novoIndex].munição === 0 &&
      novoIndex !== indexOriginal) ||
    (inventario[novoIndex].nome === "Mini Uzi" &&
      !estadoJogo.bossDerrotado &&
      novoIndex !== indexOriginal)
  );

  selecionarArma(novoIndex);
  updateHUD();
});

// ==========================================
// TROCA DE ARMA PELOS NÚMEROS DO TECLADO (1-6)
// ==========================================
// Alternativa ao scroll pra quem joga de notebook/trackpad. Usa os números
// da linha de cima do teclado (não o numérico), na mesma ordem do
// inventário: 1 Faca, 2 Pistola, 3 Rifle, 4 Escopeta, 5 Granada, 6 Sniper, 7 Mini Uzi.
const TECLAS_ARMA = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6 };

window.addEventListener("keydown", (e) => {
  if (
    !controles.isLocked ||
    estadoJogo.introducaoAtiva ||
    estadoJogo.lendoBilhete ||
    !estadoJogo.jogoIniciado
  )
    return;

  const novoIndex = TECLAS_ARMA[e.key];
  if (novoIndex === undefined) return;
  if (novoIndex === estadoArmas.armaAtualIndex) return;

  const arma = inventario[novoIndex];
  if (arma.nome === "Mini Uzi" && !estadoJogo.bossDerrotado) return; // travada até derrotar o boss
  if (arma.munição === 0) return; // mesma regra do scroll: sem munição não seleciona

  selecionarArma(novoIndex);
  updateHUD();
});
