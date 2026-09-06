import { estadoJogo, inventario, estadoArmas } from "./estado.js";
import { somAmbiente, executarSom } from "./audio.js";
import { controles } from "./controles.js";
import { updateVisualArma } from "./armas-visuais.js";

// ==========================================
// INTERFACES (INTRODUÇÃO, MORTE E BILHETE)
// ==========================================

// TELA DE BRIEFING (ESTILO CS 1.6)
export const telaIntro = document.createElement("div");
telaIntro.style.position = "absolute";
telaIntro.style.top = "0";
telaIntro.style.left = "0";
telaIntro.style.width = "100%";
telaIntro.style.height = "100%";
telaIntro.style.backgroundColor = "rgba(25, 27, 25, 0.95)";
telaIntro.style.color = "#df9b00";
telaIntro.style.fontFamily = '"Courier New", Courier, monospace';
telaIntro.style.display = "flex";
telaIntro.style.flexDirection = "column";
telaIntro.style.justifyContent = "center";
telaIntro.style.alignItems = "center";
telaIntro.style.textAlign = "center";
telaIntro.style.padding = "40px";
telaIntro.style.zIndex = "500";

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

// TELA DE BRIEFING DO CAPÍTULO 2 (pós-boss) — mesmo estilo da tela inicial,
// cor diferente (azul/ciano) só pra sinalizar visualmente que é outro momento
export const telaCapitulo2 = document.createElement("div");
telaCapitulo2.style.position = "absolute";
telaCapitulo2.style.top = "0";
telaCapitulo2.style.left = "0";
telaCapitulo2.style.width = "100%";
telaCapitulo2.style.height = "100%";
telaCapitulo2.style.backgroundColor = "rgba(25, 27, 25, 0.95)";
telaCapitulo2.style.color = "#00c8df";
telaCapitulo2.style.fontFamily = '"Courier New", Courier, monospace';
telaCapitulo2.style.display = "none";
telaCapitulo2.style.flexDirection = "column";
telaCapitulo2.style.justifyContent = "center";
telaCapitulo2.style.alignItems = "center";
telaCapitulo2.style.textAlign = "center";
telaCapitulo2.style.padding = "40px";
telaCapitulo2.style.zIndex = "500";

telaCapitulo2.innerHTML = `
    <div style="border: 3px double #00c8df; padding: 30px; max-width: 700px; background-color: #1c1e1c; box-shadow: 0 0 15px rgba(0,200,223,0.2);">
        <h1 style="font-size: 28px; margin-bottom: 20px; letter-spacing: 2px;">• NOVA ORDEM DA LA •</h1>
        <p style="font-size: 18px; line-height: 1.6; text-align: left; margin-bottom: 30px;">
            A defesa geral da LA caíram drasticamente, mas ainda assim as coisas podem ficar um pouco difíceis daqui pra frente, então enviamos uma melhoria para suas armas e um colete melhor, então a partir de agora boa sorte!
        </p>
        <h3 style="animation: piscar2 1s infinite; color: #ffffff; letter-spacing: 1px;">PRESSIONE ESPAÇO PARA CONTINUAR</h3>
    </div>
    <style>
        @keyframes piscar2 { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    </style>
`;
document.body.appendChild(telaCapitulo2);

// TELA DE MORTE
const telaMorte = document.createElement("div");
telaMorte.style.position = "absolute";
telaMorte.style.top = "0";
telaMorte.style.left = "0";
telaMorte.style.width = "100%";
telaMorte.style.height = "100%";
telaMorte.style.background =
  "radial-gradient(circle, rgba(40,0,0,0.95) 0%, rgba(10,0,0,1) 100%)";
telaMorte.style.color = "#ff3333";
telaMorte.style.fontFamily = "monospace";
telaMorte.style.display = "none";
telaMorte.style.flexDirection = "column";
telaMorte.style.justifyContent = "center";
telaMorte.style.alignItems = "center";
telaMorte.style.zIndex = "600";

telaMorte.innerHTML = `
    <h1 style="font-size: 45px; text-shadow: 0 0 10px #ff0000; margin-bottom: 10px; font-weight: bold;">VOCÊ MORREU!</h1>
    <p style="color: #aaaaaa; font-size: 20px; margin-bottom: 30px;">Agora você tem que começar de novo!</p>
    <button id="btnReiniciar" style="background-color: transparent; border: 2px solid #ff3333; color: #ff3333; padding: 12px 30px; font-size: 18px; font-family: monospace; cursor: pointer; font-weight: bold; transition: 0.3s;">
        REINICIAR OPERAÇÃO
    </button>
`;
document.body.appendChild(telaMorte);

document.getElementById("btnReiniciar").addEventListener("click", () => {
  location.reload();
});

