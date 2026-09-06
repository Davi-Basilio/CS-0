// ==========================================
// TECLAS DE MOVIMENTO
// ==========================================
export const teclas = { w: false, a: false, s: false, d: false, shift: false, space: false };
export const velocidadeCaminhar = 0.12;
export const velocidadeCorrer = 0.22;

window.addEventListener('keydown', (e) => {
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
