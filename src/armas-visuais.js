import * as THREE from 'three';
import { camera } from './scene.js';
import { estadoArmas } from './estado.js';

// ==========================================
// MODELAGEM 3D COMPLETA DAS ARMAS DO PLAYER
// ==========================================
export const grupoArmasPlayer = new THREE.Group();
grupoArmasPlayer.position.set(0.25, -0.22, -0.45);
camera.add(grupoArmasPlayer);

// 1. Faca
export const grupoFaca = new THREE.Group();
const caboFaca = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
caboFaca.position.set(0, 0, -0.02);
const laminaFaca = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.035, 0.18), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2 }));
laminaFaca.position.set(0, 0.005, -0.15);
grupoFaca.add(caboFaca, laminaFaca);
grupoArmasPlayer.add(grupoFaca);

// 2. Pistola
const grupoPistola = new THREE.Group();
const canoPistola = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.18), new THREE.MeshStandardMaterial({ color: 0x333333 }));
canoPistola.position.set(0, 0, -0.05);
const caboPistola = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.035), new THREE.MeshStandardMaterial({ color: 0x222222 }));
caboPistola.position.set(0, -0.06, 0.02);
caboPistola.rotation.x = 0.25;
const apoioGatilho = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0x111111 }));
apoioGatilho.position.set(0, -0.03, -0.02);
grupoPistola.add(canoPistola, caboPistola, apoioGatilho);
grupoArmasPlayer.add(grupoPistola);

// 3. Rifle
const grupoRifle = new THREE.Group();
const coronhaRifle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.25), new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 }));
coronhaRifle.position.set(0, -0.03, 0.1);
const corpoRifle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.35), new THREE.MeshStandardMaterial({ color: 0x333333 }));
corpoRifle.position.set(0, 0, -0.15);
const canoRifle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
canoRifle.rotation.x = Math.PI / 2;
canoRifle.position.set(0, 0.01, -0.45);
grupoRifle.add(coronhaRifle, corpoRifle, canoRifle);
grupoArmasPlayer.add(grupoRifle);

// 4. Escopeta
const grupoEscopeta = new THREE.Group();
const coronhaEsc = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.25), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
coronhaEsc.position.set(0, -0.03, 0.1);
const corpoEsc = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.25), new THREE.MeshStandardMaterial({ color: 0x222222 }));
corpoEsc.position.set(0, 0, -0.1);
for (let i = 0; i < 3; i++) {
    const canoFixo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    canoFixo.rotation.x = Math.PI / 2;
    canoFixo.position.set((i - 1) * 0.015, 0, -0.38);
    grupoEscopeta.add(canoFixo);
}
grupoEscopeta.add(coronhaEsc, corpoEsc);
grupoArmasPlayer.add(grupoEscopeta);

// 5. Granada
const grupoGranada = new THREE.Group();
const bolaVerde = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.5 }));
const topoCilindro = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03), new THREE.MeshStandardMaterial({ color: 0x888888 }));
topoCilindro.position.y = 0.055;
const argolaGranada = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 8, 16), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3 }));
argolaGranada.position.set(0.018, 0.06, 0);
argolaGranada.rotation.y = Math.PI / 2;
grupoGranada.add(bolaVerde, topoCilindro, argolaGranada);
grupoArmasPlayer.add(grupoGranada);

// 6. Sniper
const grupoSniper = new THREE.Group();
const corpoSniper = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.45), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
corpoSniper.position.set(0, 0, -0.1);
const canoSniper = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.55), new THREE.MeshStandardMaterial({ color: 0x111111 }));
canoSniper.rotation.x = Math.PI / 2;
canoSniper.position.set(0, 0.01, -0.5);
const lunetaMira = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22), new THREE.MeshStandardMaterial({ color: 0x222222 }));
lunetaMira.rotation.x = Math.PI / 2;
lunetaMira.position.set(0, 0.045, -0.1);
grupoSniper.add(corpoSniper, canoSniper, lunetaMira);
grupoArmasPlayer.add(grupoSniper);

const listaModelos = [grupoFaca, grupoPistola, grupoRifle, grupoEscopeta, grupoGranada, grupoSniper];

export function updateVisualArma() {
    listaModelos.forEach((modelo, index) => {
        modelo.visible = (index === estadoArmas.armaAtualIndex);
    });
}