// INTERFACE DO BILHETE (CHEFE)
export const telaBilhete = document.createElement("div");
telaBilhete.style.position = "absolute";
telaBilhete.style.top = "50%";
telaBilhete.style.left = "50%";
telaBilhete.style.transform = "translate(-50%, -50%)";
telaBilhete.style.width = "90%";
telaBilhete.style.maxWidth = "620px";
telaBilhete.style.backgroundColor = "#e2d3b4";
telaBilhete.style.color = "#1a1105";
telaBilhete.style.fontFamily = '"Courier New", Courier, monospace';
telaBilhete.style.fontSize = "22px";
telaBilhete.style.fontWeight = "bold";
telaBilhete.style.padding = "40px";
telaBilhete.style.border = "4px solid #4a3621";
telaBilhete.style.boxShadow = "0 0 30px rgba(0,0,0,0.9)";
telaBilhete.style.display = "none";
telaBilhete.style.zIndex = "700";
telaBilhete.style.textAlign = "center";
telaBilhete.style.lineHeight = "1.5";
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
export const containerHPs = document.createElement("div");
containerHPs.style.position = "absolute";
containerHPs.style.top = "0";
containerHPs.style.left = "0";
containerHPs.style.width = "100%";
containerHPs.style.height = "100%";
containerHPs.style.pointerEvents = "none";
containerHPs.style.zIndex = "90";
document.body.appendChild(containerHPs);

const mira = document.createElement("div");
mira.style.position = "absolute";
mira.style.top = "50%";
mira.style.left = "50%";
mira.style.width = "6px";
mira.style.height = "6px";
mira.style.backgroundColor = "#ffffff";
mira.style.borderRadius = "50%";
mira.style.transform = "translate(-50%, -50%)";
mira.style.pointerEvents = "none";
mira.style.zIndex = "100";
document.body.appendChild(mira);

export const escopo = document.createElement("div");
escopo.style.position = "absolute";
escopo.style.top = "0";
escopo.style.left = "0";
escopo.style.width = "100%";
escopo.style.height = "100%";
escopo.style.background =
  "radial-gradient(circle, transparent 25%, rgba(0,0,0,0.85) 26%)";
escopo.style.pointerEvents = "none";
escopo.style.display = "none";
escopo.style.zIndex = "99";
document.body.appendChild(escopo);

export const avisoMira = document.createElement("div");
avisoMira.style.position = "absolute";
avisoMira.style.top = "50%";
avisoMira.style.right = "40px";
avisoMira.style.color = "#ffffff";
avisoMira.style.fontFamily = "monospace";
avisoMira.style.fontSize = "18px";
avisoMira.style.fontWeight = "bold";
avisoMira.style.transform = "translateY(-50%)";
avisoMira.style.textShadow = "2px 2px #000000";
avisoMira.style.display = "none";
avisoMira.style.zIndex = "100";
avisoMira.innerText = "BOTÃO DIREITO: LUPA DE PRECISÃO";
document.body.appendChild(avisoMira);

export const avisoCaixa = document.createElement("div");
avisoCaixa.style.position = "absolute";
avisoCaixa.style.top = "50%";
avisoCaixa.style.left = "40px";
avisoCaixa.style.color = "#ffffff";
avisoCaixa.style.fontFamily = "monospace";
avisoCaixa.style.fontSize = "18px";
avisoCaixa.style.fontWeight = "bold";
avisoCaixa.style.transform = "translateY(-50%)";
avisoCaixa.style.textShadow = "2px 2px #000000";
avisoCaixa.style.display = "none";
avisoCaixa.style.zIndex = "100";
avisoCaixa.innerText = "ATAQUE COM A FACA PARA QUEBRAR A CAIXA";
document.body.appendChild(avisoCaixa);

export const avisoAcao = document.createElement("div");
avisoAcao.style.position = "absolute";
avisoAcao.style.top = "62%";
avisoAcao.style.left = "50%";
avisoAcao.style.transform = "translateX(-50%)";
avisoAcao.style.color = "#ffee88";
avisoAcao.style.fontFamily = "monospace";
avisoAcao.style.fontSize = "20px";
avisoAcao.style.fontWeight = "bold";
avisoAcao.style.textShadow = "2px 2px #000000";
avisoAcao.style.display = "none";
avisoAcao.style.zIndex = "100";
document.body.appendChild(avisoAcao);

const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.bottom = "20px";
hud.style.left = "20px";
hud.style.color = "#00ffff";
hud.style.fontFamily = "monospace";
hud.style.fontSize = "24px";
hud.style.fontWeight = "bold";
hud.style.textShadow = "2px 2px #000000";
hud.style.zIndex = "100";
document.body.appendChild(hud);

export function updateHUD() {
  const weapon = inventario[estadoArmas.armaAtualIndex];
  const ammo = weapon.munição === Infinity ? "∞" : weapon.munição;
  hud.innerHTML = `KILLS: ${estadoJogo.kills} | SAÚDE: ${estadoJogo.saúdePlayer} | ${weapon.nome.toUpperCase()} [${ammo}]`;
  updateVisualArma();
}

export function verificarMortePlayer() {
  if (estadoJogo.saúdePlayer <= 0) {
    controles.unlock();
    if (somAmbiente && somAmbiente.isPlaying) {
      somAmbiente.stop();
    }
    executarSom("morreu");
    telaMorte.style.display = "flex";
  }
}
