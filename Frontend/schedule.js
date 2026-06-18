// Map option values (Room Primary Keys) to Classroom Status (reserved, maintenance, available) matching seeds_rooms.sql
const roomStatusMap = {
    "1": "available",
    "2": "reserved",
    "3": "available",
    "4": "available",
    "5": "available",
    "6": "maintenance",
    "7": "available",
    "8": "available",
    "9": "maintenance",
    "10": "available",
    "11": "reserved",
    "12": "reserved",
    "13": "available",
    "14": "available",
    "15": "maintenance"
};

// State variables
let allFetchedReservations = []; // stores copy of fetched reservations for local filtering
let activeSelectedReservation = null; // tracks the currently selected reservation for modal edit/delete
let editCachedRoomReservations = [];
let editCalendarYear = new Date().getFullYear();
let editCalendarMonth = new Date().getMonth();
let editSelectedDayString = '';
let editSelectedThirtyMinuteSlots = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    // Initial fetch of reservations on load
    await loadAndDisplayReservations();

    // Hook up Filters
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', async () => {
            await loadAndDisplayReservations();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', async () => {
            // Reset filters to defaults
            document.getElementById('filter-date').value = '';
            document.getElementById('filter-availability').value = 'all';
            document.getElementById('filter-room').value = '';
            document.getElementById('filter-host').value = '';
            
            const sortSelect = document.getElementById('filter-sort');
            if (sortSelect) sortSelect.value = 'chronological';
            
            const showPastCheckbox = document.getElementById('filter-show-past');
            if (showPastCheckbox) showPastCheckbox.checked = false;

            await loadAndDisplayReservations();
        });
    }

    // Toggle Mobile Sidebar Drawer
    const sidebar = document.getElementById('dashboard-sidebar');
    const toggleBtn = document.getElementById('mobile-filter-toggle');
    const closeBtn = document.getElementById('close-sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Auto-close sidebar on mobile when filter is applied
    if (applyFiltersBtn && sidebar) {
        applyFiltersBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Hook up View Kiosk button inside modal
    const modalKioskBtn = document.getElementById('modal-kiosk-btn');
    if (modalKioskBtn) {
        modalKioskBtn.addEventListener('click', () => {
            if (activeSelectedReservation && activeSelectedReservation.room_id) {
                window.location.href = `kiosk.html?room_id=${activeSelectedReservation.room_id}`;
            }
        });
    }

    // Hook up Preview Event button: opens the kiosk simulated at this reservation's time
    // so the in-session display can be previewed outside the real scheduled hours.
    const modalPreviewBtn = document.getElementById('modal-preview-btn');
    if (modalPreviewBtn) {
        modalPreviewBtn.addEventListener('click', () => {
            if (activeSelectedReservation && activeSelectedReservation.room_id && activeSelectedReservation.startTime) {
                const previewTime = encodeURIComponent(activeSelectedReservation.startTime);
                window.location.href = `kiosk.html?room_id=${activeSelectedReservation.room_id}&preview=${previewTime}`;
            }
        });
    }

    // Dismiss the details modal by clicking the dimmed backdrop or pressing Escape.
    // Only while viewing (not editing) so in-progress edits are never lost by accident.
    const detailsModalOverlay = document.getElementById('details-modal');
    if (detailsModalOverlay) {
        detailsModalOverlay.addEventListener('click', (e) => {
            const editMode = document.getElementById('modal-edit-mode');
            const isEditing = editMode && editMode.style.display !== 'none';
            if (e.target === detailsModalOverlay && !isEditing) {
                closeModal();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const modal = document.getElementById('details-modal');
        if (!modal || modal.style.display === 'none') return;
        const editMode = document.getElementById('modal-edit-mode');
        const isEditing = editMode && editMode.style.display !== 'none';
        if (!isEditing) closeModal();
    });

    // Initialize searchable autocomplete dropdowns for the edit form selects
    initSearchableDropdown(document.getElementById('edit-room-id'));
    initSearchableDropdown(document.getElementById('edit-host-role'));
    initSearchableDropdown(document.getElementById('edit-status'));

    const editRoomSelect = document.getElementById('edit-room-id');
    if (editRoomSelect) {
        editRoomSelect.addEventListener('change', () => {
            loadEditRoomAvailability(editRoomSelect.value);
        });
    }

    const editStartTimeInput = document.getElementById('edit-starttime');
    if (editStartTimeInput) {
        editStartTimeInput.addEventListener('change', () => {
            selectEditDayFromCurrentInput();
        });
    }

    const editPrevMonthBtn = document.getElementById('edit-prev-month-btn');
    if (editPrevMonthBtn) {
        editPrevMonthBtn.addEventListener('click', () => {
            editCalendarMonth--;
            if (editCalendarMonth < 0) {
                editCalendarMonth = 11;
                editCalendarYear--;
            }
            renderEditCalendar();
        });
    }

    const editNextMonthBtn = document.getElementById('edit-next-month-btn');
    if (editNextMonthBtn) {
        editNextMonthBtn.addEventListener('click', () => {
            editCalendarMonth++;
            if (editCalendarMonth > 11) {
                editCalendarMonth = 0;
                editCalendarYear++;
            }
            renderEditCalendar();
        });
    }
});

// Main function to fetch and display cards with filters
async function loadAndDisplayReservations() {
    const container = document.getElementById('reservations-container');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('error-message');

    // Show loading, hide cards and errors
    loading.style.display = 'block';
    container.style.display = 'none';
    errorMsg.style.display = 'none';
    container.innerHTML = '';

    // 1. Gather API-supported filters (Date range, Host name partial match)
    const hostFilter = document.getElementById('filter-host').value.trim();
    const dateFilter = document.getElementById('filter-date').value;

    let queryParams = [];
    if (hostFilter) {
        queryParams.push(`host_name=${encodeURIComponent(hostFilter)}`);
    }
    if (dateFilter) {
        queryParams.push(`start_from=${encodeURIComponent(dateFilter + 'T00:00:00')}`);
        queryParams.push(`end_to=${encodeURIComponent(dateFilter + 'T23:59:59')}`);
    }

    const queryString = queryParams.join('&');

    // Fetch from backend
    const reservations = await getReservations(queryString);

    loading.style.display = 'none';

    if (!reservations) {
        errorMsg.style.display = 'block';
        return;
    }

    allFetchedReservations = reservations;
    container.style.display = 'grid';

    // 2. Perform Client-Side filtering for Non-API-supported fields (Room number, Availability status, and Past events)
    const roomFilter = document.getElementById('filter-room').value.trim().toLowerCase();
    const statusFilter = document.getElementById('filter-availability').value;
    const showPastCheckbox = document.getElementById('filter-show-past');
    const showPast = showPastCheckbox ? showPastCheckbox.checked : false;

    let filteredList = allFetchedReservations;

    // Filter by room
    if (roomFilter) {
        filteredList = filteredList.filter(r => r.room_number.toLowerCase().includes(roomFilter));
    }
    // Filter by status
    if (statusFilter !== 'all') {
        filteredList = filteredList.filter(r => r.reservation_status.toLowerCase() === statusFilter.toLowerCase());
    }
    // Filter past events by default
    if (!showPast) {
        const now = new Date();
        filteredList = filteredList.filter(r => new Date(r.endTime) >= now);
    }

    // 3. Client-Side sorting
    const sortSelect = document.getElementById('filter-sort');
    const sortBy = sortSelect ? sortSelect.value : 'chronological';
    if (sortBy === 'chronological') {
        filteredList.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else if (sortBy === 'recently-scheduled') {
        // Higher reservation ID means scheduled more recently
        filteredList.sort((a, b) => b.reservation_id - a.reservation_id);
    }

    // Render cards
    if (filteredList.length === 0) {
        container.innerHTML = '<p class="no-data">No matching reservations found.</p>';
        return;
    }

    filteredList.forEach(r => {
        const card = document.createElement('div');
        card.className = 'reservation-card';
        card.style.cursor = 'pointer';
        
        // Custom interactive visual highlight depending on reservation status
        if (r.reservation_status === 'pending') {
            card.style.borderLeftColor = '#cfad4c'; // WTAMU Gold for pending
        } else if (r.reservation_status === 'cancelled') {
            card.style.borderLeftColor = '#777'; // Grey for cancelled
        } else {
            card.style.borderLeftColor = '#450012'; // Standard WTAMU Maroon for confirmed
        }

        card.innerHTML = `
            <h2 class="card-title">${escapeHTML(r.event_title)}</h2>
            <div class="card-meta">
                <span>Host: <strong>${escapeHTML(r.host_name)}</strong></span>
                <span>Room: <strong>${escapeHTML(r.room_number)} &mdash; ${escapeHTML(r.building)}</strong></span>
            </div>
            <div class="card-time">
                ${formatDateTime(r.startTime)} &rarr; ${formatDateTime(r.endTime)}
            </div>
            <p class="card-description card-description--preview">${r.event_description ? escapeHTML(r.event_description) : 'No description provided.'}</p>
            <span class="card-status status-${r.reservation_status.toLowerCase()}">${escapeHTML(r.reservation_status)}</span>
        `;

        // Click handler to open details modal
        card.addEventListener('click', () => {
            openDetailsModal(r);
        });

        container.appendChild(card);
    });
}

// Open modal with reservation details
function openDetailsModal(reservation) {
    activeSelectedReservation = reservation;

    document.getElementById('modal-title').textContent = reservation.event_title;
    document.getElementById('modal-host').textContent = reservation.host_name;
    document.getElementById('modal-role').textContent = reservation.host_role;
    document.getElementById('modal-email').textContent = reservation.host_email;
    document.getElementById('modal-room').textContent = `${reservation.room_number} (Capacity: ${reservation.capacity})`;
    document.getElementById('modal-building').textContent = reservation.building;
    document.getElementById('modal-equipment').textContent = reservation.equipment || 'None';
    document.getElementById('modal-guests').textContent = reservation.event_guests;
    document.getElementById('modal-time').textContent = `${formatDateTime(reservation.startTime)} to ${formatDateTime(reservation.endTime)}`;
    document.getElementById('modal-description').textContent = reservation.event_description || 'No description provided.';

    // Render special requirements as readable tags (split on commas), or a fallback message.
    const reqEl = document.getElementById('modal-requirement');
    const reqText = reservation.event_requirement;
    if (reqText && reqText.trim()) {
        const tags = reqText.split(',').map(s => s.trim()).filter(Boolean);
        reqEl.innerHTML = tags.map(t => `<span class="requirement-tag">${escapeHTML(t)}</span>`).join('');
        reqEl.classList.add('requirement-tags');
    } else {
        reqEl.classList.remove('requirement-tags');
        reqEl.textContent = 'No special requirements listed.';
    }
    
    const statusLabel = document.getElementById('modal-status');
    statusLabel.textContent = reservation.reservation_status;
    statusLabel.className = `card-status status-${reservation.reservation_status.toLowerCase()}`;

    // Pop the overlay open
    toggleEditMode(false); // Make sure view mode is shown first
    document.getElementById('details-modal').style.display = 'flex';
}

// Closes details modal
function closeModal() {
    document.getElementById('details-modal').style.display = 'none';
    activeSelectedReservation = null;
}

// Toggle between View mode and Edit mode inside modal
function toggleEditMode(isEdit) {
    const viewMode = document.getElementById('modal-view-mode');
    const editMode = document.getElementById('modal-edit-mode');
    const errorBox = document.getElementById('edit-validation-warning');
    const modalCard = document.querySelector('#details-modal .modal-card');

    errorBox.style.display = 'none';
    errorBox.textContent = '';

    if (isEdit) {
        if (modalCard) modalCard.classList.add('editing');
        viewMode.style.display = 'none';
        editMode.style.display = 'block';

        // Prepopulate edit inputs with active reservation details
        document.getElementById('edit-title').value = activeSelectedReservation.event_title;
        document.getElementById('edit-host-name').value = activeSelectedReservation.host_name;
        document.getElementById('edit-host-email').value = activeSelectedReservation.host_email;
        
        const hostRoleEl = document.getElementById('edit-host-role');
        const roleToMatch = (activeSelectedReservation.host_role || '').toLowerCase();
        let matchedRoleVal = '';
        Array.from(hostRoleEl.options).forEach(opt => {
            if (opt.value.toLowerCase() === roleToMatch) {
                matchedRoleVal = opt.value;
            }
        });
        hostRoleEl.value = matchedRoleVal;
        hostRoleEl.dispatchEvent(new Event('change'));

        document.getElementById('edit-description').value = activeSelectedReservation.event_description || '';
        document.getElementById('edit-requirement').value = activeSelectedReservation.event_requirement || '';
        document.getElementById('edit-guests').value = activeSelectedReservation.event_guests;
        
        const roomIdEl = document.getElementById('edit-room-id');
        roomIdEl.value = activeSelectedReservation.room_id;

        const statusEl = document.getElementById('edit-status');
        const statusToMatch = (activeSelectedReservation.reservation_status || '').toLowerCase();
        let matchedStatusVal = '';
        Array.from(statusEl.options).forEach(opt => {
            if (opt.value.toLowerCase() === statusToMatch) {
                matchedStatusVal = opt.value;
            }
        });
        statusEl.value = matchedStatusVal;
        statusEl.dispatchEvent(new Event('change'));

        // Convert ISO times to format expected by local datetime picker input
        document.getElementById('edit-starttime').value = activeSelectedReservation.startTime.substring(0, 16);
        document.getElementById('edit-endtime').value = activeSelectedReservation.endTime.substring(0, 16);

        const selectedStart = new Date(activeSelectedReservation.startTime);
        editCalendarYear = selectedStart.getFullYear();
        editCalendarMonth = selectedStart.getMonth();
        editSelectedDayString = formatDatePartsForInput(
            selectedStart.getFullYear(),
            selectedStart.getMonth(),
            selectedStart.getDate()
        );
        roomIdEl.dispatchEvent(new Event('change'));
    } else {
        if (modalCard) modalCard.classList.remove('editing');
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
    }
}

async function loadEditRoomAvailability(roomId) {
    const alertBox = document.getElementById('edit-classroom-availability-alert');
    const calendarSection = document.getElementById('edit-classroom-calendar-section');
    const timeHelperPanel = document.getElementById('edit-time-helper-panel');

    if (!alertBox || !calendarSection || !timeHelperPanel) return;

    alertBox.style.display = 'none';
    calendarSection.style.display = 'none';
    timeHelperPanel.style.display = 'none';
    editCachedRoomReservations = [];
    editSelectedThirtyMinuteSlots.clear();

    if (!roomId) {
        alertBox.style.display = 'block';
        alertBox.className = 'classroom-availability-alert';
        alertBox.textContent = 'Select a classroom to review availability before saving changes.';
        return;
    }

    const roomStatus = roomStatusMap[roomId.toString()];
    if (roomStatus === 'reserved' || roomStatus === 'maintenance') {
        alertBox.style.display = 'block';
        alertBox.className = 'classroom-availability-alert warning';
        alertBox.innerHTML = `<strong>Room Unavailable:</strong> This classroom is marked as ${escapeHTML(roomStatus)}.`;
        return;
    }

    alertBox.style.display = 'block';
    alertBox.className = 'classroom-availability-alert loading';
    alertBox.textContent = 'Loading classroom availability data...';

    try {
        const reservations = await getReservations();
        if (!reservations) {
            alertBox.className = 'classroom-availability-alert error';
            alertBox.textContent = 'Failed to fetch room schedules. Please try again.';
            return;
        }

        const activeId = activeSelectedReservation ? Number(activeSelectedReservation.reservation_id) : null;
        editCachedRoomReservations = reservations.filter(r =>
            Number(r.room_id) === Number(roomId) &&
            Number(r.reservation_id) !== activeId &&
            String(r.reservation_status || '').toLowerCase() !== 'cancelled'
        );

        alertBox.style.display = 'none';
        calendarSection.style.display = 'block';
        renderEditCalendar();
        selectEditDayFromCurrentInput();
    } catch (e) {
        alertBox.className = 'classroom-availability-alert error';
        alertBox.textContent = `Network Error: ${e.message}`;
    }
}

function renderEditCalendar() {
    const monthYearEl = document.getElementById('edit-calendar-month-year');
    const daysGrid = document.getElementById('edit-calendar-days-grid');
    if (!monthYearEl || !daysGrid) return;

    daysGrid.innerHTML = '';

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    monthYearEl.textContent = `${monthNames[editCalendarMonth]} ${editCalendarYear}`;

    const firstDayIndex = new Date(editCalendarYear, editCalendarMonth, 1).getDay();
    const totalDays = new Date(editCalendarYear, editCalendarMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayIndex; i++) {
        const spacer = document.createElement('div');
        spacer.className = 'calendar-day empty';
        daysGrid.appendChild(spacer);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('button');
        dayCell.type = 'button';
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        const currentDayDate = new Date(editCalendarYear, editCalendarMonth, day);
        const dateString = formatDatePartsForInput(editCalendarYear, editCalendarMonth, day);
        const dayBookings = getEditBookingsForDate(currentDayDate);

        if (currentDayDate < today) {
            dayCell.classList.add('past');
        }

        const dot = document.createElement('span');
        dot.className = 'day-indicator-dot';

        if (dayBookings.length === 0) {
            dayCell.classList.add('available');
            dot.classList.add('status-available');
        } else if (isEditDayFullyBooked(day, dayBookings)) {
            dayCell.classList.add('fully-booked');
            dot.classList.add('status-fully');
        } else {
            dayCell.classList.add('partially-booked');
            dot.classList.add('status-partial');
        }

        if (editSelectedDayString === dateString) {
            dayCell.classList.add('active-selected');
        }

        dayCell.appendChild(dot);
        dayCell.addEventListener('click', () => {
            const activeCell = daysGrid.querySelector('.active-selected');
            if (activeCell) activeCell.classList.remove('active-selected');

            dayCell.classList.add('active-selected');
            editSelectedDayString = dateString;
            selectEditCalendarDay(day, editCalendarMonth, editCalendarYear, dayBookings);
        });

        daysGrid.appendChild(dayCell);
    }
}

function selectEditDayFromCurrentInput() {
    const startTimeInput = document.getElementById('edit-starttime');
    if (!startTimeInput || !startTimeInput.value) return;

    const selectedDate = new Date(startTimeInput.value);
    if (Number.isNaN(selectedDate.getTime())) return;

    editSelectedDayString = formatDatePartsForInput(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    );

    if (selectedDate.getFullYear() !== editCalendarYear || selectedDate.getMonth() !== editCalendarMonth) {
        editCalendarYear = selectedDate.getFullYear();
        editCalendarMonth = selectedDate.getMonth();
        renderEditCalendar();
    }

    selectEditCalendarDay(
        selectedDate.getDate(),
        selectedDate.getMonth(),
        selectedDate.getFullYear(),
        getEditBookingsForDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()))
    );
}

function selectEditCalendarDay(day, month, year, dayBookings) {
    editSelectedThirtyMinuteSlots.clear();

    const timeHelperPanel = document.getElementById('edit-time-helper-panel');
    const selectedDateEl = document.getElementById('edit-time-helper-selected-date');
    const timelineContainer = document.getElementById('edit-daily-timeline-container');
    if (!timeHelperPanel || !selectedDateEl || !timelineContainer) return;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    selectedDateEl.textContent = `Daily Schedule: ${monthNames[month]} ${day}, ${year}`;
    timeHelperPanel.style.display = 'block';

    timelineContainer.innerHTML = '';
    if (dayBookings.length === 0) {
        timelineContainer.innerHTML = '<div class="timeline-empty">No scheduled reservations for this date. The room is fully open.</div>';
    } else {
        dayBookings
            .slice()
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .forEach(b => {
                const bStart = new Date(b.startTime);
                const bEnd = new Date(b.endTime);
                const timeFormat = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                const block = document.createElement('div');
                block.className = 'timeline-block';
                block.innerHTML = `
                    <div class="timeline-time">${timeFormat(bStart)} &ndash; ${timeFormat(bEnd)}</div>
                    <div class="timeline-details">
                        <strong class="timeline-title">${escapeHTML(b.event_title)}</strong>
                        <span class="timeline-host">Host: ${escapeHTML(b.host_name)} (${escapeHTML(b.host_role)})</span>
                    </div>
                `;
                timelineContainer.appendChild(block);
            });
    }

    generateEditRecommendedTimeSlots(day, month, year, dayBookings);
}

function generateEditRecommendedTimeSlots(day, month, year, dayBookings) {
    const slotsContainer = document.getElementById('edit-recommended-slots-container');
    if (!slotsContainer) return;

    slotsContainer.innerHTML = '';
    updateEditSelectedSlotsSummary();

    const startDayMin = 7 * 60;
    const endDayMin = 23 * 60;
    const totalIntervals = (endDayMin - startDayMin) / 30;
    const isFree = Array(totalIntervals).fill(true);

    dayBookings.forEach(booking => {
        const bStart = new Date(booking.startTime);
        const bEnd = new Date(booking.endTime);
        const bStartMin = bStart.getHours() * 60 + bStart.getMinutes();
        const bEndMin = bEnd.getHours() * 60 + bEnd.getMinutes();
        const bStartMinClamped = Math.max(startDayMin, Math.min(endDayMin, bStartMin));
        const bEndMinClamped = Math.max(startDayMin, Math.min(endDayMin, bEndMin));

        if (bStartMinClamped < bEndMinClamped) {
            for (let i = 0; i < totalIntervals; i++) {
                const intervalStart = startDayMin + i * 30;
                const intervalEnd = intervalStart + 30;
                if (intervalStart < bEndMinClamped && bStartMinClamped < intervalEnd) {
                    isFree[i] = false;
                }
            }
        }
    });

    const slots = Array.from({ length: totalIntervals }, (_, index) => ({
        index,
        startMin: startDayMin + index * 30,
        endMin: startDayMin + (index + 1) * 30,
        isReserved: !isFree[index]
    }));

    slots.forEach(slot => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'recommended-slot-pill';
        pill.dataset.slotIndex = String(slot.index);

        if (slot.isReserved) {
            pill.textContent = `${formatMinutesTo12h(slot.startMin)} - ${formatMinutesTo12h(slot.endMin)} (Reserved)`;
            pill.classList.add('reserved');
            pill.disabled = true;
        } else {
            pill.textContent = `${formatMinutesTo12h(slot.startMin)} - ${formatMinutesTo12h(slot.endMin)}`;
            pill.addEventListener('click', () => {
                toggleEditThirtyMinuteSlot(slot.index, slots, day, month, year);
            });
        }

        slotsContainer.appendChild(pill);
    });

    syncEditSelectedSlotsFromInputs(day, month, year, slots);
}

