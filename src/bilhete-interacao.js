import { camera } from "./scene.js";
import { controles } from "./controles.js";
import { estadoJogo } from "./estado.js";
import { telaIntro, telaCapitulo2, telaBilhete, avisoAcao } from "./ui.js";
import { objPapel } from "./bilhete3d.js";
import { spawnarBoss } from "./boss.js";
import { spawnarCaixaCapitulo2 } from "./caixas.js";

// ==========================================
// TELA INICIAL / CAPÍTULO 2 (ESPAÇO) E INTERAÇÃO COM O BILHETE (TECLA E)
// ==========================================
window.addEventListener("keydown", (e) => {
  // TELA INICIAL (BRIEFING) OU TELA DO CAPÍTULO 2 — as duas usam a mesma
  // pausa geral (introducaoAtiva) e a mesma tecla; só muda qual tela some
  // e o que acontece em seguida
  if (estadoJogo.introducaoAtiva && e.key === " ") {
    estadoJogo.introducaoAtiva = false;
    if (telaCapitulo2.style.display === "flex") {
      telaCapitulo2.style.display = "none";
      controles.lock();
      spawnarCaixaCapitulo2();
    } else {
      telaIntro.style.display = "none";
      controles.lock();
    }
    return;
  }

  // INTERAÇÃO COM O BILHETE (TECLA E)
  if (
    e.key.toLowerCase() === "e" &&
    !estadoJogo.introducaoAtiva &&
    estadoJogo.saúdePlayer > 0
  ) {
    const distAoBilhete = camera.position.distanceTo(objPapel.position);
    if (!estadoJogo.lendoBilhete && distAoBilhete < 3.5 && objPapel.visible) {
      estadoJogo.lendoBilhete = true;
      controles.unlock();
      telaBilhete.style.display = "block";
      avisoAcao.style.display = "none";
      spawnarBoss(); // o boss aparece enquanto o player tá distraído lendo
    } else if (estadoJogo.lendoBilhete) {
      estadoJogo.lendoBilhete = false;
      telaBilhete.style.display = "none";
      objPapel.visible = false; // já cumpriu o papel dele, some do mapa
      controles.lock();
    }
  }
});
