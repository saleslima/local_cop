import L from 'leaflet';
import { v4 as uuidv4 } from 'uuid';
import { pollLocationData, setSessionMetadata } from './mock_api.js';

// Centro inicial do mapa (São Paulo, Brasil)
const DEFAULT_CENTER = [-23.5505, -46.6333]; 
const DEFAULT_ZOOM = 13;

let map;
let marker;
let currentSessionId;
let pollingIntervalId = null;

/**
 * Initializes the tracker view with a link generation button.
 */
export function initializeTracker() {
    const app = document.getElementById('app');
    
    // The main tracker-view is a flex column.
    app.innerHTML = `
        <div id="tracker-view">
            <h1>Rastreador de Localização em Tempo Real</h1>
            <div class="controls" id="link-generator-area">
                <p>Clique abaixo para gerar um novo link de rastreamento de 3 horas:</p>
                <button class="button" id="generate-link-button">Gerar Novo Link</button>
            </div>
            <!-- tracking-display-area needs to be display: flex and flex-direction: column to ensure the map fills the remaining space -->
            <div id="tracking-display-area" style="display: none; flex-direction: column; flex-grow: 1;">
                <div class="controls">
                    <p>Envie este link para o celular alvo. O usuário deverá clicar na imagem para iniciar o compartilhamento:</p>
                    <div class="link-output" id="tracking-link"></div>
                    <button class="button" id="copy-link">Copiar Link</button>
                    <p style="margin-top: 10px;">ID da Sessão: <span id="session-id-display"></span></p>
                    <p id="tracker-status">Aguardando a primeira localização...</p>
                </div>
                <div id="map"></div>
            </div>
        </div>
    `;
    
    document.getElementById('generate-link-button').addEventListener('click', startTrackingSession);
}

/**
 * Generates a new tracking session, updates the UI, and starts polling.
 */
function startTrackingSession() {
    // 1. Cleanup previous session if active
    if (map) {
        // Cleanup previous map instance if regenerating a link (safety measure)
        map.remove(); 
        map = null;
        // Clear previous polling interval
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            pollingIntervalId = null;
        }
    }
    
    // 2. Setup Session
    currentSessionId = uuidv4();  
    
    // Definir expiração para 3 horas (em milissegundos)
    const EXPIRATION_HOURS = 3;
    const EXPIRATION_MS = EXPIRATION_HOURS * 60 * 60 * 1000;
    const expirationTimestamp = Date.now() + EXPIRATION_MS;

    // Armazenar metadados da sessão (Mock: usando LocalStorage)
    setSessionMetadata(currentSessionId, {
        created: Date.now(),
        expires: expirationTimestamp
    });

    // 3. Create and Display Link
    const trackingLink = `${window.location.origin}${window.location.pathname}?session=${currentSessionId}`;
    
    document.getElementById('tracking-link').textContent = trackingLink;
    document.getElementById('session-id-display').textContent = currentSessionId;
    document.getElementById('tracking-display-area').style.display = 'flex';
    document.getElementById('link-generator-area').style.display = 'none';
    
    // Reset status text
    document.getElementById('tracker-status').textContent = 'Sessão ' + currentSessionId + ' iniciada. Aguardando dados do dispositivo alvo (Verificando Mock API)...';


    // 4. Initialize Map and Polling
    initMap();
    startWatchingLocationUpdates(currentSessionId);
    
    // 5. Setup Copy Button (re-bind just in case, though it only needs to be bound once if the element wasn't recreated)
    document.getElementById('copy-link').onclick = () => {
        navigator.clipboard.writeText(trackingLink).then(() => {
            alert('Link copiado para a área de transferência!');
        }).catch(err => {
            console.error('Falha ao copiar:', err);
        });
    };
}

function initMap() {
    map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Marcador inicial
    marker = L.marker(DEFAULT_CENTER).addTo(map)
        .bindPopup("Aguardando localização...")
        .openPopup();
        
    // Garante que o Leaflet calcula o tamanho corretamente após a injeção de conteúdo dinâmico.
    // Isso é crucial para que os tiles carreguem corretamente em layouts dinâmicos e garantam a visibilidade.
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}


// --- SIMULAÇÃO DE RECEBIMENTO DE DADOS (VIA API/Polling) ---
// NOTA IMPORTANTE: Para funcionar em um ambiente web real (cross-device), 
// 'pollLocationData' deve ser substituída por uma chamada real a um endpoint GET/WebSocket 
// que se comunica com o servidor onde o dispositivo alvo enviou os dados.
function startWatchingLocationUpdates(sessionId) {
    const statusEl = document.getElementById('tracker-status');
    console.log(`[Tracker] Monitorando Sessão ID: ${sessionId}`);

    statusEl.textContent = `Sessão ${sessionId} iniciada. Aguardando dados do dispositivo alvo (Verificando Mock API)...`;
    
    // Usamos um polling simples (setInterval) para simular o recebimento de updates
    // da API (que ainda usa LocalStorage para simulação local).
    // Atualiza a cada 5 segundos, conforme solicitado.
    pollingIntervalId = setInterval(async () => {
        const data = await pollLocationData(sessionId);

        if (data) {
            updateMap(data);
        }
    }, 5000); // Verifica a cada 5 segundos
}


/**
 * Updates the map marker with new location data.
 * @param {object} data Location data { latitude, longitude, accuracy, timestamp, address: { ... } }
 */
function updateMap(data) {
    const latlng = [data.latitude, data.longitude];
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    const address = data.address || {};

    if (!marker) {
        marker = L.marker(latlng).addTo(map);
    } else {
        marker.setLatLng(latlng);
    }
    
    // Format address details for display
    const streetInfo = address.street ? `${address.street}${address.number ? ', ' + address.number : ''}` : 'N/A';
    const neighborhood = address.neighborhood || 'N/A';
    const cityStateInfo = address.city && address.state ? `${address.city} - ${address.state}` : address.city || address.state || 'N/A';
    const postcode = address.postcode || 'N/A';


    const popupContent = `
        <b>Localização Atualizada:</b><br>
        Hora: ${timestamp}<br>
        <hr>
        <b>Endereço Estimado:</b><br>
        Rua: ${streetInfo}<br>
        Bairro: ${neighborhood}<br>
        Cidade/Estado: ${cityStateInfo}<br>
        CEP: ${postcode}<br>
        <hr>
        <b>Coordenadas:</b><br>
        Lat: ${data.latitude.toFixed(6)}, Lon: ${data.longitude.toFixed(6)}<br>
        Precisão: ±${data.accuracy.toFixed(1)}m
    `;

    marker.setPopupContent(popupContent).openPopup();

    // Centraliza o mapa na nova localização e aumenta o zoom se necessário
    map.setView(latlng, map.getZoom() > 15 ? map.getZoom() : 15);

    document.getElementById('tracker-status').innerHTML = `
        Localização recebida em: ${timestamp} (Precisão: ${data.accuracy.toFixed(1)}m)<br>
        Endereço: ${streetInfo}, ${cityStateInfo}
    `;
}