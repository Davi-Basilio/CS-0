import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Previne o menu de contexto ao clicar com o botão direito
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Estados Globais do Jogo
let introducaoAtiva = true;
let jogoIniciado = false;
let lendoBilhete = false;
let saúdePlayer = 100;
let kills = 0; 
const MAX_INIMIGOS = 3;

// ==========================================
// 🔊 SISTEMA DE ÁUDIO
// ==========================================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5); 

const listener = new THREE.AudioListener();
camera.add(listener);

const audioLoader = new THREE.AudioLoader();
const sonsEfeitos = {};

const somAmbiente = new THREE.Audio(listener);
audioLoader.load('/audio/musica-fundo.mp3', (buffer) => {
    somAmbiente.setBuffer(buffer);
    somAmbiente.setLoop(true);
    somAmbiente.setVolume(0.35);
    if (!somAmbiente.isPlaying && listener.context.state === 'running') {
        somAmbiente.play();
    }
});

const ligarMusicaImediato = () => {
    if (listener.context.state === 'suspended') {
        listener.context.resume();
    }
    if (somAmbiente.buffer && !somAmbiente.isPlaying) {
        somAmbiente.play();
        document.removeEventListener('click', ligarMusicaImediato);
        document.removeEventListener('keydown', ligarMusicaImediato);
    }
};
document.addEventListener('click', ligarMusicaImediato);
document.addEventListener('keydown', ligarMusicaImediato);

function estruturarSom(nome, caminho) {
    sonsEfeitos[nome] = new THREE.Audio(listener);
    audioLoader.load(caminho, (buffer) => {
        sonsEfeitos[nome].setBuffer(buffer);
        sonsEfeitos[nome].setVolume(0.5);
    });
}

// DECLARAÇÃO DOS ÁUDIOS DO JOGO
estruturarSom('faca', '/audio/facada.wav');
estruturarSom('pistola', '/audio/pistola.mp3');
estruturarSom('rifle', '/audio/rifle.wav');
estruturarSom('escopeta', '/audio/escopeta.mp3');
estruturarSom('sniper', '/audio/sniper.wav');
estruturarSom('explosao', '/audio/explosao.wav');
estruturarSom('morreu', '/audio/morreu.wav'); 

function executarSom(nome) {
    if (sonsEfeitos[nome]) {
        if (sonsEfeitos[nome].isPlaying) sonsEfeitos[nome].stop();
        sonsEfeitos[nome].play();
    }
}

// ==========================================
// INTERFACES (INTRODUÇÃO, MORTE E BILHETE)
// ==========================================

// TELA DE BRIEFING (ESTILO CS 1.6)
const telaIntro = document.createElement('div');
telaIntro.style.position = 'absolute';
telaIntro.style.top = '0';
telaIntro.style.left = '0';
telaIntro.style.width = '100%';
telaIntro.style.height = '100%';
telaIntro.style.backgroundColor = 'rgba(25, 27, 25, 0.95)';
telaIntro.style.color = '#df9b00'; 
telaIntro.style.fontFamily = '"Courier New", Courier, monospace';
telaIntro.style.display = 'flex';
telaIntro.style.flexDirection = 'column';
telaIntro.style.justifyContent = 'center';
telaIntro.style.alignItems = 'center';
telaIntro.style.textAlign = 'center';
telaIntro.style.padding = '40px';
telaIntro.style.zIndex = '500';

telaIntro.innerHTML = `
    <div style="border: 3px double #df9b00; padding: 30px; max-width: 700px; background-color: #1c1e1c; box-shadow: 0 0 15px rgba(223,155,0,0.2);">
        <h1 style="font-size: 28px; margin-bottom: 20px; letter-spacing: 2px;">• BRIEFING DA MISSÃO •</h1>
        <p style="font-size: 18px; line-height: 1.6; text-align: left; margin-bottom: 30px;">
            Você foi mais uma vez enviado para uma missão de elite num setor abandonado!<br><br>
            Mas você não pode ficar só com essa faquinha né? Então enviamos uma caixa com mais armas e ao longo da jornada enviaremos mais suprimentos para ti!<br><br>
            <span style="color: #ffffff;">[!] É só quebrar a caixa na sua frente para liberar seu arsenal e iniciar o combate.</span>
        </p>
        <h3 style="animation: piscar 1s infinite; color: #ffffff; letter-spacing: 1px;">PRESSIONE ESPAÇO PARA COMEÇAR</h3>
    </div>
    <style>
        @keyframes piscar { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    </style>
`;
document.body.appendChild(telaIntro);

// TELA DE MORTE
const telaMorte = document.createElement('div');
telaMorte.style.position = 'absolute';
telaMorte.style.top = '0';
telaMorte.style.left = '0';
telaMorte.style.width = '100%';
telaMorte.style.height = '100%';
telaMorte.style.background = 'radial-gradient(circle, rgba(40,0,0,0.95) 0%, rgba(10,0,0,1) 100%)';
telaMorte.style.color = '#ff3333';
telaMorte.style.fontFamily = 'monospace';
telaMorte.style.display = 'none';
telaMorte.style.flexDirection = 'column';
telaMorte.style.justifyContent = 'center';
telaMorte.style.alignItems = 'center';
telaMorte.style.zIndex = '600';

telaMorte.innerHTML = `
    <h1 style="font-size: 45px; text-shadow: 0 0 10px #ff0000; margin-bottom: 10px; font-weight: bold;">VOCÊ MORREU!</h1>
    <p style="color: #aaaaaa; font-size: 20px; margin-bottom: 30px;">Agora você tem que começar de novo!</p>
    <button id="btnReiniciar" style="background-color: transparent; border: 2px solid #ff3333; color: #ff3333; padding: 12px 30px; font-size: 18px; font-family: monospace; cursor: pointer; font-weight: bold; transition: 0.3s;">
        REINICIAR OPERAÇÃO
    </button>
`;
document.body.appendChild(telaMorte);

document.getElementById('btnReiniciar').addEventListener('click', () => {
    location.reload();
});