function toggleEditThirtyMinuteSlot(slotIndex, slots, day, month, year) {
    if (editSelectedThirtyMinuteSlots.has(slotIndex)) {
        editSelectedThirtyMinuteSlots.delete(slotIndex);
    } else {
        const candidateSlots = new Set(editSelectedThirtyMinuteSlots);
        candidateSlots.add(slotIndex);
        const sorted = Array.from(candidateSlots).sort((a, b) => a - b);
        const hasGap = sorted.some((value, index) => index > 0 && value !== sorted[index - 1] + 1);

        editSelectedThirtyMinuteSlots = hasGap ? new Set([slotIndex]) : candidateSlots;
        if (hasGap) {
            showToast('Start a new reservation range, then select adjacent 30-minute blocks.', 'warning');
        }
    }

    applyEditThirtyMinuteSelection(slots, day, month, year);
}

function applyEditThirtyMinuteSelection(slots, day, month, year) {
    const slotsContainer = document.getElementById('edit-recommended-slots-container');
    const startTimeInput = document.getElementById('edit-starttime');
    const endTimeInput = document.getElementById('edit-endtime');
    if (!slotsContainer || !startTimeInput || !endTimeInput) return;

    slotsContainer.querySelectorAll('.recommended-slot-pill').forEach(pill => {
        const index = parseInt(pill.dataset.slotIndex, 10);
        pill.classList.toggle('active', editSelectedThirtyMinuteSlots.has(index));
    });

    if (editSelectedThirtyMinuteSlots.size === 0) {
        updateEditSelectedSlotsSummary();
        return;
    }

    const sortedIndexes = Array.from(editSelectedThirtyMinuteSlots).sort((a, b) => a - b);
    const firstSlot = slots[sortedIndexes[0]];
    const lastSlot = slots[sortedIndexes[sortedIndexes.length - 1]];
    const startH = Math.floor(firstSlot.startMin / 60);
    const startM = firstSlot.startMin % 60;
    const endH = Math.floor(lastSlot.endMin / 60);
    const endM = lastSlot.endMin % 60;

    startTimeInput.value = `${formatDatePartsForInput(year, month, day)}T${pad2(startH)}:${pad2(startM)}`;
    endTimeInput.value = `${formatDatePartsForInput(year, month, day)}T${pad2(endH)}:${pad2(endM)}`;

    const durationMinutes = editSelectedThirtyMinuteSlots.size * 30;
    const durationLabel = durationMinutes < 60 ? `${durationMinutes} minutes` : `${durationMinutes / 60} hours`;
    const startLabel = formatMinutesTo12h(firstSlot.startMin);
    const endLabel = formatMinutesTo12h(lastSlot.endMin);

    updateEditSelectedSlotsSummary(`${startLabel} to ${endLabel} (${durationLabel})`);
    showToast(`Selected updated reservation time: ${startLabel} to ${endLabel}.`, 'success');
}

