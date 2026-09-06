import * as THREE from "three";
import { scene } from "./scene.js";

// ==========================================
// OBJETO 3D DO BILHETE NO CHÃO (CENTRO DO MAPA)
// ==========================================
function criarTexturaPapelBilhete3D() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#e2d3b4";
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = "#4a3621";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.fillStyle = "#1a1105";
  ctx.font = "bold 16px Courier New";
  ctx.fillText("• LICENÇA AZUL •", 40, 50);
  ctx.font = "12px Courier New";
  ctx.fillText("MANO A MANO...", 60, 120);
  ctx.fillText("[APERTE E PARA LER]", 35, 190);

  return new THREE.CanvasTexture(canvas);
}

const geoPapel = new THREE.PlaneGeometry(1.2, 1.2);
const matPapel = new THREE.MeshStandardMaterial({
  map: criarTexturaPapelBilhete3D(),
  roughness: 0.8,
  side: THREE.DoubleSide,
});
export const objPapel = new THREE.Mesh(geoPapel, matPapel);
objPapel.rotation.x = -Math.PI / 2;
objPapel.position.set(0, 0.03, 0); // Fica exatamente no centro do mapa
objPapel.visible = false; // só aparece depois de 20 kills (gatilho do pré-boss)
scene.add(objPapel);