// INTERFACE DO BILHETE (CHEFE)
const telaBilhete = document.createElement('div');
telaBilhete.style.position = 'absolute';
telaBilhete.style.top = '50%';
telaBilhete.style.left = '50%';
telaBilhete.style.transform = 'translate(-50%, -50%)';
telaBilhete.style.width = '90%';
telaBilhete.style.maxWidth = '620px';
telaBilhete.style.backgroundColor = '#e2d3b4';
telaBilhete.style.color = '#1a1105';
telaBilhete.style.fontFamily = '"Courier New", Courier, monospace';
telaBilhete.style.fontSize = '22px';
telaBilhete.style.fontWeight = 'bold';
telaBilhete.style.padding = '40px';
telaBilhete.style.border = '4px solid #4a3621';
telaBilhete.style.boxShadow = '0 0 30px rgba(0,0,0,0.9)';
telaBilhete.style.display = 'none';
telaBilhete.style.zIndex = '700';
telaBilhete.style.textAlign = 'center';
telaBilhete.style.lineHeight = '1.5';
telaBilhete.innerHTML = `
    <div style="border: 2px dashed #6e5033; padding: 25px; background-color: #d8c7a3;">
        <p style="margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">
            MUITA CARNICINHA PARA UM AGENTE, NÃO É? MESMO COM OS CABELOS RASPADOS E O SINAL DA LICENÇA AZUL, VOCÊ CONTINUOU MEXENDO COM OS MEUS, AGORA, VAI SER MANO A MANO.
        </p>
        <span style="font-size: 15px; color: #6e5033;">[ PRESSIONE 'E' PARA FECHAR O BILHETE ]</span>
    </div>
`;
document.body.appendChild(telaBilhete);

// HUD E ELEMENTOS DE TELA
const containerHPs = document.createElement('div');
containerHPs.style.position = 'absolute';
containerHPs.style.top = '0';
containerHPs.style.left = '0';
containerHPs.style.width = '100%';
containerHPs.style.height = '100%';
containerHPs.style.pointerEvents = 'none';
containerHPs.style.zIndex = '90';
document.body.appendChild(containerHPs);

const mira = document.createElement('div');
mira.style.position = 'absolute';
mira.style.top = '50%';
mira.style.left = '50%';
mira.style.width = '6px';
mira.style.height = '6px';
mira.style.backgroundColor = '#ffffff';
mira.style.borderRadius = '50%';
mira.style.transform = 'translate(-50%, -50%)';
mira.style.pointerEvents = 'none';
mira.style.zIndex = '100';
document.body.appendChild(mira);

const escopo = document.createElement('div');
escopo.style.position = 'absolute';
escopo.style.top = '0';
escopo.style.left = '0';
escopo.style.width = '100%';
escopo.style.height = '100%';
escopo.style.background = 'radial-gradient(circle, transparent 25%, rgba(0,0,0,0.85) 26%)';
escopo.style.pointerEvents = 'none';
escopo.style.display = 'none';
escopo.style.zIndex = '99';
document.body.appendChild(escopo);

const avisoMira = document.createElement('div');
avisoMira.style.position = 'absolute';
avisoMira.style.top = '50%';
avisoMira.style.right = '40px';
avisoMira.style.color = '#ffffff';
avisoMira.style.fontFamily = 'monospace';
avisoMira.style.fontSize = '18px';
avisoMira.style.fontWeight = 'bold';
avisoMira.style.transform = 'translateY(-50%)';
avisoMira.style.textShadow = '2px 2px #000000';
avisoMira.style.display = 'none';
avisoMira.style.zIndex = '100';
avisoMira.innerText = 'BOTÃO DIREITO: LUPA DE PRECISÃO';
document.body.appendChild(avisoMira);

const avisoCaixa = document.createElement('div');
avisoCaixa.style.position = 'absolute';
avisoCaixa.style.top = '50%';
avisoCaixa.style.left = '40px'; 
avisoCaixa.style.color = '#ffffff';
avisoCaixa.style.fontFamily = 'monospace';
avisoCaixa.style.fontSize = '18px';
avisoCaixa.style.fontWeight = 'bold';
avisoCaixa.style.transform = 'translateY(-50%)';
avisoCaixa.style.textShadow = '2px 2px #000000';
avisoCaixa.style.display = 'none';
avisoCaixa.style.zIndex = '100';
avisoCaixa.innerText = 'ATAQUE COM A FACA PARA QUEBRAR A CAIXA';
document.body.appendChild(avisoCaixa);

const avisoAcao = document.createElement('div');
avisoAcao.style.position = 'absolute';
avisoAcao.style.top = '62%';
avisoAcao.style.left = '50%';
avisoAcao.style.transform = 'translateX(-50%)';
avisoAcao.style.color = '#ffee88';
avisoAcao.style.fontFamily = 'monospace';
avisoAcao.style.fontSize = '20px';
avisoAcao.style.fontWeight = 'bold';
avisoAcao.style.textShadow = '2px 2px #000000';
avisoAcao.style.display = 'none';
avisoAcao.style.zIndex = '100';
document.body.appendChild(avisoAcao);

const hud = document.createElement('div');
hud.style.position = 'absolute';
hud.style.bottom = '20px';
hud.style.left = '20px';
hud.style.color = '#00ffff'; 
hud.style.fontFamily = 'monospace';
hud.style.fontSize = '24px';
hud.style.fontWeight = 'bold';
hud.style.textShadow = '2px 2px #000000';
hud.style.zIndex = '100';
document.body.appendChild(hud);

function updateHUD() {
    const weapon = inventario[armaAtualIndex];
    const ammo = weapon.munição === Infinity ? '∞' : weapon.munição;
    hud.innerHTML = `KILLS: ${kills} | SAÚDE: ${saúdePlayer} | ${weapon.nome.toUpperCase()} [${ammo}]`;
    updateVisualArma();
}

function verificarMortePlayer() {
    if (saúdePlayer <= 0) {
        controles.unlock();
        if (somAmbiente && somAmbiente.isPlaying) {
            somAmbiente.stop(); 
        }
        executarSom('morreu');
        telaMorte.style.display = 'flex';
    }
}

// ==========================================
// ARMAS E INVENTÁRIO DO JOGADOR
// ==========================================
const alvosInimigos = [];
const listaCaixas = []; 
const granadasEmVoo = []; 
const listaMeshesParedes = []; 

let facatAtacando = false;
let facaAnimaTime = 0;