function syncEditSelectedSlotsFromInputs(day, month, year, slots) {
    const startTimeInput = document.getElementById('edit-starttime');
    const endTimeInput = document.getElementById('edit-endtime');
    const slotsContainer = document.getElementById('edit-recommended-slots-container');
    if (!startTimeInput || !endTimeInput || !slotsContainer || !startTimeInput.value || !endTimeInput.value) return;

    const selectedDate = formatDatePartsForInput(year, month, day);
    const startDatePart = startTimeInput.value.slice(0, 10);
    const endDatePart = endTimeInput.value.slice(0, 10);

    if (startDatePart !== selectedDate || endDatePart !== selectedDate) {
        editSelectedThirtyMinuteSlots.clear();
        updateEditSelectedSlotsSummary();
        return;
    }

    const startObj = new Date(startTimeInput.value);
    const endObj = new Date(endTimeInput.value);
    const startMin = startObj.getHours() * 60 + startObj.getMinutes();
    const endMin = endObj.getHours() * 60 + endObj.getMinutes();

    editSelectedThirtyMinuteSlots.clear();
    slots.forEach(slot => {
        if (!slot.isReserved && slot.startMin >= startMin && slot.endMin <= endMin) {
            editSelectedThirtyMinuteSlots.add(slot.index);
        }
    });

    slotsContainer.querySelectorAll('.recommended-slot-pill').forEach(pill => {
        const index = parseInt(pill.dataset.slotIndex, 10);
        pill.classList.toggle('active', editSelectedThirtyMinuteSlots.has(index));
    });

    if (editSelectedThirtyMinuteSlots.size === 0) {
        updateEditSelectedSlotsSummary();
        return;
    }

    const durationMinutes = endMin - startMin;
    const durationLabel = durationMinutes < 60 ? `${durationMinutes} minutes` : `${durationMinutes / 60} hours`;
    updateEditSelectedSlotsSummary(`${formatMinutesTo12h(startMin)} to ${formatMinutesTo12h(endMin)} (${durationLabel})`);
}

