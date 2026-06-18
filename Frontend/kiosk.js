// WTAMU Classroom Schedule Display 2025 - Kiosk Logic
const roomMap = {
    "1": { name: "CC 101", building: "Classroom Center", capacity: 30 },
    "2": { name: "CC 102", building: "Classroom Center", capacity: 28 },
    "3": { name: "CC 103", building: "Classroom Center", capacity: 22 },
    "4": { name: "CC 210", building: "Classroom Center", capacity: 35 },
    "5": { name: "ILC 214", building: "Interactive Learning Center", capacity: 40 },
    "6": { name: "ILC 305", building: "Interactive Learning Center", capacity: 25 },
    "7": { name: "ILC 320", building: "Interactive Learning Center", capacity: 30 },
    "8": { name: "AG 302", building: "Agriculture Sciences Complex", capacity: 20 },
    "9": { name: "AG 303", building: "Agriculture Sciences Complex", capacity: 18 },
    "10": { name: "JBK 118", building: "Jack B. Kelley Student Center", capacity: 100 },
    "11": { name: "JBK 120", building: "Jack B. Kelley Student Center", capacity: 80 },
    "12": { name: "MMNH 105", building: "Mary Moody Northen Hall", capacity: 30 },
    "13": { name: "MMNH 106", building: "Mary Moody Northen Hall", capacity: 28 },
    "14": { name: "BBC 304", building: "Buff Business Center", capacity: 55 },
    "15": { name: "ECS 201", building: "Engineering & Computer Science Building", capacity: 28 }
};

let currentRoomId = null;
let refreshIntervalId = null;
let smartRefreshTimeoutId = null;
let clickCount = 0;
let clickTimer = null;
let mockPreviewActive = false;
let previewOffsetMs = 0;   // simulated-time offset (ms) used by kiosk preview mode
let isPreviewMode = false;

// Returns the effective "current" time. In preview mode this is shifted so the
// kiosk renders as if the previewed reservation were happening right now.
function getNow() {
    return new Date(Date.now() + previewOffsetMs);
}

document.addEventListener('DOMContentLoaded', () => {
    resolveRoomContext();
    setupClock();
    setupAdminView();
    setupTransitions();
});

// 1. Resolve classroom context via query parameters or local storage cache
function resolveRoomContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramRoomId = urlParams.get('room_id');

    if (paramRoomId && roomMap[paramRoomId]) {
        localStorage.setItem('kiosk_room_id', paramRoomId);
        currentRoomId = paramRoomId;
    } else {
        const cachedRoomId = localStorage.getItem('kiosk_room_id');
        if (cachedRoomId && roomMap[cachedRoomId]) {
            currentRoomId = cachedRoomId;
        }
    }

    // Preview mode: shift the kiosk clock to a specific reservation time so the
    // in-session layout can be previewed outside of the real scheduled hours.
    const previewParam = urlParams.get('preview');
    if (previewParam) {
        const previewDate = new Date(previewParam);
        if (!isNaN(previewDate.getTime())) {
            previewOffsetMs = previewDate.getTime() - Date.now();
            isPreviewMode = true;
        }
    }

    const setupView = document.getElementById('setup-view');
    const activeView = document.getElementById('active-view');

    if (currentRoomId) {
        setupView.style.display = 'none';
        activeView.style.display = 'flex';
        initKioskMode(currentRoomId);
        if (isPreviewMode) showPreviewBanner();
    } else {
        activeView.style.display = 'none';
        setupView.style.display = 'flex';
    }
}