const inventario = [
    { nome: 'Faca', munição: Infinity, dano: 100, firerate: 350, tipo: 'faca', corTracer: null },
    { nome: 'Pistola', munição: 0, dano: 20, firerate: 400, tipo: 'bala', corTracer: 0xaaaaaa }, 
    { nome: 'Rifle', munição: 0, dano: 15, firerate: 100, tipo: 'bala', corTracer: 0xff8c00 }, 
    { nome: 'Escopeta', munição: 0, pelotas: 5, danoPelota: 10, firerate: 750, tipo: 'shotgun', corTracer: 0x87cefa }, 
    { nome: 'Granada', munição: 0, dano: 120, firerate: 1000, tipo: 'granada', corTracer: null },
    { nome: 'Sniper', munição: 0, danoDistancia: 75, danoPerto: 30, firerate: 2000, tipo: 'sniper', corTracer: 0xff0000 } 
];
let armaAtualIndex = 0;

let sniperScoped = false;
let zoomAtual = 25;

const raycasterTiro = new THREE.Raycaster();
let mousePressionado = false;
let ultimoTiro = 0;

const textureLoader = new THREE.TextureLoader();

// ==========================================
// CENA, CÂMERA E AMBIENTE 3D
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x708090); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(luzAmbiente);

const luzSol = new THREE.DirectionalLight(0xffeedd, 1.3);
luzSol.position.set(40, 60, 40); 
luzSol.castShadow = true;
luzSol.shadow.mapSize.width = 1024;
luzSol.shadow.mapSize.height = 1024;
luzSol.shadow.camera.near = 0.5;
luzSol.shadow.camera.far = 200;
const d = 90;
luzSol.shadow.camera.left = -d;
luzSol.shadow.camera.right = d;
luzSol.shadow.camera.top = d;
luzSol.shadow.camera.bottom = -d;
luzSol.shadow.bias = -0.0005;
scene.add(luzSol);

const solGeo = new THREE.SphereGeometry(8, 16, 16);
const solMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 }); 
const solMesh = new THREE.Mesh(solGeo, solMat);
solMesh.position.copy(luzSol.position).multiplyScalar(2.5); 
scene.add(solMesh);

scene.add(camera);

// ==========================================
// MODELAGEM 3D COMPLETA DAS ARMAS DO PLAYER
// ==========================================
const grupoArmasPlayer = new THREE.Group();
grupoArmasPlayer.position.set(0.25, -0.22, -0.45);
camera.add(grupoArmasPlayer);

// 1. Faca
const grupoFaca = new THREE.Group();
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
for(let i = 0; i < 3; i++) {
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

function updateVisualArma() {
    listaModelos.forEach((modelo, index) => {
        modelo.visible = (index === armaAtualIndex);
    });
}

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

function checarPosicaoValida(x, z, margem = 0.4, y = 0) {
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

// ==========================================
// OBJETO 3D DO BILHETE NO CHÃO (CENTRO DO MAPA)
// ==========================================
function criarTexturaPapelBilhete3D() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#e2d3b4';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.strokeStyle = '#4a3621';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 236, 236);
    
    ctx.fillStyle = '#1a1105';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('• LICENÇA AZUL •', 40, 50);
    ctx.font = '12px Courier New';
    ctx.fillText('MANO A MANO...', 60, 120);
    ctx.fillText('[APERTE E PARA LER]', 35, 190);
    
    return new THREE.CanvasTexture(canvas);
}

const geoPapel = new THREE.PlaneGeometry(1.2, 1.2);
const matPapel = new THREE.MeshStandardMaterial({ map: criarTexturaPapelBilhete3D(), roughness: 0.8, side: THREE.DoubleSide });
const objPapel = new THREE.Mesh(geoPapel, matPapel);
objPapel.rotation.x = -Math.PI / 2;
objPapel.position.set(0, 0.03, 0); // Fica exatamente no centro do mapa
scene.add(objPapel);

// ==========================================
// PROJÉTEIS (GRANADAS E TRACERS)
// ==========================================
class GranadaProjetil {
    constructor(posInicial, direcao) {
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
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

        if (!checarPosicaoValida(nextX, this.mesh.position.z, 0.3, this.mesh.position.y)) {
            this.velocidade.x *= -0.6; 
        } else {
            this.mesh.position.x = nextX;
        }

        if (!checarPosicaoValida(this.mesh.position.x, nextZ, 0.3, this.mesh.position.y)) {
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
        const texRaio = textureLoader.load('raio.png');
        const matExplo = new THREE.MeshStandardMaterial({ map: texRaio, transparent: true, side: THREE.DoubleSide });
        const planoRaio = new THREE.Mesh(geoExplo, matExplo);
        planoRaio.rotation.x = -Math.PI / 2;
        planoRaio.position.copy(this.mesh.position);
        planoRaio.position.y = 0.03;
        scene.add(planoRaio);

        executarSom('explosao');

        alvosInimigos.forEach(inimigo => {
            if (this.mesh.position.distanceTo(inimigo.mesh.position) <= 14.0) {
                inimigo.takeDamage(120); 
            }
        });

        if (this.mesh.position.distanceTo(camera.position) <= 10.0) {
            saúdePlayer = Math.max(0, saúdePlayer - 60);
            updateHUD();
            verificarMortePlayer();
        }

        scene.remove(this.mesh);
        let escalaFadout = 0.3;
        const loopEfeito = setInterval(() => {
            escalaFadout += 0.38; 
            planoRaio.scale.set(escalaFadout, escalaFadout, 1);
            matExplo.opacity -= 0.09;
            if (matExplo.opacity <= 0) {
                clearInterval(loopEfeito);
                scene.remove(planoRaio);
            }
        }, 25);

        const idx = granadasEmVoo.indexOf(this);
        if (idx > -1) granadasEmVoo.splice(idx, 1);
    }
}

function criarTracerBot(origem, destino, cor) {
    if (!cor) return;
    const linha = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([origem, destino]), 
        new THREE.LineBasicMaterial({ color: cor })
    );
    scene.add(linha);
    setTimeout(() => { scene.remove(linha); }, 60);
}

// ==========================================
// CAIXAS DE LOOT
// ==========================================
function criarMaterialCaixaEstilizada(tipo, imgNome) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = tipo === 'munição' ? '#2f3b2c' : '#4d2a1b'; 
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = tipo === 'munição' ? '#20291e' : '#301a10';
    ctx.lineWidth = 6;
    for(let i = 64; i < 512; i += 64) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    ctx.fillStyle = tipo === 'munição' ? '#1c241a' : '#2b170e';
    ctx.fillRect(0, 0, 512, 40);
    ctx.fillRect(0, 472, 512, 40);
    ctx.fillRect(0, 0, 40, 512);
    ctx.fillRect(472, 0, 40, 512);

    ctx.fillStyle = '#888888';
    const rebites = [[20,20], [492,20], [20,492], [492,492]];
    rebites.forEach(pt => {
        ctx.beginPath(); ctx.arc(pt[0], pt[1], 8, 0, Math.PI*2); ctx.fill();
    });

    const canvasTextura = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({ map: canvasTextura, roughness: 0.4 });

    const imgElement = new Image();
    imgElement.src = imgNome;
    imgElement.onload = () => {
        ctx.drawImage(imgElement, 128, 128, 256, 256);
        canvasTextura.needsUpdate = true;
    };

    return material;
}

