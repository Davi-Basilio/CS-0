import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { camera } from "./scene.js";
import { estadoJogo } from "./estado.js";

// ==========================================
// CONTROLES DE CÂMERA (POINTER LOCK)
// ==========================================
export const controles = new PointerLockControls(camera, document.body);

// SENSIBILIDADE DA CÂMERA: o PointerLockControls já expõe essa propriedade
// pronta pra isso (padrão é 1.0 = sensibilidade "crua" do mouse do sistema).
// Já tava em 0.6 (~40% mais lento); baixei mais um pouco pra 0.45.
controles.pointerSpeed = 0.45;

document.addEventListener("click", () => {
  if (
    !estadoJogo.introducaoAtiva &&
    estadoJogo.saúdePlayer > 0 &&
    !estadoJogo.lendoBilhete
  ) {
    controles.lock();
  }
});