function getEditBookingsForDate(currentDayDate) {
    return editCachedRoomReservations.filter(r => {
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);
        const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const dEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        return currentDayDate >= dStart && currentDayDate <= dEnd;
    });
}

function isEditDayFullyBooked(day, dayBookings) {
    const startDayMin = 7 * 60;
    const endDayMin = 23 * 60;
    let totalOccupiedMinutes = 0;

    dayBookings.forEach(b => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        const clipStart = new Date(Math.max(bStart.getTime(), new Date(editCalendarYear, editCalendarMonth, day, 7, 0).getTime()));
        const clipEnd = new Date(Math.min(bEnd.getTime(), new Date(editCalendarYear, editCalendarMonth, day, 23, 0).getTime()));

        if (clipStart < clipEnd) {
            totalOccupiedMinutes += (clipEnd - clipStart) / (1000 * 60);
        }
    });

    return totalOccupiedMinutes >= endDayMin - startDayMin;
}

function hasEditReservationConflict(roomId, startObj, endObj) {
    return editCachedRoomReservations.some(r => {
        if (Number(r.room_id) !== Number(roomId)) return false;
        if (String(r.reservation_status || '').toLowerCase() === 'cancelled') return false;

        const existingStart = new Date(r.startTime);
        const existingEnd = new Date(r.endTime);
        return startObj < existingEnd && existingStart < endObj;
    });
}

function updateEditSelectedSlotsSummary(summaryText = 'Select adjacent blocks to update this reservation.') {
    const summary = document.getElementById('edit-selected-slots-summary');
    if (summary) {
        summary.textContent = summaryText;
    }
}

function formatMinutesTo12h(totalMins) {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const dispH = h % 12 === 0 ? 12 : h % 12;
    const dispM = m === 0 ? '00' : String(m).padStart(2, '0');
    return `${dispH}:${dispM} ${suffix}`;
}

function formatDatePartsForInput(year, month, day) {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function pad2(value) {
    return String(value).padStart(2, '0');
}

function serializeLocalDateTimeForApi(inputValue) {
    if (!inputValue) return null;
    return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

// Handles submitting the reservation update (PUT)
async function submitEdit(event) {
    event.preventDefault();

    const errorBox = document.getElementById('edit-validation-warning');
    errorBox.style.display = 'none';
    errorBox.textContent = '';

    const newTitle = document.getElementById('edit-title').value.trim();
    const newHostName = document.getElementById('edit-host-name').value.trim();
    const newHostEmail = document.getElementById('edit-host-email').value.trim();
    const newHostRole = document.getElementById('edit-host-role').value;
    const newDesc = document.getElementById('edit-description').value.trim();
    const newReq = document.getElementById('edit-requirement').value.trim();
    const newGuests = parseInt(document.getElementById('edit-guests').value, 10);
    const newRoomId = parseInt(document.getElementById('edit-room-id').value, 10);
    const newStartTime = document.getElementById('edit-starttime').value;
    const newEndTime = document.getElementById('edit-endtime').value;
    const newStatus = document.getElementById('edit-status').value;

    // Strict validation of required fields
    let validationErrors = [];
    if (!newTitle) validationErrors.push("Event Title is required.");
    if (!newHostName) validationErrors.push("Host Name is required.");
    
    if (!newHostEmail) {
        validationErrors.push("Host Email is required.");
    } else {
        const emailLower = newHostEmail.toLowerCase();
        if (newHostRole === 'Faculty') {
            if (!emailLower.endsWith('@wtamu.edu')) {
                validationErrors.push("Faculty role requires a secure academic email ending with @wtamu.edu.");
            }
        } else if (newHostRole) {
            if (!emailLower.endsWith('@buffs.wtamu.edu') && !emailLower.endsWith('@wtamu.edu')) {
                validationErrors.push("Student/Staff/Organization role requires a valid WTAMU academic email (@buffs.wtamu.edu or @wtamu.edu).");
            }
        }
    }
    
    if (!newHostRole) validationErrors.push("Host Role is required.");
    if (isNaN(newGuests) || newGuests < 1) validationErrors.push("Expected Participants must be at least 1.");
    if (isNaN(newRoomId) || !newRoomId) validationErrors.push("Classroom is required.");
    if (!newStartTime) validationErrors.push("Start Date/Time is required.");
    if (!newEndTime) validationErrors.push("End Date/Time is required.");
    if (!newStatus) validationErrors.push("Reservation Status is required.");

    if (validationErrors.length > 0) {
        errorBox.innerHTML = '<strong>Validation Error:</strong><br>' + validationErrors.map(err => `• ${escapeHTML(err)}`).join('<br>');
        errorBox.style.display = 'block';
        showToast("Please correct the form errors before saving.", "error");
        return;
    }

    // Time verification
    const startObj = new Date(newStartTime);
    const endObj = new Date(newEndTime);

    if (startObj >= endObj) {
        const timeError = 'Validation Error: End time must be after start time.';
        errorBox.textContent = timeError;
        errorBox.style.display = 'block';
        showToast(timeError, 'error');
        return;
    }

    const startHour = startObj.getHours() + startObj.getMinutes() / 60;
    const endHour = endObj.getHours() + endObj.getMinutes() / 60;
    const isSameDay = startObj.getFullYear() === endObj.getFullYear() &&
        startObj.getMonth() === endObj.getMonth() &&
        startObj.getDate() === endObj.getDate();

    if (!isSameDay || startHour < 7 || endHour > 23 || endHour === 0) {
        const rangeError = 'Validation Error: Reservations can only be scheduled between 7:00 AM and 11:00 PM on a single day.';
        errorBox.textContent = rangeError;
        errorBox.style.display = 'block';
        showToast(rangeError, 'error');
        return;
    }

    // Dynamic Room Availability Validation (Reserved or under Maintenance)
    const roomStatus = roomStatusMap[newRoomId.toString()];
    if (roomStatus === 'reserved' || roomStatus === 'maintenance') {
        const errorMsg = 'Validation failed: Room is not available (Reserved or under Maintenance)';
        errorBox.textContent = errorMsg;
        errorBox.style.display = 'block';
        showToast(errorMsg, 'error');
        return;
    }

    if (hasEditReservationConflict(newRoomId, startObj, endObj)) {
        const conflictMsg = 'Validation failed: The selected room already has a reservation during this time. Choose an available slot from the calendar.';
        errorBox.textContent = conflictMsg;
        errorBox.style.display = 'block';
        showToast(conflictMsg, 'error');
        return;
    }

    // Build Pydantic update shape matching FastAPI's ReservationUpdate schema
    const payload = {
        host: {
            name: newHostName,
            email: newHostEmail,
            role: newHostRole
        },
        event: {
            title: newTitle,
            description: newDesc || null,
            requirement: newReq || null,
            numberParticipant: newGuests,
            location: activeSelectedReservation.building, // keep current building or fallback
            startTime: serializeLocalDateTimeForApi(newStartTime),
            endTime: serializeLocalDateTimeForApi(newEndTime)
        },
        roomId: newRoomId,
        reservation_status: newStatus
    };

    const submitBtn = document.querySelector('#edit-reservation-form button[type="submit"]');
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
        const result = await updateReservation(activeSelectedReservation.reservation_id, payload);
        if (result.success) {
            closeModal();
            showToast("Reservation updated successfully.", "success");
            await loadAndDisplayReservations();
        } else {
            errorBox.textContent = `Update Failed: ${result.error || 'Server error'}`;
            errorBox.style.display = 'block';
        }
    } catch (e) {
        errorBox.textContent = `Network Error: ${e.message}`;
        errorBox.style.display = 'block';
    } finally {
        submitBtn.textContent = 'Save Changes';
        submitBtn.disabled = false;
    }
}

// Handles deleting / cancelling the reservation (DELETE)
async function triggerDelete() {
    if (!activeSelectedReservation) return;

    const confirmCancel = await showConfirm(
        `Are you sure you want to cancel the reservation for "${activeSelectedReservation.event_title}"? This action cannot be undone.`,
        'Cancel Reservation?'
    );
    if (!confirmCancel) return;

    const deleteBtn = document.querySelector('.delete-btn');
    deleteBtn.textContent = 'Cancelling...';
    deleteBtn.disabled = true;

    try {
        const result = await deleteReservation(activeSelectedReservation.reservation_id);
        if (result.success) {
            closeModal();
            showToast("Reservation cancelled successfully.", "success");
            await loadAndDisplayReservations();
        } else {
            showToast(`Cancellation Failed: ${result.error || 'Server error'}`, "error");
        }
    } catch (e) {
        showToast(`Network Error: ${e.message}`, "error");
    } finally {
        deleteBtn.textContent = 'Cancel Reservation';
        deleteBtn.disabled = false;
    }
}

// Custom confirmation dialog. Returns a Promise that resolves true (confirmed) or false (dismissed).
function showConfirm(message, title = 'Are you sure?') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        titleEl.textContent = title;
        msgEl.textContent = message;
        overlay.style.display = 'flex';
        // Next frame so the CSS transition runs from the hidden state
        requestAnimationFrame(() => overlay.classList.add('open'));

        function cleanup(result) {
            overlay.classList.remove('open');
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
            overlay.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKey);
            // Hide after the fade-out transition completes
            setTimeout(() => { overlay.style.display = 'none'; }, 220);
            resolve(result);
        }
        function onYes() { cleanup(true); }
        function onNo() { cleanup(false); }
        function onBackdrop(e) { if (e.target === overlay) cleanup(false); }
        function onKey(e) { if (e.key === 'Escape') cleanup(false); }

        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
        overlay.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKey);
    });
}

// Helper formatting and safety functions
function formatDateTime(timeStr) {
    if (!timeStr) return 'TBD';
    const date = new Date(timeStr);
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ── Lightweight Vanilla Searchable Autocomplete Dropdowns Initializer ────── */
function initSearchableDropdown(selectEl) {
    if (!selectEl) return;
    
    // Check if already initialized
    if (selectEl.dataset.customInitialized) return;
    selectEl.dataset.customInitialized = "true";

    // Hide original select
    selectEl.style.display = 'none';

    // Create container
    const container = document.createElement('div');
    container.className = 'custom-select-container';
    
    // Insert container before selectEl and move selectEl inside container
    selectEl.parentNode.insertBefore(container, selectEl);
    container.appendChild(selectEl);

    // Create custom input for typing/searching
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-select-input';
    input.placeholder = selectEl.options[0]?.text || 'Select...';
    
    // If selectEl is disabled, input should be disabled
    if (selectEl.disabled) {
        input.disabled = true;
        input.style.backgroundColor = '#eaeaea';
        input.style.cursor = 'not-allowed';
    }

    // Set initial value text if something is already selected
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    if (selectedOption && !selectedOption.disabled && selectEl.value !== '') {
        input.value = selectedOption.text;
    } else {
        input.value = '';
    }

    // Create arrow
    const arrow = document.createElement('div');
    arrow.className = 'custom-select-arrow';
    arrow.innerHTML = '▼';

    // Create dropdown menu list
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';

    container.appendChild(input);
    container.appendChild(arrow);
    container.appendChild(dropdown);

    // Build standard structure of options
    function buildDropdownOptions() {
        dropdown.innerHTML = '';

        // Loop through children of select (optgroups and options)
        Array.from(selectEl.children).forEach(child => {
            if (child.tagName === 'OPTGROUP') {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'custom-select-group';
                groupHeader.textContent = child.label;
                dropdown.appendChild(groupHeader);

                Array.from(child.children).forEach(opt => {
                    if (opt.tagName === 'OPTION') {
                        // Skip placeholder option
                        if (opt.disabled && opt.value === '') return;

                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'custom-select-option';
                        optionDiv.textContent = opt.text;
                        optionDiv.dataset.value = opt.value;

                        if (opt.selected) {
                            optionDiv.classList.add('selected');
                        }

                        optionDiv.addEventListener('click', (e) => {
                            e.stopPropagation();
                            selectOption(opt.value, opt.text);
                        });

                        dropdown.appendChild(optionDiv);
                    }
                });
            } else if (child.tagName === 'OPTION') {
                if (child.disabled && child.value === '') return; // Skip placeholder

                const optionDiv = document.createElement('div');
                optionDiv.className = 'custom-select-option';
                optionDiv.textContent = child.text;
                optionDiv.dataset.value = child.value;

                if (child.selected) {
                    optionDiv.classList.add('selected');
                }

                optionDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectOption(child.value, child.text);
                });

                dropdown.appendChild(optionDiv);
            }
        });
        
        // Add "No results found" div
        const noResults = document.createElement('div');
        noResults.className = 'custom-select-no-results';
        noResults.textContent = 'No matching options';
        noResults.style.display = 'none';
        dropdown.appendChild(noResults);
    }

    buildDropdownOptions();

    // Set selected option helper
    function selectOption(value, text) {
        selectEl.value = value;
        input.value = text;
        
        // Update styling of .selected class
        const optionDivs = dropdown.querySelectorAll('.custom-select-option');
        optionDivs.forEach(div => {
            if (div.dataset.value === value) {
                div.classList.add('selected');
            } else {
                div.classList.remove('selected');
            }
        });
        
        // Dispatch 'change' event to original select
        selectEl.dispatchEvent(new Event('change'));
        
        closeDropdown();
    }

    function openDropdown() {
        if (selectEl.disabled) return;
        // Close other custom dropdowns
        document.querySelectorAll('.custom-select-container').forEach(c => {
            if (c !== container) c.classList.remove('open');
        });
        
        container.classList.add('open');
        input.focus();
        input.select();
        
        // Show all options on open
        filterOptions('');
    }

    function closeDropdown() {
        container.classList.remove('open');
        
        // Sync input text with currently selected option value text
        const currentSelected = selectEl.options[selectEl.selectedIndex];
        if (currentSelected && !currentSelected.disabled && selectEl.value !== '') {
            input.value = currentSelected.text;
        } else {
            input.value = '';
        }
    }

    // Filter options based on query
    function filterOptions(query) {
        const lowerQuery = query.toLowerCase();
        const optionDivs = dropdown.querySelectorAll('.custom-select-option');
        const groupHeaders = dropdown.querySelectorAll('.custom-select-group');
        const noResults = dropdown.querySelector('.custom-select-no-results');
        
        let visibleCount = 0;
        
        // Filter options
        optionDivs.forEach(div => {
            const text = div.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                div.classList.remove('hidden');
                visibleCount++;
            } else {
                div.classList.add('hidden');
            }
        });
        
        // Filter headers: hide group header if all options in that group are hidden
        let header = null;
        let groupHasVisibleOption = false;
        
        Array.from(dropdown.children).forEach(child => {
            if (child.classList.contains('custom-select-group')) {
                if (header) {
                    if (groupHasVisibleOption) {
                        header.style.display = 'block';
                    } else {
                        header.style.display = 'none';
                    }
                }
                header = child;
                groupHasVisibleOption = false;
            } else if (child.classList.contains('custom-select-option')) {
                if (!child.classList.contains('hidden')) {
                    groupHasVisibleOption = true;
                }
            }
        });
        // Check last header
        if (header) {
            if (groupHasVisibleOption) {
                header.style.display = 'block';
            } else {
                header.style.display = 'none';
            }
        }
        
        // Show no results div
        if (visibleCount === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }

    // Listeners
    input.addEventListener('click', (e) => {
        e.stopPropagation();
        openDropdown();
    });
    
    input.addEventListener('input', (e) => {
        if (!container.classList.contains('open')) {
            openDropdown();
        }
        filterOptions(e.target.value);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            closeDropdown();
        }
    });

    // If selectEl value changes externally (like reset or prepopulate), update our custom input!
    selectEl.addEventListener('change', () => {
        const curOpt = selectEl.options[selectEl.selectedIndex];
        if (curOpt && !curOpt.disabled && selectEl.value !== '') {
            input.value = curOpt.text;
            
            const optionDivs = dropdown.querySelectorAll('.custom-select-option');
            optionDivs.forEach(div => {
                if (div.dataset.value === selectEl.value) {
                    div.classList.add('selected');
                } else {
                    div.classList.remove('selected');
                }
            });
        } else {
            input.value = '';
            dropdown.querySelectorAll('.custom-select-option').forEach(div => div.classList.remove('selected'));
        }
    });
    
    // Support dynamic updates
    selectEl.syncCustomDropdown = () => {
        buildDropdownOptions();
        const curOpt = selectEl.options[selectEl.selectedIndex];
        if (curOpt && !curOpt.disabled && selectEl.value !== '') {
            input.value = curOpt.text;
        } else {
            input.value = '';
        }
        
        // sync disabled status
        if (selectEl.disabled) {
            input.disabled = true;
            input.style.backgroundColor = '#eaeaea';
            input.style.cursor = 'not-allowed';
        } else {
            input.disabled = false;
            input.style.backgroundColor = '';
            input.style.cursor = 'pointer';
        }
    };
}

/* ── Custom Toast Notification Engine ────────────────────────────────────── */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    let iconSymbol = 'ℹ️';
    if (type === 'success') iconSymbol = '✓';
    if (type === 'error') iconSymbol = '❌';
    if (type === 'warning') iconSymbol = '⚠️';

    toast.innerHTML = `
        <div class="toast-icon">${iconSymbol}</div>
        <div class="toast-message">${escapeHTML(message)}</div>
        <div class="toast-close">&times;</div>
    `;

    // Hook up close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });

    container.appendChild(toast);

    // Auto-dismiss after a few seconds (errors stay on screen a little longer)
    const lifespan = type === 'error' ? 6000 : 4000;
    const timeoutId = setTimeout(() => removeToast(toast), lifespan);
    toast.dataset.timeoutId = String(timeoutId);
}

// Fade a toast out using the .fade-out CSS animation, then remove it from the DOM.
function removeToast(toast) {
    if (!toast || toast.classList.contains('fade-out')) return;
    if (toast.dataset.timeoutId) clearTimeout(parseInt(toast.dataset.timeoutId, 10));
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // Fallback removal in case the animationend event does not fire
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
}