class CaixaItem {
    constructor(x, z, tipoItem, ehInicial = false) {
        this.tipoItem = tipoItem; 
        this.ehInicial = ehInicial;
        const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        
        const arquivoImagem = tipoItem === 'vida' ? 'barra.png' : 'bala.png';
        this.mesh = new THREE.Mesh(geo, criarMaterialCaixaEstilizada(tipoItem, arquivoImagem));
        this.mesh.position.set(x, 0.4, z); 
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.mesh.userData = { tipo: 'caixa', objeto: this };
        
        scene.add(this.mesh);
        listaCaixas.push(this);
    }

    quebrar() {
        scene.remove(this.mesh);
        const idx = listaCaixas.indexOf(this);
        if (idx > -1) listaCaixas.splice(idx, 1);

        if (this.ehInicial) {
            jogoIniciado = true;
            inventario[1].munição = 20;  
            inventario[2].munição = 50;  
            inventario[3].munição = 15;  
            inventario[4].munição = 5;   
            inventario[5].munição = 10;  
            
            for (let i = 0; i < MAX_INIMIGOS; i++) {
                spawnarInimigoAleatorio();
            }
        } else {
            if (this.tipoItem === 'vida') {
                saúdePlayer = Math.min(100, saúdePlayer + 55);
            } else if (this.tipoItem === 'munição') {
                inventario[1].munição = 20;  
                inventario[2].munição = 50;  
                inventario[3].munição = 15;  
                inventario[4].munição = 5;   
                inventario[5].munição = 10;  
            }
        }

        updateHUD();
    }
}

function spawnarCaixaLoot(tipo) {
    let x, z;
    do {
        x = (Math.random() - 0.5) * 160;
        z = (Math.random() - 0.5) * 160;
    } while (!checarPosicaoValida(x, z, 3.0));
    new CaixaItem(x, z, tipo, false);
}

new CaixaItem(0, 2, 'munição', true);

// ==========================================
// GERADORES DE TEXTURAS DOS MAFIOSOS
// ==========================================

// Rosto bravo de mafioso
function criarTexturaRostoMafiosoBravo() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Fundo da pele
    ctx.fillStyle = '#d2996c';
    ctx.fillRect(0, 0, 128, 128);

    // Sobrancelhas bravas (inclinadas para o centro)
    ctx.fillStyle = '#1c130b';
    ctx.beginPath();
    ctx.moveTo(20, 42); ctx.lineTo(55, 58); ctx.lineTo(20, 50);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(108, 42); ctx.lineTo(73, 58); ctx.lineTo(108, 50);
    ctx.fill();

    // Olhos bravos/focados
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 56, 22, 12);
    ctx.fillRect(78, 56, 22, 12);

    ctx.fillStyle = '#000000';
    ctx.fillRect(36, 58, 10, 10);
    ctx.fillRect(82, 58, 10, 10);

    // Nariz
    ctx.fillStyle = '#b3784f';
    ctx.fillRect(60, 68, 8, 16);

    // Boca brava/furiosa
    ctx.strokeStyle = '#2d1405';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(38, 102);
    ctx.lineTo(64, 92);
    ctx.lineTo(90, 102);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
}

const texturaRostoMafiosoGlobal = criarTexturaRostoMafiosoBravo();

// Braço direito com tatuagem da "Licença Azul" (símbolo L + A)
function criarTexturaBracoLicencaAzul(corColeteHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Fundo da roupa/cole do braço
    ctx.fillStyle = corColeteHex;
    ctx.fillRect(0, 0, 128, 128);

    // Símbolo 'LA' em Azul Escuro
    ctx.fillStyle = '#001a80'; 
    ctx.font = 'bold 52px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LA', 64, 64);

    ctx.strokeStyle = '#000040';
    ctx.lineWidth = 3;
    ctx.strokeText('LA', 64, 64);

    return new THREE.CanvasTexture(canvas);
}

// ==========================================
// INIMIGOS HUMANOIDES COM IA E ANATOMIA CORRIGIDA
// ==========================================

function adicionarArmaAoBot(bracoDir, tipo) {
    const grupoArmaBot = new THREE.Group();

    if (tipo === 'Faca') {
        const cabo = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        const lamina = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.035, 0.18), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        lamina.position.set(0, 0.005, -0.15);
        grupoArmaBot.add(cabo, lamina);
    } else if (tipo === 'Pistola') {
        const cano = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.18), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        const cabo = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.035), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        cabo.position.set(0, -0.06, 0.02);
        cabo.rotation.x = 0.25;
        grupoArmaBot.add(cano, cabo);
    } else if (tipo === 'Rifle') {
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.35), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        cano.rotation.x = Math.PI / 2;
        cano.position.set(0, 0, -0.3);
        grupoArmaBot.add(corpo, cano);
    } else if (tipo === 'Escopeta') {
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.25), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        const cano1 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4), new THREE.MeshStandardMaterial({ color: 0x444444 }));
        cano1.rotation.x = Math.PI / 2;
        cano1.position.set(-0.01, 0, -0.25);
        const cano2 = cano1.clone();
        cano2.position.set(0.01, 0, -0.25);
        grupoArmaBot.add(corpo, cano1, cano2);
    } else if (tipo === 'Sniper') {
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.45), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
        const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.55), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        cano.rotation.x = Math.PI / 2;
        cano.position.set(0, 0, -0.35);
        grupoArmaBot.add(corpo, cano);
    }

    // CORREÇÃO DA ORIENTAÇÃO DA ARMA NA MÃO DO BOT:
    // Posiciona a arma estendida para a frente da mão (orientação local -Z do corpo)
    grupoArmaBot.position.set(0, -0.2, -0.15);
    bracoDir.add(grupoArmaBot);
}

