// ==========================================
// UTILITÁRIOS
// ==========================================

// Libera a geometria e o(s) material(is) de um objeto 3D e de todos os
// seus filhos (funciona pra Mesh, Line, Group etc — qualquer coisa com
// .geometry/.material). Sem isso, cada scene.remove() deixa a geometria
// e o material na memória da GPU pra sempre (vazamento clássico do
// Three.js). Chamar SEMPRE junto de um scene.remove(objeto).
//
// Por padrão também descarta as texturas (.map) de cada material. Passe
// descartarTexturas: false quando o material usa uma textura COMPARTILHADA
// entre vários objetos (ex: a textura da explosão, carregada uma única vez
// e reusada em toda granada) — senão a primeira explosão a acabar destruiria
// a textura que as próximas ainda precisam.
export function descartarObjeto3D(objeto, { descartarTexturas = true } = {}) {
    objeto.traverse((filho) => {
        if (filho.geometry) {
            filho.geometry.dispose();
        }
        if (filho.material) {
            const materiais = Array.isArray(filho.material) ? filho.material : [filho.material];
            materiais.forEach((mat) => {
                if (descartarTexturas && mat.map) mat.map.dispose();
                mat.dispose();
            });
        }
    });
}