// Injects a thin banner so it is clear this is a simulated preview, not the live kiosk.
function showPreviewBanner() {
    if (document.getElementById('kiosk-preview-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'kiosk-preview-banner';
    banner.innerHTML = `<span><strong>PREVIEW MODE</strong> &nbsp; Simulated view of this reservation in session. Not the live room display.</span><a href="kiosk.html?room_id=${currentRoomId}">Exit preview</a>`;
    Object.assign(banner.style, {
        position: 'fixed', top: '0', left: '0', right: '0', zIndex: '3000',
        background: '#cfad4c', color: '#450012',
        font: '600 14px/1.4 system-ui, -apple-system, sans-serif',
        padding: '8px 16px', display: 'flex', gap: '16px',
        alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap'
    });
    const link = banner.querySelector('a');
    if (link) {
        Object.assign(link.style, { color: '#450012', fontWeight: '700', textDecoration: 'underline', whiteSpace: 'nowrap' });
    }
    document.body.appendChild(banner);
}

// 2. Setup standard ticking clock (Day, Date, time with running seconds)
function setupClock() {
    const dayLabel = document.getElementById('kiosk-clock-day');
    const timeLabel = document.getElementById('kiosk-clock-time');

    function tick() {
        const now = getNow();
        
        // Format Day (e.g. "Friday, May 22")
        const dayOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        dayLabel.textContent = now.toLocaleDateString('en-US', dayOptions);

        // Format Time (e.g. "02:35:29 PM")
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        timeLabel.textContent = now.toLocaleTimeString('en-US', timeOptions);
    }

    tick();
    setInterval(tick, 1000);
}

// 3. Bind admin room selection grid and building filter pills
function setupAdminView() {
    const roomButtons = document.querySelectorAll('.kiosk-room-btn');
    roomButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = btn.getAttribute('data-room-id');
            if (roomMap[roomId]) {
                localStorage.setItem('kiosk_room_id', roomId);
                window.location.href = `kiosk.html?room_id=${roomId}`;
            }
        });
    });

    // Setup interactive building/college filter pills
    const filterPills = document.querySelectorAll('.kiosk-filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Toggle active styling states
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filterValue = pill.getAttribute('data-filter');
            roomButtons.forEach(btn => {
                const roomBuilding = btn.getAttribute('data-building');
                if (filterValue === 'all' || roomBuilding === filterValue) {
                    btn.style.display = 'block';
                } else {
                    btn.style.display = 'none';
                }
            });
        });
    });
}

// 4. Bind action triggers (Reserve button, Exit Home button, Done button, and hidden reset shortcut)
function setupTransitions() {
    const reserveBtn = document.getElementById('kiosk-reserve-btn');
    const doneBtn = document.getElementById('kiosk-done-btn');
    const previewBtn = document.getElementById('kiosk-preview-btn');
    const roomLabel = document.getElementById('kiosk-room-label');
    const exitBtn = document.getElementById('kiosk-exit-btn');

    const scheduleView = document.getElementById('kiosk-schedule-view');
    const qrView = document.getElementById('kiosk-qr-view');

    // Toggle QR code overlay view
    reserveBtn.addEventListener('click', () => {
        scheduleView.style.display = 'none';
        qrView.style.display = 'flex';
        generateBookingQR();
    });

    doneBtn.addEventListener('click', () => {
        qrView.style.display = 'none';
        scheduleView.style.display = 'flex';
    });

    // Exit Home back to dashboard index
    exitBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Mock the dynamic preview slot injection
    previewBtn.addEventListener('click', () => {
        mockPreviewActive = true;
        alert("✨ Mock Event Preview Activated!\nWe have injected a simulated 'Mobile Reservation Draft' into your next events listing. Scan the QR code to finish your real booking!");
        qrView.style.display = 'none';
        scheduleView.style.display = 'flex';
        fetchKioskSchedule(currentRoomId);

        // Auto remove mock draft after 15 seconds to keep it tidy
        setTimeout(() => {
            mockPreviewActive = false;
            fetchKioskSchedule(currentRoomId);
        }, 15000);
    });

    // Hidden admin reset shortcut (Click room header 5 times in 3 seconds to unbind room)
    roomLabel.addEventListener('click', () => {
        clickCount++;
        
        if (clickTimer) clearTimeout(clickTimer);
        
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 3000);

        if (clickCount >= 5) {
            if (confirm("⚠️ System Administrator Command:\nDo you want to reset this kiosk's classroom binding and return to setup mode?")) {
                localStorage.removeItem('kiosk_room_id');
                window.location.href = 'kiosk.html';
            }
            clickCount = 0;
        }
    });
}

// 5. Initialize Kiosk displays for the resolved classroom context
function initKioskMode(roomId) {
    const classroom = roomMap[roomId];
    
    // Set headers
    document.getElementById('kiosk-room-label').textContent = `Room ${classroom.name}`;
    document.getElementById('kiosk-qr-room-name').textContent = classroom.name;

    // Load active schedule records
    fetchKioskSchedule(roomId);

    // Safety poll every 60 seconds as a fallback (smart refresh handles precise transitions)
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    if (smartRefreshTimeoutId) clearTimeout(smartRefreshTimeoutId);
    refreshIntervalId = setInterval(() => {
        fetchKioskSchedule(roomId);
    }, 60000);
}