class Inimigo {
    constructor(x, z) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, 0, z);
        this.saúde = 100;
        this.alerta = false;
        this.ultimoAtaque = Date.now() + Math.random() * 1000;
        this.jogouGranada = false;

        const sorteio = Math.random() * 110;
        if (sorteio < 22) this.tipo = 'Faca';
        else if (sorteio < 50) this.tipo = 'Pistola';
        else if (sorteio < 78) this.tipo = 'Rifle';
        else if (sorteio < 95) this.tipo = 'Escopeta';
        else { this.tipo = 'Sniper'; }

        let corColeteHex = '#1f2e1f';
        let corColeteVal = 0x1f2e1f;
        let corCalca = 0x2e3b2e;

        if (this.tipo === 'Faca') {
            corColeteHex = '#8b0000';
            corColeteVal = 0x8b0000;
        } else if (this.tipo === 'Sniper') {
            corColeteHex = '#111111';
            corColeteVal = 0x111111;
            corCalca = 0x111111;
        }

        // Sorteio de cor de cabelo curto (Preto, Castanho, Loiro, Ruivo)
        const opcoesCabelo = [0x111111, 0x3d2314, 0xd4af37, 0x9e2a2b];
        const corCabelo = opcoesCabelo[Math.floor(Math.random() * opcoesCabelo.length)];

        const matPele = new THREE.MeshStandardMaterial({ color: 0xd2996c, roughness: 0.8 });
        const matRosto = new THREE.MeshStandardMaterial({ map: texturaRostoMafiosoGlobal, roughness: 0.8 });
        const matCabelo = new THREE.MeshStandardMaterial({ color: corCabelo, roughness: 0.9 });
        const matColete = new THREE.MeshStandardMaterial({ color: corColeteVal, roughness: 0.5 }); 
        const matCalca = new THREE.MeshStandardMaterial({ color: corCalca, roughness: 0.9 });
        const matBracoEsq = new THREE.MeshStandardMaterial({ color: corColeteVal, roughness: 0.5 });
        
        // Braço direito com símbolo 'LA'
        const matBracoDir = new THREE.MeshStandardMaterial({ 
            map: criarTexturaBracoLicencaAzul(corColeteHex), 
            roughness: 0.5 
        });
        const matBota = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

        // Cabeça com materiais múltiplos (frente = rosto bravo)
        const materiasCabeca = [
            matPele, // direita
            matPele, // esquerda
            matPele, // topo
            matPele, // base
            matPele, // tras
            matRosto // frente (-Z)
        ];

        const cabeca = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), materiasCabeca);
        cabeca.position.set(0, 1.7, 0);
        cabeca.name = 'cabeca';
        cabeca.castShadow = true;

        // Cabelo curto no topo e laterais
        const cabeloTopo = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.08, 0.37), matCabelo);
        cabeloTopo.position.set(0, 0.18, 0);
        cabeca.add(cabeloTopo);

        const cabeloTras = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.22, 0.06), matCabelo);
        cabeloTras.position.set(0, 0.05, 0.16);
        cabeca.add(cabeloTras);

        // Tronco e membros
        const tronco = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), matColete);
        tronco.position.set(0, 1.2, 0);
        tronco.castShadow = true;

        const bracoEsq = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), matBracoEsq);
        bracoEsq.position.set(-0.36, 1.2, 0);
        bracoEsq.castShadow = true;

        const bracoDir = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), matBracoDir);
        bracoDir.position.set(0.36, 1.2, 0);
        bracoDir.castShadow = true;

        // Aponta o braço direito para a frente para segurar a arma
        bracoDir.rotation.x = -Math.PI / 4;

        adicionarArmaAoBot(bracoDir, this.tipo);

        const pernaEsq = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), matCalca);
        pernaEsq.position.set(-0.15, 0.55, 0);
        pernaEsq.castShadow = true;

        const pernaDir = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), matCalca);
        pernaDir.position.set(0.15, 0.55, 0);
        pernaDir.castShadow = true;

        // Botas apontando para a frente (-Z)
        const botaEsq = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.28), matBota);
        botaEsq.position.set(-0.15, 0.1, -0.03);

        const botaDir = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.28), matBota);
        botaDir.position.set(0.15, 0.1, -0.03);

        this.mesh.add(cabeca, tronco, bracoEsq, bracoDir, pernaEsq, pernaDir, botaEsq, botaDir);

        this.mesh.traverse((membro) => {
            if (membro instanceof THREE.Mesh) {
                membro.userData = { tipo: 'inimigo', objeto: this, parte: membro.name };
            }
        });

        scene.add(this.mesh);
        alvosInimigos.push(this);

        this.hpDiv = document.createElement('div');
        this.hpDiv.style.position = 'absolute';
        this.hpDiv.style.color = '#ff3333';
        this.hpDiv.style.fontFamily = 'monospace';
        this.hpDiv.style.fontSize = '16px';
        this.hpDiv.style.fontWeight = 'bold';
        this.hpDiv.style.textShadow = '1.5px 1.5px #000000';
        this.hpDiv.style.willChange = 'transform'; 
        this.hpDiv.innerText = `HP: ${this.saúde} [${this.tipo.toUpperCase()}]`;
        containerHPs.appendChild(this.hpDiv);
    }

    takeDamage(amount, isHeadshot = false) {
        this.alerta = true; 
        const danoFinal = isHeadshot ? amount * 2 : amount;
        this.saúde -= danoFinal;

        if (this.saúde <= 0) {
            scene.remove(this.mesh);
            if (this.hpDiv && this.hpDiv.parentNode) containerHPs.removeChild(this.hpDiv);

            const index = alvosInimigos.indexOf(this);
            if (index > -1) alvosInimigos.splice(index, 1);
            
            kills++;
            updateHUD();

            if (kills % 3 === 0) spawnarCaixaLoot('vida');       
            if (kills % 10 === 0) spawnarCaixaLoot('munição');   

            // REGRA DE SPAWN:
            // A partir de 17 kills, NÃO nascem mais novos inimigos.
            // Os 3 inimigos existentes vão morrendo (17 -> 3, 18 -> 2, 19 -> 1, 20 -> 0).
            if (kills < 17 && alvosInimigos.length < MAX_INIMIGOS) {
                spawnarInimigoAleatorio();
            }
        } else {
            this.hpDiv.innerText = isHeadshot ? `HP: ${this.saúde} (HS!)` : `HP: ${this.saúde} [${this.tipo.toUpperCase()}]`;
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
        
        const raycasterObstaculo = new THREE.Raycaster(orig, dir, 0, orig.distanceTo(dest));
        const hits = raycasterObstaculo.intersectObjects(listaMeshesParedes, false);
        return hits.length === 0;
    }

    botAtirarNoPlayer() {
        const agora = Date.now();
        let firerate = 600;
        let dano = 10;
        let headshotChance = 0.05;
        let corTracer = 0xaaaaaa;
        let som = 'pistola';

        if (this.tipo === 'Faca') {
            if (this.mesh.position.distanceTo(camera.position) < 2.5) {
                if (agora - this.ultimoAtaque > 500) {
                    this.ultimoAtaque = agora;
                    executarSom('faca');
                    saúdePlayer = Math.max(0, saúdePlayer - 35);
                    updateHUD();
                    verificarMortePlayer();
                }
            }
            return;
        } else if (this.tipo === 'Pistola') {
            firerate = 700; dano = 8; headshotChance = 0.05; corTracer = 0xaaaaaa; som = 'pistola';
        } else if (this.tipo === 'Rifle') {
            firerate = 250; dano = 6; headshotChance = 0; corTracer = 0xff8c00; som = 'rifle';
        } else if (this.tipo === 'Escopeta') {
            firerate = 1000; headshotChance = 0.05; corTracer = 0x87cefa; som = 'escopeta';
        } else if (this.tipo === 'Sniper') {
            firerate = 2500; dano = 35; headshotChance = 0.10; corTracer = 0xff0000; som = 'sniper';
        }

        if (agora - this.ultimoAtaque < firerate) return;
        if (!this.temLinhaDeVisaoLimpa()) return;

        this.ultimoAtaque = agora;
        executarSom(som);

        const orig = this.mesh.position.clone();
        orig.y += 1.4;

        if (this.tipo === 'Escopeta') {
            let pelotasAcertaram = 0;
            for (let i = 0; i < 5; i++) {
                const dest = camera.position.clone();
                dest.x += (Math.random() - 0.5) * 1.8;
                dest.y += (Math.random() - 0.5) * 1.8;
                dest.z += (Math.random() - 0.5) * 1.8;

                if (Math.random() < 0.6) pelotasAcertaram++;
                criarTracerBot(orig, dest, corTracer);
            }
            if (pelotasAcertaram > 0) {
                saúdePlayer = Math.max(0, saúdePlayer - (pelotasAcertaram * 5));
                updateHUD();
                verificarMortePlayer();
            }
        } else {
            const isHS = Math.random() < headshotChance;
            const danoFinal = isHS ? dano * 2 : dano;

            saúdePlayer = Math.max(0, saúdePlayer - danoFinal);
            updateHUD();

            const dest = camera.position.clone();
            dest.x += (Math.random() - 0.5) * 0.4; 
            dest.y += (Math.random() - 0.5) * 0.4;
            dest.z += (Math.random() - 0.5) * 0.4;
            
            criarTracerBot(orig, dest, corTracer);
            verificarMortePlayer();
        }
    }

    atualizarIA() {
        if (introducaoAtiva || saúdePlayer <= 0 || !jogoIniciado || lendoBilhete) return;

        const dist = this.mesh.position.distanceTo(camera.position);

        if (!this.alerta) {
            if (this.tipo === 'Sniper' && dist <= 65.0) {
                this.alerta = true;
            } else if (this.tipo !== 'Sniper' && dist <= 50.0) {
                this.alerta = true;
            }
        }

        if (!this.alerta) return; 

        if (this.tipo === 'Sniper' && dist > 65.0) {
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
        this.mesh.lookAt(posAlvo);

        const dir = new THREE.Vector3().subVectors(posAlvo, this.mesh.position).normalize();

        if (this.tipo === 'Faca') {
            // VELOCIDADE DA FACA AUMENTADA PARA CORREREM MAIS RÁPIDO
            this.moverBot(dir.x, dir.z, 0.22); 
            this.botAtirarNoPlayer();
        } else if (this.tipo === 'Pistola') {
            if (dist > 10.0) this.moverBot(dir.x, dir.z, 0.06);
            this.botAtirarNoPlayer();
        } else if (this.tipo === 'Rifle') {
            if (dist > 12.0) this.moverBot(dir.x, dir.z, 0.05);
            this.botAtirarNoPlayer();
        } else if (this.tipo === 'Escopeta') {
            if (dist > 5.0) {
                this.moverBot(dir.x, dir.z, 0.08); 
            } else {
                this.botAtirarNoPlayer();
            }
        } else if (this.tipo === 'Sniper') {
            if (dist < 25.0) {
                this.moverBot(-dir.x, -dir.z, 0.06); 
            }
            this.botAtirarNoPlayer();
        }
    }
}

function spawnarInimigoAleatorio() {
    if (alvosInimigos.length >= MAX_INIMIGOS || kills >= 17) return;
    let x, z;
    do {
        x = (Math.random() - 0.5) * 160;
        z = (Math.random() - 0.5) * 160;
    } while (
        camera.position.distanceTo(new THREE.Vector3(x, camera.position.y, z)) < 35.0 || 
        !checarPosicaoValida(x, z, 2.0)
    );
    new Inimigo(x, z);
}

// ==========================================
// CONTROLES, ATALHOS (ALT+K) E INTERAÇÕES
// ==========================================
const controles = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => { 
    if(!introducaoAtiva && saúdePlayer > 0 && !lendoBilhete) controles.lock(); 
});

