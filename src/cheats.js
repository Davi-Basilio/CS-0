import { scene } from './scene.js';
import { estadoJogo, alvosInimigos } from './estado.js';
import { containerHPs, updateHUD } from './ui.js';

// ==========================================
// ATALHO DE DEBUG (ALT+K) — mata instantaneamente
// os inimigos e para de nascer gente nova
// ==========================================
window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'k') {
        estadoJogo.kills = 20;

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
});
