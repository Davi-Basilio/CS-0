import * as THREE from 'three';
import { scene } from './scene.js';
import { listaMeshesParedes } from './estado.js';

// ==========================================
// TEXTURA DE PAREDES E MAPA
// ==========================================
function criarMaterialParedeAntiga() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a4e4d';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 400; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#3b3f3e' : '#585d5b';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 8, 8);
    }

    ctx.fillStyle = 'rgba(40, 60, 35, 0.4)';
    ctx.fillRect(0, 0, 256, 30);
    ctx.fillRect(0, 220, 256, 36);

    ctx.strokeStyle = '#282a29';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        let x = Math.random() * 256;
        let y = Math.random() * 256;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80);
        ctx.stroke();
    }

    const textura = new THREE.CanvasTexture(canvas);
    textura.wrapS = THREE.RepeatWrapping;
    textura.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({ map: textura, roughness: 0.9 });
}

const materialParedeRuina = criarMaterialParedeAntiga();

// ==========================================
// CONSTRUÇÃO DO MAPA E FÍSICA DE COLISÃO
// ==========================================
const tamanhoChao = 200;
const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(tamanhoChao, tamanhoChao),
    new THREE.MeshStandardMaterial({ color: 0x4a483c, roughness: 0.95 })
);
chao.rotation.x = -Math.PI / 2;
chao.receiveShadow = true;
scene.add(chao);

const limitesObstaculos = [];

function criarParedeRuina(x, z, largura, altura, profundidade, horizontal = true) {
    const geo = new THREE.BoxGeometry(horizontal ? largura : profundidade, altura, horizontal ? profundidade : largura);

    const mat = materialParedeRuina.clone();
    mat.map = materialParedeRuina.map.clone();
    mat.map.repeat.set(Math.max(1, Math.floor(largura / 4)), Math.max(1, Math.floor(altura / 4)));
    mat.map.needsUpdate = true;

    const parede = new THREE.Mesh(geo, mat);
    parede.position.set(x, altura / 2, z);
    parede.castShadow = true;
    parede.receiveShadow = true;

    parede.userData = { tipo: 'parede' };
    listaMeshesParedes.push(parede);

    scene.add(parede);

    const w = horizontal ? largura : profundidade;
    const d = horizontal ? profundidade : largura;

    limitesObstaculos.push({
        xMin: x - w / 2,
        xMax: x + w / 2,
        zMin: z - d / 2,
        zMax: z + d / 2,
        yMax: altura
    });
}

const limiteBorda = tamanhoChao / 2;
criarParedeRuina(0, -limiteBorda, tamanhoChao, 10, 4, true);
criarParedeRuina(0, limiteBorda, tamanhoChao, 10, 4, true);
criarParedeRuina(-limiteBorda, 0, tamanhoChao, 10, 4, false);
criarParedeRuina(limiteBorda, 0, tamanhoChao, 10, 4, false);

criarParedeRuina(-12, 12, 14, 4, 2, true);
criarParedeRuina(12, -12, 14, 4, 2, true);
criarParedeRuina(-12, -12, 14, 4, 2, false);
criarParedeRuina(12, 12, 14, 4, 2, false);

const posicoesRuinas = [
    {x: -35, z: -35, w: 18, h: 5, horizontal: true},
    {x: -35, z: -25, w: 12, h: 3, horizontal: false},
    {x: 35, z: 35, w: 20, h: 4, horizontal: true},
    {x: 35, z: 25, w: 10, h: 5, horizontal: false},
    {x: -50, z: 20, w: 16, h: 4, horizontal: true},
    {x: 50, z: -20, w: 16, h: 4, horizontal: true},
    {x: 0, z: -45, w: 22, h: 3, horizontal: true},
    {x: 0, z: 45, w: 22, h: 3, horizontal: true},
    {x: -60, z: -60, w: 15, h: 6, horizontal: false},
    {x: 60, z: 60, w: 15, h: 6, horizontal: false},
    {x: -25, z: 60, w: 12, h: 4, horizontal: true},
    {x: 25, z: -60, w: 12, h: 4, horizontal: true},
    {x: -70, z: 0, w: 25, h: 5, horizontal: false},
    {x: 70, z: 0, w: 25, h: 5, horizontal: false}
];

posicoesRuinas.forEach(r => {
    criarParedeRuina(r.x, r.z, r.w, r.h, 2.5, r.horizontal);
});

export function checarPosicaoValida(x, z, margem = 0.4, y = 0) {
    const limiteSeguro = (tamanhoChao / 2) - 3;
    if (x < -limiteSeguro || x > limiteSeguro || z < -limiteSeguro || z > limiteSeguro) return false;

    for (const obs of limitesObstaculos) {
        if (x >= obs.xMin - margem && x <= obs.xMax + margem &&
            z >= obs.zMin - margem && z <= obs.zMax + margem) {
            if (y <= obs.yMax) {
                return false;
            }
        }
    }
    return true;
}
