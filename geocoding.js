/**
 * Utility module for reverse geocoding using OpenStreetMap Nominatim API.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

/**
 * Performs reverse geocoding to get address details from coordinates.
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise<object | null>} Address components or null on failure.
 */
export async function reverseGeocode(lat, lon) {
    // We request addressdetails=1 to get components and zoom=18 for high detail
    const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Nominatim API returned status: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data && data.address) {
            const address = data.address;
            
            // Mapping relevant fields from Nominatim response, prioritizing common Portuguese/Brazilian terms
            const result = {
                // Street and number
                street: address.road || address.pedestrian || address.street || '',
                number: address.house_number || '',
                
                // Neighborhood/Bairro
                neighborhood: address.suburb || address.quarter || address.village || address.city_district || '',

                // City/Município
                city: address.city || address.town || address.village || address.municipality || '',

                // State/Estado
                state: address.state || '',

                // CEP/Postal code
                postcode: address.postcode || '',
                
                // Full formatted address for fallback/display
                display_name: data.display_name
            };
            
            // Clean up empty fields in the final result object
            Object.keys(result).forEach(key => result[key] === '' && delete result[key]);
            
            return result;
        }
        
        return null;

    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
}