const teclas = { w: false, a: false, s: false, d: false, shift: false, space: false };
const velocidadeCaminhar = 0.12;
const velocidadeCorrer = 0.22;
let velocidadeY = 0;
const gravidade = 0.008;
let noChao = true;

window.addEventListener('keydown', (e) => {
    // TELA INICIAL (BRIEFING)
    if (introducaoAtiva && e.key === ' ') {
        introducaoAtiva = false;
        telaIntro.style.display = 'none';
        controles.lock();
        return;
    }

    // INTERAÇÃO COM O BILHETE (TECLA E)
    if (e.key.toLowerCase() === 'e' && !introducaoAtiva && saúdePlayer > 0) {
        const distAoBilhete = camera.position.distanceTo(objPapel.position);
        if (!lendoBilhete && distAoBilhete < 3.5) {
            lendoBilhete = true;
            controles.unlock();
            telaBilhete.style.display = 'block';
            avisoAcao.style.display = 'none';
        } else if (lendoBilhete) {
            lendoBilhete = false;
            telaBilhete.style.display = 'none';
            controles.lock();
        }
    }

    // ATALHO ALT + K (MATA INSTANTANEAMENTE 20 INIMIGOS E PARA DE NASCER)
    if (e.altKey && e.key.toLowerCase() === 'k') {
        kills = 20;
        
        // Remove todos os inimigos vivos do mapa
        for (let i = alvosInimigos.length - 1; i >= 0; i--) {
            scene.remove(alvosInimigos[i].mesh);
            if (alvosInimigos[i].hpDiv && alvosInimigos[i].hpDiv.parentNode) {
                containerHPs.removeChild(alvosInimigos[i].hpDiv);
            }
        }
        alvosInimigos.length = 0; // Limpa o array
        updateHUD();
    }

    const k = e.key.toLowerCase();
    if (k === ' ') teclas.space = true;
    if (e.key === 'Shift') teclas.shift = true;
    if (k in teclas) teclas[k] = true;
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ') teclas.space = false;
    if (e.key === 'Shift') teclas.shift = false;
    if (k in teclas) teclas[k] = false;
});