// 6. Generate Reservation QR Code pointing dynamically to reservation portal
function generateBookingQR() {
    const qrImage = document.getElementById('kiosk-qr-image');
    
    // Generate portable landing URL pointing to reservation portal preloaded with active room ID
    const destinationUrl = `${window.location.origin}${window.location.pathname.replace('kiosk.html', 'reservation.html')}?room_id=${currentRoomId}`;
    
    // Pull QR Code image from public secure qrserver API (180x180 px size, high correction scale)
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(destinationUrl)}&ecc=M&margin=0`;
}

// 7. Core Schedule Parser: Filters reservations, maps active event, and renders upcoming agenda list
async function fetchKioskSchedule(roomId) {
    const classroom = roomMap[roomId];
    const nextListContainer = document.getElementById('kiosk-next-list');
    const reserveCtaBtn = document.getElementById('kiosk-reserve-btn');
    
    // Fetch all active reservations
    const reservations = await getReservations();
    
    if (!reservations) {
        setRoomAvailableState(classroom.name);
        nextListContainer.innerHTML = '<p class="no-data" style="color:#555; text-align:center; padding: 20px;">Could not fetch schedules. Retrying...</p>';
        return;
    }

    // Filter active reservations bound strictly to this specific room number and date bounds
    const now = getNow();
    const todayStr = now.toISOString().split('T')[0];

    let roomReservations = reservations.filter(r => 
        r.room_id === parseInt(roomId, 10) && 
        r.reservation_status.toLowerCase() !== 'cancelled'
    );

    // Filter only events occurring today or in the future
    roomReservations = roomReservations.filter(r => {
        const end = new Date(r.endTime);
        return end >= now || r.startTime.startsWith(todayStr);
    });

    // Inject temporary mock preview reservation if active
    if (mockPreviewActive) {
        const mockStart = new Date(now.getTime() + (10 * 60 * 1000)); // +10 minutes
        const mockEnd = new Date(now.getTime() + (70 * 60 * 1000));  // +70 minutes
        
        roomReservations.push({
            event_title: "📱 Mobile Reservation Draft",
            host_name: "Pending Confirmation",
            startTime: mockStart.toISOString(),
            endTime: mockEnd.toISOString(),
            reservation_status: "pending"
        });
    }

    // Sort by chronological start time
    roomReservations.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Find the CURRENT event
    let currentEvent = null;
    let nextEvents = [];

    roomReservations.forEach(r => {
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);
        
        if (now >= start && now <= end) {
            currentEvent = r;
        } else if (start > now) {
            nextEvents.push(r);
        }
    });

    // A. Render Left Maroon Panel (Current State)
    const statusLabel = document.getElementById('kiosk-current-status');
    const timeLabel = document.getElementById('kiosk-current-time');
    const titleLabel = document.getElementById('kiosk-current-title');
    const hostLabel = document.getElementById('kiosk-current-host');
    const qrContainer = document.getElementById('kiosk-available-qr-container');
    const qrImage = document.getElementById('kiosk-available-qr-image');

    if (currentEvent) {
        statusLabel.textContent = "IN USE";
        statusLabel.style.color = "#cfad4c"; // Gold
        if (timeLabel) {
            timeLabel.style.display = 'block';
            timeLabel.textContent = `${formatKioskTime(currentEvent.startTime)} - ${formatKioskTime(currentEvent.endTime)}`;
        }
        titleLabel.textContent = currentEvent.event_title;
        hostLabel.textContent = `Instructor: ${currentEvent.host_name}`;
        if (qrContainer) qrContainer.style.display = 'none';
    } else {
        // Classroom is currently unoccupied
        statusLabel.textContent = "AVAILABLE";
        statusLabel.style.color = "#2ecc71"; // Fresh green for available status
        if (timeLabel) {
            timeLabel.style.display = 'none'; // Remove ugly "-- : --" time stamp when available
        }
        titleLabel.textContent = "Room Available";
        titleLabel.style.color = "#ffffff";
        hostLabel.textContent = "Scan QR to book a reservation"; // Keep it professional
        
        if (qrContainer && qrImage) {
            const destinationUrl = `${window.location.origin}${window.location.pathname.replace('kiosk.html', 'reservation.html')}?room_id=${currentRoomId}`;
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(destinationUrl)}&ecc=M&margin=0`;
            qrContainer.style.display = 'flex';
        }
    }

    // B. Render Right Panel (Upcoming Event Agenda or Premium Empty Booking Panel)
    nextListContainer.innerHTML = '';

    if (nextEvents.length === 0) {
        // Hide redudant bottom reserve CTA button because QR is already embedded directly in empty state card!
        reserveCtaBtn.style.display = 'none';

        // Generate portable landing URL
        const destinationUrl = `${window.location.origin}${window.location.pathname.replace('kiosk.html', 'reservation.html')}?room_id=${currentRoomId}`;
        const embeddedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(destinationUrl)}&ecc=M&margin=0`;

        // Render visually premium Instant Booking Panel
        nextListContainer.innerHTML = `
            <div class="kiosk-empty-booking-card">
                <div class="kiosk-empty-status-tag">ROOM OPEN FOR BOOKINGS</div>
                <div class="kiosk-empty-qr-wrapper">
                    <img class="kiosk-empty-qr-img" src="${embeddedQrUrl}" alt="QR code to book ${classroom.name}">
                </div>
                <div class="kiosk-empty-instructions">
                    <strong>Scan to Book ${classroom.name} Instantly</strong>
                    <p>No further events are scheduled today. Scan this code with your mobile camera to quickly reserve this room.</p>
                </div>
                <a href="${destinationUrl}" class="kiosk-empty-browser-link">Prefer to book via browser? Click here.</a>
            </div>
        `;
        scheduleSmartRefresh(currentEvent, nextEvents, roomId);
        return;
    }

    // Restore CTA button and render upcoming events list
    reserveCtaBtn.style.display = 'block';

    // Show up to top 3 upcoming event slots
    const renderLimit = nextEvents.slice(0, 3);
    renderLimit.forEach(r => {
        const item = document.createElement('div');
        item.className = 'kiosk-next-item';
        
        // Color coding depending on draft/pending states
        if (r.reservation_status === 'pending') {
            item.style.borderLeftColor = '#cfad4c'; // Gold for drafts/pending
        }

        // Determine date labels (Today, Tomorrow, or specific Date)
        const eventDate = new Date(r.startTime);
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const checkDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

        let dateLabel = "";
        if (checkDate.getTime() === todayDate.getTime()) {
            dateLabel = "Today";
        } else if (checkDate.getTime() === tomorrowDate.getTime()) {
            dateLabel = "Tomorrow";
        } else {
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            dateLabel = eventDate.toLocaleDateString('en-US', options);
        }

        item.innerHTML = `
            <div class="kiosk-next-time">${dateLabel} • ${formatKioskTime(r.startTime)} - ${formatKioskTime(r.endTime)}</div>
            <div class="kiosk-next-details">${escapeHTML(r.event_title)}</div>
            <div class="kiosk-next-host">${escapeHTML(r.host_name)}</div>
        `;
        nextListContainer.appendChild(item);
    });

    scheduleSmartRefresh(currentEvent, nextEvents, roomId);
}

// 8. Smart refresh: fires exactly when the current event ends or the next one starts,
//    so the display updates at the right moment without waiting up to 60 seconds.
function scheduleSmartRefresh(currentEvent, nextEvents, roomId) {
    if (smartRefreshTimeoutId) clearTimeout(smartRefreshTimeoutId);

    const now = getNow();
    let nextTransitionTime = null;

    if (currentEvent) {
        // Refresh the moment the active event ends
        nextTransitionTime = new Date(currentEvent.endTime);
    } else if (nextEvents.length > 0) {
        // Refresh the moment the next event begins
        nextTransitionTime = new Date(nextEvents[0].startTime);
    }

    if (nextTransitionTime) {
        const msUntil = nextTransitionTime - now;
        // Only schedule if the transition is in the future and within 24 hours
        if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
            smartRefreshTimeoutId = setTimeout(() => {
                fetchKioskSchedule(roomId);
            }, msUntil + 1500); // 1.5-second buffer so the clock has crossed the line
        }
    }
}

// 9. Helper to reset left panel status if API is offline
function setRoomAvailableState(roomName) {
    document.getElementById('kiosk-current-status').textContent = "AVAILABLE";
    document.getElementById('kiosk-current-status').style.color = "#2ecc71";
    
    const timeLabel = document.getElementById('kiosk-current-time');
    if (timeLabel) timeLabel.style.display = 'none';
    
    document.getElementById('kiosk-current-title').textContent = "Room Available";
    document.getElementById('kiosk-current-host').textContent = "Scan QR to book a reservation";

    const qrContainer = document.getElementById('kiosk-available-qr-container');
    const qrImage = document.getElementById('kiosk-available-qr-image');
    if (qrContainer && qrImage) {
        const destinationUrl = `${window.location.origin}${window.location.pathname.replace('kiosk.html', 'reservation.html')}?room_id=${currentRoomId}`;
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(destinationUrl)}&ecc=M&margin=0`;
        qrContainer.style.display = 'flex';
    }
}

// Helper: formats dates to simple HH:MM AM/PM strings
function formatKioskTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Helper: Escape unsafe characters to mitigate XSS
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
