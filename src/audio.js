import * as THREE from "three";
import { camera } from "./scene.js";

// ==========================================
// 🔊 SISTEMA DE ÁUDIO
// ==========================================
export const listener = new THREE.AudioListener();
camera.add(listener);

const audioLoader = new THREE.AudioLoader();
export const sonsEfeitos = {};

export const somAmbiente = new THREE.Audio(listener);
audioLoader.load("./audio/musica-fundo.mp3", (buffer) => {
  somAmbiente.setBuffer(buffer);
  somAmbiente.setLoop(true);
  somAmbiente.setVolume(0.35);
  if (!somAmbiente.isPlaying && listener.context.state === "running") {
    somAmbiente.play();
  }
});

const ligarMusicaImediato = () => {
  if (listener.context.state === "suspended") {
    listener.context.resume();
  }
  if (somAmbiente.buffer && !somAmbiente.isPlaying) {
    somAmbiente.play();
    document.removeEventListener("click", ligarMusicaImediato);
    document.removeEventListener("keydown", ligarMusicaImediato);
  }
};
document.addEventListener("click", ligarMusicaImediato);
document.addEventListener("keydown", ligarMusicaImediato);

function estruturarSom(nome, caminho) {
  sonsEfeitos[nome] = new THREE.Audio(listener);
  audioLoader.load(caminho, (buffer) => {
    sonsEfeitos[nome].setBuffer(buffer);
    sonsEfeitos[nome].setVolume(0.5);
  });
}

// DECLARAÇÃO DOS ÁUDIOS DO JOGO
estruturarSom("faca", "./audio/facada.wav");
estruturarSom("pistola", "./audio/pistola.mp3");
estruturarSom("rifle", "./audio/rifle.wav");
estruturarSom("escopeta", "./audio/escopeta.mp3");
estruturarSom("sniper", "./audio/sniper.wav");
estruturarSom("explosao", "./audio/explosao.wav");
estruturarSom("morreu", "./audio/morreu.wav");

// ÁUDIOS DO BOSS
estruturarSom("soco", "./audio/soco.ogg");
estruturarSom("avisos", "./audio/avisos.wav"); // rosnado de aviso da investida
estruturarSom("capote", "./audio/capote.mp3"); // impacto quando a investida acerta
estruturarSom("dorforte", "./audio/dorforte.wav"); // reação a dano maior
estruturarSom("dorfraca", "./audio/dorfraca.wav"); // reação a dano menor
estruturarSom("intro", "./audio/intro.wav"); // rugido de quando ele spawna
estruturarSom("passos", "./audio/passos.wav"); // um passo só — tocado em loop manual no boss.js
estruturarSom("vento", "./audio/vento.mp3"); // whoosh do arremesso de pedra
estruturarSom("pedra-no-chao", "./audio/pedra-no-chao.mp3"); // impacto da pedra (no player ou no chão)

// TEMA DO BOSS — como é música (toca em loop, não é efeito de um tiro só),
// segue o mesmo padrão do somAmbiente em vez de entrar em sonsEfeitos.
export const musicaBoss = new THREE.Audio(listener);
audioLoader.load("./audio/musica-boss.mp3", (buffer) => {
  musicaBoss.setBuffer(buffer);
  musicaBoss.setLoop(true);
  musicaBoss.setVolume(0.4);
});

export function executarSom(nome) {
  if (sonsEfeitos[nome]) {
    if (sonsEfeitos[nome].isPlaying) sonsEfeitos[nome].stop();
    sonsEfeitos[nome].play();
  }
}
