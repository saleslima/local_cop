/**
 * Utility module to simulate network API calls for location sharing.
 * 
 * IMPORTANT NOTE FOR WEB HOSTING:
 * In a real deployment (necessary for cross-device tracking), these functions 
 * MUST interact with a live server backend (e.g., using fetch to POST/GET data 
 * to a database).
 * 
 * Here, we use LocalStorage to maintain functionality across different tabs 
 * within the same browser session for demonstration purposes.
 */

const LOCATION_PREFIX = 'location_session_';
const METADATA_PREFIX = 'metadata_session_'; // New prefix for metadata storage

/**
 * Simulates sending location data to a server.
 * In reality, this would be a POST request.
 * @param {string} sessionId 
 * @param {object} data Location data
 * @returns {Promise<boolean>}
 */
export async function sendLocationData(sessionId, data) {
    const key = `${LOCATION_PREFIX}${sessionId}`;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50)); 

    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[Mock API] Data sent/stored for session ${sessionId}`);
        return true;
    } catch (e) {
        console.error(`[Mock API] Error saving data for session ${sessionId}:`, e);
        return false;
    }
}

/**
 * Simulates polling location data from a server.
 * In reality, this would be a GET request or handled via WebSockets.
 * @param {string} sessionId 
 * @returns {Promise<object | null>} Location data or null
 */
export async function pollLocationData(sessionId) {
    const key = `${LOCATION_PREFIX}${sessionId}`;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const storedData = localStorage.getItem(key);
    
    if (storedData) {
        try {
            const data = JSON.parse(storedData);
            return data;
        } catch (error) {
            console.error("[Mock API] Error parsing stored data:", error);
            return null;
        }
    }
    return null;
}


/**
 * Simulates storing session metadata (like expiration time) to the server.
 * @param {string} sessionId 
 * @param {object} metadata Metadata object (e.g., { created, expires })
 * @returns {Promise<boolean>}
 */
export async function setSessionMetadata(sessionId, metadata) {
    const key = `${METADATA_PREFIX}${sessionId}`;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        localStorage.setItem(key, JSON.stringify(metadata));
        console.log(`[Mock API] Metadata set for session ${sessionId}`);
        return true;
    } catch (e) {
        console.error(`[Mock API] Error saving metadata for session ${sessionId}:`, e);
        return false;
    }
}

/**
 * Simulates retrieving session metadata from the server.
 * @param {string} sessionId 
 * @returns {Promise<object | null>} Metadata object or null
 */
export async function getSessionMetadata(sessionId) {
    const key = `${METADATA_PREFIX}${sessionId}`;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const storedData = localStorage.getItem(key);
    
    if (storedData) {
        try {
            return JSON.parse(storedData);
        } catch (error) {
            console.error("[Mock API] Error parsing stored metadata:", error);
            return null;
        }
    }
    return null;
}

/**
 * Cleans up session data (both location and metadata).
 * @param {string} sessionId
 */
export function cleanupSession(sessionId) {
    localStorage.removeItem(`${LOCATION_PREFIX}${sessionId}`);
    localStorage.removeItem(`${METADATA_PREFIX}${sessionId}`);
    console.log(`[Mock API] Cleaned up session ${sessionId}`);
}

