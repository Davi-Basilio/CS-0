import * as THREE from 'three';

// ==========================================
// CENA, CÂMERA E AMBIENTE 3D
// ==========================================
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x708090);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