function criarTracer(destino, cor) {
    if (!cor) return;
    const offset = new THREE.Vector3(0.25, -0.2, -0.45).applyQuaternion(camera.quaternion);
    const origem = camera.position.clone().add(offset);
    const linha = new THREE.Line(new THREE.BufferGeometry().setFromPoints([origem, destino]), new THREE.LineBasicMaterial({ color: cor }));
    scene.add(linha);
    setTimeout(() => { scene.remove(linha); }, 60);
}

// ==========================================
// DISPAROS E TIROS DO JOGADOR
// ==========================================
window.addEventListener('mousedown', (e) => {
    if (!controles.isLocked || introducaoAtiva || lendoBilhete) return;
    if (e.button === 0) { mousePressionado = true; tentarAtirar(); }
    else if (e.button === 2 && inventario[armaAtualIndex].nome === 'Sniper') {
        sniperScoped = !sniperScoped;
        camera.fov = sniperScoped ? zoomAtual : 75;
        escopo.style.display = sniperScoped ? 'block' : 'none';
        grupoArmasPlayer.visible = !sniperScoped;
        camera.updateProjectionMatrix();
    }
});

window.addEventListener('mouseup', (e) => { 
    if (e.button === 0) mousePressionado = false; 
});

function tentarAtirar() {
    const agora = Date.now();
    const weapon = inventario[armaAtualIndex];
    if (agora - ultimoTiro < weapon.firerate) return;

    if (weapon.munição > 0) {
        atirar();
        ultimoTiro = agora;
        
        if (weapon.munição !== Infinity) {
            weapon.munição--;
            if (weapon.munição === 0 && weapon.nome === 'Granada') {
                mousePressionado = false;
                armaAtualIndex = 0; 
                sniperScoped = false; camera.fov = 75; escopo.style.display = 'none'; grupoArmasPlayer.visible = true;
                camera.updateProjectionMatrix();
            }
        }
        updateHUD();
    }
}

function obterTodosMeshesAlvo() {
    const meshes = [...listaMeshesParedes, ...listaCaixas.map(c => c.mesh)];
    alvosInimigos.forEach(inimigo => {
        inimigo.mesh.traverse(child => {
            if (child instanceof THREE.Mesh) meshes.push(child);
        });
    });
    return meshes;
}

function atirar() {
    const weapon = inventario[armaAtualIndex];
    raycasterTiro.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const todosAlvos = obterTodosMeshesAlvo();

    if (weapon.tipo === 'faca') {
        executarSom('faca');
        facatAtacando = true;
        facaAnimaTime = Date.now();

        const hits = raycasterTiro.intersectObjects(todosAlvos, false);
        if (hits.length > 0 && hits[0].distance < 3.0) {
            const atingido = hits[0].object.userData;
            if (atingido && atingido.tipo === 'caixa') atingido.objeto.quebrar();
            else if (atingido && atingido.tipo === 'inimigo') atingido.objeto.takeDamage(weapon.dano);
        }
    } 
    else if (weapon.tipo === 'bala') {
        if (weapon.nome === 'Pistola') executarSom('pistola');
        if (weapon.nome === 'Rifle') executarSom('rifle');

        const hits = raycasterTiro.intersectObjects(todosAlvos, false);
        let pt = hits.length > 0 ? hits[0].point : raycasterTiro.ray.origin.clone().add(raycasterTiro.ray.direction.clone().multiplyScalar(100));
        
        if (hits.length > 0) {
            const atingido = hits[0].object.userData;
            if (atingido && atingido.tipo === 'inimigo') {
                const isHeadshot = atingido.parte === 'cabeca';
                atingido.objeto.takeDamage(weapon.dano, isHeadshot);
            }
        }
        criarTracer(pt, weapon.corTracer);
    } 
    else if (weapon.tipo === 'shotgun') {
        executarSom('escopeta');

        for (let i = 0; i < weapon.pelotas; i++) {
            const dir = camera.getWorldDirection(new THREE.Vector3());
            dir.x += (Math.random() - 0.5) * 0.15; 
            dir.y += (Math.random() - 0.5) * 0.15; 
            dir.normalize();
            
            raycasterTiro.set(camera.getWorldPosition(new THREE.Vector3()), dir);
            
            const hits = raycasterTiro.intersectObjects(todosAlvos, false);
            let pt = hits.length > 0 ? hits[0].point : raycasterTiro.ray.origin.clone().add(dir.multiplyScalar(60));
            
            if (hits.length > 0) {
                const atingido = hits[0].object.userData;
                if (atingido && atingido.tipo === 'inimigo') {
                    const isHeadshot = atingido.parte === 'cabeca';
                    atingido.objeto.takeDamage(weapon.danoPelota, isHeadshot);
                }
            }
            criarTracer(pt, weapon.corTracer);
        }
    } 
    else if (weapon.tipo === 'sniper') {
        executarSom('sniper');

        const hits = raycasterTiro.intersectObjects(todosAlvos, false);
        let pt = hits.length > 0 ? hits[0].point : raycasterTiro.ray.origin.clone().add(raycasterTiro.ray.direction.clone().multiplyScalar(150));
        
        if (hits.length > 0) {
            const atingido = hits[0].object.userData;
            if (atingido && atingido.tipo === 'inimigo') {
                const isHeadshot = atingido.parte === 'cabeca';
                const dano = hits[0].distance < 5 ? weapon.danoPerto : weapon.danoDistancia;
                atingido.objeto.takeDamage(dano, isHeadshot);
            }
        }
        criarTracer(pt, weapon.corTracer);
    } 
    else if (weapon.tipo === 'granada') {
        new GranadaProjetil(camera.position.clone(), camera.getWorldDirection(new THREE.Vector3()));
    }
}

