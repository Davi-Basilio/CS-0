import * as THREE from "three";
import { scene, camera } from "./scene.js";
import {
  estadoJogo,
  listaCaixas,
  inventario,
  MAX_INIMIGOS,
  recargaMunicao,
} from "./estado.js";
import { checarPosicaoValida } from "./mapa.js";
import { updateHUD } from "./ui.js";
import { spawnarInimigoAleatorio } from "./inimigos.js";
import { descartarObjeto3D } from "./utils.js";

// ==========================================
// CAIXAS DE LOOT
// ==========================================
function criarMaterialCaixaEstilizada(tipo, imgNome) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = tipo === "munição" ? "#2f3b2c" : "#4d2a1b";
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = tipo === "munição" ? "#20291e" : "#301a10";
  ctx.lineWidth = 6;
  for (let i = 64; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.fillStyle = tipo === "munição" ? "#1c241a" : "#2b170e";
  ctx.fillRect(0, 0, 512, 40);
  ctx.fillRect(0, 472, 512, 40);
  ctx.fillRect(0, 0, 40, 512);
  ctx.fillRect(472, 0, 40, 512);

  ctx.fillStyle = "#888888";
  const rebites = [
    [20, 20],
    [492, 20],
    [20, 492],
    [492, 492],
  ];
  rebites.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt[0], pt[1], 8, 0, Math.PI * 2);
    ctx.fill();
  });

  const canvasTextura = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshStandardMaterial({
    map: canvasTextura,
    roughness: 0.4,
  });

  const imgElement = new Image();
  imgElement.src = imgNome;
  imgElement.onload = () => {
    ctx.drawImage(imgElement, 128, 128, 256, 256);
    canvasTextura.needsUpdate = true;
  };

  return material;
}

// Recarrega a munição de todas as armas, aplicando o multiplicador atual
// (fica 1.5x depois do capítulo 2 — é por isso que essa função existe em
// vez dos valores ficarem espalhados/duplicados em cada caixa)
function aplicarRecargaCompleta() {
  inventario[1].munição = Math.round(
    recargaMunicao.pistola * estadoJogo.multiplicadorMunicao,
  );
  inventario[2].munição = Math.round(
    recargaMunicao.rifle * estadoJogo.multiplicadorMunicao,
  );
  inventario[3].munição = Math.round(
    recargaMunicao.escopeta * estadoJogo.multiplicadorMunicao,
  );
  inventario[4].munição = Math.round(
    recargaMunicao.granada * estadoJogo.multiplicadorMunicao,
  );
  inventario[5].munição = Math.round(
    recargaMunicao.sniper * estadoJogo.multiplicadorMunicao,
  );
}

export class CaixaItem {
  constructor(x, z, tipoItem, ehInicial = false, ehCapitulo2 = false) {
    this.tipoItem = tipoItem;
    this.ehInicial = ehInicial;
    this.ehCapitulo2 = ehCapitulo2;
    const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);

    const arquivoImagem = tipoItem === "vida" ? "barra.png" : "bala.png";
    this.mesh = new THREE.Mesh(
      geo,
      criarMaterialCaixaEstilizada(tipoItem, arquivoImagem),
    );
    this.mesh.position.set(x, 0.4, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.mesh.userData = { tipo: "caixa", objeto: this };

    scene.add(this.mesh);
    listaCaixas.push(this);
  }

  quebrar() {
    scene.remove(this.mesh);
    // cada caixa tem sua própria textura (canvas único), então dá pra
    // descartar tudo com segurança, sem afetar nenhuma outra caixa
    descartarObjeto3D(this.mesh);
    const idx = listaCaixas.indexOf(this);
    if (idx > -1) listaCaixas.splice(idx, 1);

    if (this.ehInicial) {
      estadoJogo.jogoIniciado = true;
      aplicarRecargaCompleta();

      for (let i = 0; i < MAX_INIMIGOS; i++) {
        spawnarInimigoAleatorio();
      }
    } else if (this.ehCapitulo2) {
      // "Melhoria pras armas e um colete melhor" — a partir daqui TODA
      // recarga de munição (inclusive as caixas comuns) vem 50% maior
      estadoJogo.saúdeMaxima = 200;
      estadoJogo.saúdePlayer = 200;
      estadoJogo.multiplicadorMunicao = 1.5;
      estadoJogo.bossDerrotado = true;
      aplicarRecargaCompleta();

      for (let i = 0; i < MAX_INIMIGOS; i++) {
        spawnarInimigoAleatorio();
      }
    } else {
      if (this.tipoItem === "vida") {
        estadoJogo.saúdePlayer = Math.min(
          estadoJogo.saúdeMaxima,
          estadoJogo.saúdePlayer + 55,
        );
      } else if (this.tipoItem === "munição") {
        aplicarRecargaCompleta();
      }
    }

    updateHUD();
  }
}

export function spawnarCaixaLoot(tipo) {
  let x, z;
  do {
    x = (Math.random() - 0.5) * 160;
    z = (Math.random() - 0.5) * 160;
  } while (!checarPosicaoValida(x, z, 3.0));
  new CaixaItem(x, z, tipo, false);
}

// Caixa de munição do capítulo 2 — nasce na frente de onde o player tá
// olhando no momento em que é chamada (logo após fechar a tela de
// briefing do capítulo 2)
export function spawnarCaixaCapitulo2() {
  const frente = camera.getWorldDirection(new THREE.Vector3());
  const x = camera.position.x + frente.x * 3;
  const z = camera.position.z + frente.z * 3;
  new CaixaItem(x, z, "munição", false, true);
}

new CaixaItem(0, 2, "munição", true);
