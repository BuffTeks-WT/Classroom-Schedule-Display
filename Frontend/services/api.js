// Use a local proxy so frontend never needs to know the backend URL.
async function getReservations(query = '') {
    try {
        const url = `/proxy/reservations${query ? '?' + query : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch reservations via proxy:", error);
        return null;
    }
}

async function createReservation(payload) {
    try {
        const response = await fetch('/proxy/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.status === 201 || response.ok) {
            return { success: true };
        }
        const text = await response.text();
        return { success: false, error: text };
    } catch (error) {
        console.error('Failed to create reservation via proxy:', error);
        return { success: false, error: error.message };
    }
}

async function updateReservation(reservationId, payload) {
    try {
        const response = await fetch(`/proxy/reservations/${reservationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            return { success: true };
        }
        const text = await response.text();
        return { success: false, error: text };
    } catch (error) {
        console.error(`Failed to update reservation ${reservationId} via proxy:`, error);
        return { success: false, error: error.message };
    }
}

async function deleteReservation(reservationId) {
    try {
        const response = await fetch(`/proxy/reservations/${reservationId}`, {
            method: 'DELETE'
        });
        if (response.status === 204 || response.ok) {
            return { success: true };
        }
        const text = await response.text();
        return { success: false, error: text };
    } catch (error) {
        console.error(`Failed to delete reservation ${reservationId} via proxy:`, error);
        return { success: false, error: error.message };
    }
}