window.addEventListener('wheel', (event) => {
    if (!controles.isLocked || introducaoAtiva || lendoBilhete) return;
    
    if (inventario[armaAtualIndex].nome === 'Sniper' && sniperScoped) {
        zoomAtual = Math.max(5, Math.min(45, zoomAtual + (event.deltaY > 0 ? 4 : -4)));
        camera.fov = zoomAtual; camera.updateProjectionMatrix();
        return;
    }

    if (!jogoIniciado) return;

    let indexOriginal = armaAtualIndex;
    let direcaoTroca = event.deltaY > 0 ? 1 : -1;
    
    do {
        armaAtualIndex = (armaAtualIndex + direcaoTroca + inventario.length) % inventario.length;
    } while (inventario[armaAtualIndex].nome === 'Granada' && inventario[armaAtualIndex].munição === 0 && armaAtualIndex !== indexOriginal);

    sniperScoped = false; camera.fov = 75; escopo.style.display = 'none'; grupoArmasPlayer.visible = true;
    camera.updateProjectionMatrix();
    updateHUD();
});

const posProjetada = new THREE.Vector3();

// ==========================================
// LOOP DE EXECUÇÃO E ANIMAÇÃO PRINCIPAL
// ==========================================
function animar() {
  requestAnimationFrame(animar);

  // VERIFICAÇÃO DA DISTÂNCIA AO BILHETE PARA MOSTRAR AVISO
  if (!introducaoAtiva && saúdePlayer > 0 && !lendoBilhete) {
      const distBilhete = camera.position.distanceTo(objPapel.position);
      if (distBilhete < 3.5) {
          avisoAcao.innerText = "PRESSIONE [E] PARA LER O BILHETE";
          avisoAcao.style.display = 'block';
          avisoAcao.style.opacity = (Math.floor(Date.now() / 350) % 2 === 0) ? '1' : '0.3';
      } else {
          avisoAcao.style.display = 'none';
      }
  } else if (lendoBilhete) {
      avisoAcao.style.display = 'none';
  }

  if (controles.isLocked && !introducaoAtiva && !lendoBilhete) {
    if (mousePressionado) tentarAtirar();

    // Animação de ataque com a faca do jogador
    if (facatAtacando) {
        const decorrido = Date.now() - facaAnimaTime;
        const duracao = 200; 
        if (decorrido < duracao) {
            const progresso = decorrido / duracao;
            grupoFaca.rotation.y = Math.sin(progresso * Math.PI) * 2.0; 
            grupoFaca.rotation.z = Math.sin(progresso * Math.PI) * 0.5; 
            grupoFaca.position.x = Math.sin(progresso * Math.PI) * 0.15;
        } else {
            facatAtacando = false;
            grupoFaca.rotation.set(0, 0, 0); 
            grupoFaca.position.set(0, 0, 0);
        }
    }

    // Atualização de projéteis em voo
    for (let i = granadasEmVoo.length - 1; i >= 0; i--) {
        granadasEmVoo[i].atualizar();
    }

    // IA e posições das tags dos inimigos
    alvosInimigos.forEach(inimigo => {
        inimigo.atualizarIA();

        posProjetada.copy(inimigo.mesh.position).y += 2.1; 
        posProjetada.project(camera);
        if (posProjetada.z > 1) {
            inimigo.hpDiv.style.display = 'none';
        } else {
            inimigo.hpDiv.style.display = 'block';
            const xPos = (posProjetada.x * 0.5 + 0.5) * window.innerWidth;
            const yPos = (posProjetada.y * -0.5 + 0.5) * window.innerHeight;
            inimigo.hpDiv.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) translate(-50%, -50%)`;
            inimigo.hpDiv.style.left = '0px';
            inimigo.hpDiv.style.top = '0px';
        }
    });

    // Avisos na tela
    avisoMira.style.display = (inventario[armaAtualIndex].nome === 'Sniper' && !sniperScoped) ? 'block' : 'none';
    if(avisoMira.style.display === 'block') avisoMira.style.opacity = (Math.floor(Date.now() / 350) % 2 === 0) ? '1' : '0';

    let proximoDeCaixa = listaCaixas.some(c => camera.position.distanceTo(c.mesh.position) < 3.0);
    avisoCaixa.style.display = proximoDeCaixa ? 'block' : 'none';
    if(avisoCaixa.style.display === 'block') avisoCaixa.style.opacity = (Math.floor(Date.now() / 350) % 2 === 0) ? '1' : '0';

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

    if (teclas.space && noChao) { velocidadeY = 0.16; noChao = false; }
    if (!noChao) {
      camera.position.y += velocidadeY; velocidadeY -= gravidade;
      if (camera.position.y <= 1.6) { camera.position.y = 1.6; velocidadeY = 0; noChao = true; }
    }
  }

  renderer.render(scene, camera);
}
animar();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateHUD();