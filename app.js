import { initializeTracker } from './tracker.js';
import { initializeSubmitter } from './submitter.js';

function getUrlParameter(name) {
    name = name.replace(/[\\[]/, '\\[').replace(/[\\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * Checks if the session ID is valid and has not expired. (3 hours limit)
 * Note: Uses LocalStorage for mock validation.
 */
function checkSessionValidity(sessionId) {
    const metadataKey = `session_metadata_${sessionId}`;
    const storedData = localStorage.getItem(metadataKey);
    const LOCATION_PREFIX = 'location_session_'; // Defined in mock_api, repeated here for cleanup

    if (!storedData) {
        return { isValid: false, message: 'Sessão de rastreamento não encontrada.' };
    }

    try {
        const metadata = JSON.parse(storedData);
        if (metadata.expires && metadata.expires < Date.now()) {
            // Limpa os dados mockados no LocalStorage se a sessão expirou
            localStorage.removeItem(metadataKey); 
            localStorage.removeItem(`${LOCATION_PREFIX}${sessionId}`);
            return { isValid: false, message: 'O link de rastreamento expirou (Limite de 3 horas).' };
        }
        return { isValid: true };
    } catch (e) {
        return { isValid: false, message: 'Erro ao processar dados da sessão.' };
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Verifica se há um parâmetro de sessão na URL
    const sessionId = getUrlParameter('session');
    const app = document.getElementById('app');

    if (sessionId) {
        // Modo 2: Submissor (Celular alvo)
        console.log("Modo: Submissão de Localização. Session ID:", sessionId);
        
        const validation = checkSessionValidity(sessionId);

        if (validation.isValid) {
            // O submitter vai pedir permissão de localização e tentar enviar os dados.
            initializeSubmitter(sessionId);
        } else {
            // Exibe mensagem de erro de expiração ou sessão inválida
            app.innerHTML = `
                <div id="expiration-view" style="padding: 20px; text-align: center;">
                    <h1>Link Expirado ou Inválido</h1>
                    <p style="color: #721c24; margin-top: 15px; background-color: #f8d7da; padding: 10px; border-radius: 5px;">${validation.message}</p>
                    <p style="margin-top: 20px;">Por favor, solicite um novo link ao rastreador.</p>
                </div>
            `;
        }

    } else {
        // Modo 1: Rastreador (Gerador de link e Visualizador de Mapa)
        console.log("Modo: Rastreador/Gerador de Link.");
        // O tracker gera o link e espera pelos dados.
        initializeTracker();
    }
});