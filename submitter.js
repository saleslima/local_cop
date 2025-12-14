import { sendLocationData } from './mock_api.js';
import { reverseGeocode } from './geocoding.js';

/**
 * Handles the logic for the device that is being tracked (the submitter).
 * @param {string} sessionId The tracking session ID.
 */
export function initializeSubmitter(sessionId) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="submitter-view">
            <h1>Compartilhamento de Localização</h1>
            <p>Sessão ID: ${sessionId}</p>
            <div id="initial-prompt">
                <h2>Clique na imagem abaixo para liberar o conteúdo.</h2>
                <img id="trigger-image" src="./trigger_image.png" alt="Clique para Continuar" style="width: 150px; height: 150px; cursor: pointer; margin: 20px auto; display: block;">
            </div>
            <div id="tracking-active" style="display: none;">
                <p>Status: <span id="location-status">Aguardando sua resposta de permissão do navegador...</span></p>
                <div class="status" id="location-info"></div>
            </div>
        </div>
    `;

    const initialPromptEl = document.getElementById('initial-prompt');
    const trackingActiveEl = document.getElementById('tracking-active');
    const statusEl = document.getElementById('location-status');
    const infoEl = document.getElementById('location-info');

    let watchId = null;

    /**
     * Simulates sending location data to a server via mock API.
     * NOTE: For real web deployment across devices, 'sendLocationData' must be backed by a server POST endpoint.
     */
    async function sendLocation(position) {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp).toLocaleTimeString();
        
        // 1. Perform Reverse Geocoding
        statusEl.textContent = 'Obtendo endereço...';
        const addressDetails = await reverseGeocode(latitude, longitude);

        const data = {
            sessionId: sessionId,
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy,
            timestamp: position.timestamp,
            address: addressDetails || {} // Include address details
        };
        
        // 2. Send combined data
        statusEl.textContent = 'Enviando dados de localização...';
        const success = await sendLocationData(sessionId, data);

        if (success) {
            statusEl.textContent = 'Compartilhando localização em tempo real.';
            infoEl.className = 'status success';
            
            let addressHtml = '<p>Endereço não encontrado ou serviço indisponível.</p>';
            if (addressDetails && Object.keys(addressDetails).length > 0) {
                // Prioritize displaying structured address information
                const streetInfo = addressDetails.street ? `${addressDetails.street}${addressDetails.number ? ', ' + addressDetails.number : ''}` : 'N/A';
                const cityStateInfo = addressDetails.city && addressDetails.state ? `${addressDetails.city} - ${addressDetails.state}` : addressDetails.city || addressDetails.state || 'N/A';
                
                addressHtml = `
                    <p><strong>CEP:</strong> ${addressDetails.postcode || 'N/A'}</p>
                    <p><strong>Rua:</strong> ${streetInfo}</p>
                    <p><strong>Bairro:</strong> ${addressDetails.neighborhood || 'N/A'}</p>
                    <p><strong>Cidade/Estado:</strong> ${cityStateInfo}</p>
                `;
            }

            infoEl.innerHTML = `
                <p>Localização enviada com sucesso!</p>
                <p>Última atualização: ${timestamp}</p>
                <h3>Coordenadas:</h3>
                <p>Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}</p>
                <p>Precisão: ${accuracy.toFixed(1)} metros</p>
                <h3>Endereço Estimado:</h3>
                ${addressHtml}
            `;
        } else {
            infoEl.className = 'status error';
            infoEl.innerHTML = `<p>Falha ao enviar localização (Erro de simulação de rede).</p>`;
        }
    }

    function handleGeolocationError(error) {
        console.error("Erro de Geolocalização:", error);
        statusEl.textContent = 'Erro ao obter localização.';
        infoEl.className = 'status error';

        let errorMessage = 'Ocorreu um erro desconhecido.';
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = "Permissão de localização negada. Por favor, recarregue a página e aceite a permissão.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = "A informação de localização está indisponível.";
                break;
            case error.TIMEOUT:
                errorMessage = "A requisição para obter a localização expirou.";
                break;
        }
        infoEl.innerHTML = `<p>ERRO: ${errorMessage}</p>`;

        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
    }

    function startGeolocation() {
        // Removemos o requisito de clique explícito para iniciar, para tornar a página de rastreamento mais passiva.
        // O navegador irá exibir o prompt de permissão automaticamente assim que a página for carregada.
        
        if (navigator.geolocation) {
            statusEl.textContent = 'Aguardando sua resposta de permissão do navegador...';

            // Inicia o monitoramento contínuo da posição. Isso irá disparar o prompt de permissão.
            // Inicia o monitoramento contínuo da posição. Isso irá disparar o prompt de permissão.
            // Configurando maximumAge: 5000 (5 segundos) garante que o navegador tentará buscar 
            // uma nova posição se a última tiver mais de 5 segundos, garantindo a frequência de atualização solicitada.
            watchId = navigator.geolocation.watchPosition(
                // Success Callback: handles location update and UI transition
                (position) => {
                    // O rastreamento começou.
                    statusEl.textContent = 'Compartilhando localização em tempo real.';
                    sendLocation(position);
                }, 
                // Error Callback
                handleGeolocationError, 
                { 
                    enableHighAccuracy: true, 
                    // Aumentamos o timeout para garantir que haja tempo suficiente para obter uma correção de alta precisão.
                    timeout: 10000, 
                    // maximumAge força uma nova atualização se a última for mais antiga que 5 segundos (5000ms).
                    maximumAge: 5000 
                }
            );

            window.addEventListener('beforeunload', () => {
                if (watchId) {
                    navigator.geolocation.clearWatch(watchId);
                }
            });

        } else {
            statusEl.textContent = 'Geolocalização não é suportada por este navegador.';
            infoEl.className = 'status error';
            infoEl.innerHTML = `<p>Seu dispositivo não suporta Geolocalização.</p>`;
        }
    }
    
    // Inicia a tentativa de rastreamento imediatamente ao carregar a página.
    // startGeolocation();
    document.getElementById('trigger-image').addEventListener('click', () => {
        initialPromptEl.style.display = 'none';
        trackingActiveEl.style.display = 'block';
        startGeolocation();
    });
}