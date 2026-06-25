// Map option values (Room Primary Keys) to Building Names
const roomBuildingMap = {
    "1": "Classroom Center",
    "2": "Classroom Center",
    "3": "Classroom Center",
    "4": "Classroom Center",
    "5": "Interactive Learning Center",
    "6": "Interactive Learning Center",
    "7": "Interactive Learning Center",
    "8": "Agriculture Sciences Complex",
    "9": "Agriculture Sciences Complex",
    "10": "Jack B. Kelley Student Center",
    "11": "Jack B. Kelley Student Center",
    "12": "Mary Moody Northen Hall",
    "13": "Mary Moody Northen Hall",
    "14": "Buff Business Center",
    "15": "Engineering & Computer Science Building"
};

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

// State variables for Wizard & Caching
let currentStep = 1;
let cachedRoomReservations = [];
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let selectedDayString = null; // YYYY-MM-DD format

// Cached active selection for recommended hours re-rendering
let activeSelectedDay = null;
let activeSelectedMonth = null;
let activeSelectedYear = null;
let activeSelectedDayBookings = [];
let selectedThirtyMinuteSlots = new Set();

// Cached host profiles for autofill autocomplete
let existingHosts = [];
let suggestedHost = null;

document.addEventListener('DOMContentLoaded', () => {
    const roomSelect = document.getElementById('room-id');
    const locationInput = document.getElementById('event-location');
    const startTimeInput = document.getElementById('event-starttime');
    const endTimeInput = document.getElementById('event-endtime');

    // Auto-populate building name input when a classroom is selected
    roomSelect.addEventListener('change', () => {
        const roomId = roomSelect.value;
        locationInput.value = roomBuildingMap[roomId] || '';
        handleRoomSelection(roomId);
    });

    // 1. Kiosk QR scan parameter parsing & lock-down logic
    const urlParams = new URLSearchParams(window.location.search);
    const paramRoomId = urlParams.get('room_id');
    
    if (paramRoomId && roomBuildingMap[paramRoomId]) {
        // Auto-select classroom
        roomSelect.value = paramRoomId;
        locationInput.value = roomBuildingMap[paramRoomId];
        
        // Lock the drop-down to keep context secure
        roomSelect.disabled = true;
        roomSelect.style.backgroundColor = '#eaeaea';
        roomSelect.style.cursor = 'not-allowed';
        
        // Append locked label under select tag
        const lockLabel = document.createElement('span');
        lockLabel.style.fontSize = '12px';
        lockLabel.style.color = '#450012';
        lockLabel.style.fontWeight = 'bold';
        lockLabel.style.marginTop = '6px';
        lockLabel.style.display = 'block';
        lockLabel.textContent = '🔒 Bound strictly by door-side kiosk scan context.';
        roomSelect.parentNode.appendChild(lockLabel);
    }

    // Set default reservation date/time inputs (current hour and +1 hour)
    const now = new Date();
    now.setMinutes(0, 0, 0); // Round down to start of hour
    
    const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
    const twoHoursLater = new Date(now.getTime() + (120 * 60 * 1000));

    startTimeInput.value = formatLocalDateToISO(oneHourLater);
    endTimeInput.value = formatLocalDateToISO(twoHoursLater);

    // Dynamic End Date & Time Sync (Smart Auto-Sync)
    startTimeInput.addEventListener('change', () => {
        setupDateSync();
    });

    // Clear active slot highlights when pickers are edited manually
    const clearActivePillHighlight = () => {
        const slotsContainer = document.getElementById('recommended-slots-container');
        if (slotsContainer) {
            slotsContainer.querySelectorAll('.recommended-slot-pill.active')
                .forEach(pill => pill.classList.remove('active'));
        }
        selectedThirtyMinuteSlots.clear();
        updateSelectedSlotsSummary();
    };
    startTimeInput.addEventListener('change', clearActivePillHighlight);
    startTimeInput.addEventListener('input', clearActivePillHighlight);
    endTimeInput.addEventListener('change', clearActivePillHighlight);
    endTimeInput.addEventListener('input', clearActivePillHighlight);

    // Month Navigation Listeners
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            renderCalendar();
        });
    }

    // Initialize searchable autocomplete dropdowns
    initSearchableDropdown(roomSelect);
    initSearchableDropdown(document.getElementById('host-role'));

    // Setup Host Name Autocomplete Suggestion Logic
    const hostNameInput = document.getElementById('host-name');
    const hostEmailInput = document.getElementById('host-email');
    const hostRoleSelect = document.getElementById('host-role');
    const suggestionBox = document.getElementById('host-suggestion-box');
    const suggestedNameSpan = document.getElementById('suggested-host-name');
    const suggestedEmailSpan = document.getElementById('suggested-host-email');

    function applyHostAutofill() {
        if (suggestedHost) {
            hostNameInput.value = suggestedHost.name;
            hostEmailInput.value = suggestedHost.email;
            if (suggestedHost.role && hostRoleSelect) {
                setSearchableDropdownValue(hostRoleSelect, suggestedHost.role);
            }
            showToast(`👥 Loaded host profile for ${suggestedHost.name}!`, 'success');
            suggestedHost = null;
            suggestionBox.style.display = 'none';
        }
    }

    if (hostNameInput && suggestionBox) {
        hostNameInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length >= 3) {
                const matched = existingHosts.find(h => h.name.toLowerCase().includes(query));
                if (matched) {
                    suggestedHost = matched;
                    suggestedNameSpan.textContent = matched.name;
                    suggestedEmailSpan.textContent = matched.email;
                    suggestionBox.style.display = 'block';
                } else {
                    suggestedHost = null;
                    suggestionBox.style.display = 'none';
                }
            } else {
                suggestedHost = null;
                suggestionBox.style.display = 'none';
            }
        });

        // Clicking anywhere on the suggestion box applies the autofill
        suggestionBox.addEventListener('click', applyHostAutofill);
    }

    // Load host profiles asynchronously in the background
    loadExistingHosts();

    // Trigger initial loading if pre-selected
    if (roomSelect.value) {
        handleRoomSelection(roomSelect.value);
    }
});

/* ── Progressive Booking Wizard Controllers ───────────────────────────────── */
function updateWizardStepUI() {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.style.display = 'none';
    });

    // Show active step
    document.getElementById(`step-${currentStep}`).style.display = 'block';

    // Update step progress nodes
    for (let i = 1; i <= 3; i++) {
        const node = document.getElementById(`node-${i}`);
        const connector = document.getElementById(`connector-${i}`);
        
        if (i < currentStep) {
            node.className = 'step-progress-node completed';
            if (connector) connector.className = 'step-progress-connector completed';
        } else if (i === currentStep) {
            node.className = 'step-progress-node active';
            if (connector) connector.className = 'step-progress-connector';
        } else {
            node.className = 'step-progress-node';
            if (connector) connector.className = 'step-progress-connector';
        }
    }
}

function validateStep(step) {
    if (step === 1) {
        const hostName = document.getElementById('host-name').value.trim();
        const hostEmail = document.getElementById('host-email').value.trim();
        const hostRole = document.getElementById('host-role').value;

        if (!hostName || !hostEmail || !hostRole) {
            showToast('Please complete all required fields.', 'warning');
            return false;
        }

        // Email validation
        const emailLower = hostEmail.toLowerCase();
        if (hostRole === 'Faculty') {
            if (!emailLower.endsWith('@wtamu.edu')) {
                showToast('Faculty role requires a secure academic email ending with @wtamu.edu.', 'warning');
                return false;
            }
        } else {
            if (!emailLower.endsWith('@buffs.wtamu.edu') && !emailLower.endsWith('@wtamu.edu')) {
                showToast('Student, Staff, and Org roles require a valid WTAMU email (@buffs.wtamu.edu or @wtamu.edu).', 'warning');
                return false;
            }
        }
    } else if (step === 2) {
        const eventType = document.getElementById('event-type').value;
        const eventGuests = document.getElementById('event-guests').value;

        if (!eventType) {
            showToast('Please select a reservation type.', 'warning');
            return false;
        }

        if (eventType === 'course-lecture' || eventType === 'course-lab') {
            const dept = document.getElementById('course-dept').value.trim();
            const num = document.getElementById('course-number').value.trim();
            const sec = document.getElementById('course-section').value.trim();
            const name = document.getElementById('course-name').value.trim();

            if (!dept || !num || !sec || !name) {
                showToast('Please fill in all course fields: department, number, section, and course name.', 'warning');
                return false;
            }
            if (!/^\d{4}$/.test(num)) {
                showToast('Course number must be exactly 4 digits (e.g. 3312).', 'warning');
                return false;
            }
            if (!/^\d{2,3}$/.test(sec)) {
                showToast('Section must be 2 or 3 digits (e.g. 70).', 'warning');
                return false;
            }
        } else {
            const eventTitle = document.getElementById('event-title').value.trim();
            if (!eventTitle) {
                showToast('Please provide an event title.', 'warning');
                return false;
            }
        }

        if (!eventGuests || parseInt(eventGuests, 10) < 1) {
            showToast('Please specify expected participants (minimum 1).', 'warning');
            return false;
        }
    }
    return true;
}

/* ── Event Type Handling ──────────────────────────────────────────────────── */
function handleEventTypeChange() {
    const eventType = document.getElementById('event-type').value;
    const isCourse = eventType === 'course-lecture' || eventType === 'course-lab';

    document.getElementById('course-fields').style.display = isCourse ? 'block' : 'none';
    document.getElementById('event-title-field').style.display = isCourse ? 'none' : 'block';
    document.getElementById('event-description-field').style.display = isCourse ? 'none' : 'block';

    // Auto-select recurring for course types
    const scheduleTypeEl = document.getElementById('schedule-type');
    if (scheduleTypeEl) {
        scheduleTypeEl.value = isCourse ? 'recurring' : 'one-time';
        handleScheduleTypeChange();
    }
}

function updateCourseTitlePreview() {
    const dept = document.getElementById('course-dept').value.trim().toUpperCase();
    const num = document.getElementById('course-number').value.trim();
    const sec = document.getElementById('course-section').value.trim();
    const name = document.getElementById('course-name').value.trim();
    const preview = document.getElementById('course-title-preview');
    const previewText = document.getElementById('course-title-preview-text');

    if (dept || num || sec || name) {
        const parts = [dept, num ? (sec ? `${num}-${sec}` : num) : ''].filter(Boolean).join(' ');
        previewText.textContent = [parts, name].filter(Boolean).join(' — ');
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

// Returns the effective event title based on type
function getResolvedEventTitle() {
    const eventType = document.getElementById('event-type').value;
    const isCourse = eventType === 'course-lecture' || eventType === 'course-lab';

    if (isCourse) {
        const dept = document.getElementById('course-dept').value.trim().toUpperCase();
        const num = document.getElementById('course-number').value.trim();
        const sec = document.getElementById('course-section').value.trim();
        const name = document.getElementById('course-name').value.trim();
        const code = [dept, sec ? `${num}-${sec}` : num].filter(Boolean).join(' ');
        const suffix = eventType === 'course-lab' ? '(Lab)' : '';
        return [code, name, suffix].filter(Boolean).join(' — ').trim();
    }

    return document.getElementById('event-title').value.trim();
}

/* ── Recurring Schedule Handling ─────────────────────────────────────────── */
function handleScheduleTypeChange() {
    const val = document.getElementById('schedule-type').value;
    const isRecurring = val === 'recurring';
    document.getElementById('one-time-schedule').style.display = isRecurring ? 'none' : 'block';
    document.getElementById('recurring-schedule').style.display = isRecurring ? 'block' : 'none';
    // Recompute/clear the calendar series highlight when the mode changes
    updateRecurrencePreview();
}

function handleSecondScheduleToggle() {
    const checked = document.getElementById('add-second-schedule').checked;
    document.getElementById('second-schedule-section').style.display = checked ? 'block' : 'none';
    updateRecurrencePreview();
}

function getCheckedDays(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(cb => parseInt(cb.value, 10));
}

function generateRecurringDates(days, semesterStart, semesterEnd, startTime, endTime) {
    const results = [];
    const current = new Date(semesterStart + 'T00:00:00');
    const end = new Date(semesterEnd + 'T23:59:59');

    while (current <= end) {
        const dow = current.getDay(); // 0=Sun 1=Mon ... 5=Fri 6=Sat
        if (days.includes(dow)) {
            const dateStr = current.toISOString().split('T')[0];
            results.push({ start: `${dateStr}T${startTime}`, end: `${dateStr}T${endTime}` });
        }
        current.setDate(current.getDate() + 1);
    }
    return results;
}

let recurringSeriesDates = new Set();

// Recompute the set of dates (YYYY-MM-DD) the current recurring setup will book,
// so the calendar can highlight the whole series across every month.
function computeRecurringSeriesDates() {
    recurringSeriesDates = new Set();
    const schedType = document.getElementById('schedule-type');
    if (!schedType || schedType.value !== 'recurring') return;
    const semStart = document.getElementById('semester-start').value;
    const semEnd = document.getElementById('semester-end').value;
    const days = getCheckedDays('recur-day');
    if (!semStart || !semEnd || days.length === 0) return;
    const startT = document.getElementById('recur-start-time').value || '00:00';
    const endT = document.getElementById('recur-end-time').value || '00:00';
    generateRecurringDates(days, semStart, semEnd, startT, endT)
        .forEach(d => recurringSeriesDates.add(d.start.split('T')[0]));
    const second = document.getElementById('add-second-schedule');
    if (second && second.checked) {
        const days2 = getCheckedDays('recur-day-2');
        const s2 = document.getElementById('recur-start-time-2').value || '00:00';
        const e2 = document.getElementById('recur-end-time-2').value || '00:00';
        if (days2.length > 0) {
            generateRecurringDates(days2, semStart, semEnd, s2, e2)
                .forEach(d => recurringSeriesDates.add(d.start.split('T')[0]));
        }
    }
}

// Toggle the recurring-series highlight on the currently rendered calendar cells.
function applyCalendarSeriesHighlight() {
    const daysGrid = document.getElementById('calendar-days-grid');
    if (!daysGrid) return;
    const pad = (n) => String(n).padStart(2, '0');
    daysGrid.querySelectorAll('.calendar-day:not(.empty)').forEach(cell => {
        const dayNum = parseInt(cell.textContent, 10);
        if (!dayNum) return;
        const ds = `${calendarYear}-${pad(calendarMonth + 1)}-${pad(dayNum)}`;
        cell.classList.toggle('recurring-series', recurringSeriesDates.has(ds));
    });
}

// In recurring mode, pre-select (highlight) the 30-minute slots that fall within
// the entered class start/end time on the currently open day.
function preselectRecurSlots(slots) {
    const schedType = document.getElementById('schedule-type');
    if (!schedType || schedType.value !== 'recurring' || !Array.isArray(slots)) return;
    const rs = document.getElementById('recur-start-time').value;
    const re = document.getElementById('recur-end-time').value;
    if (!rs || !re) return;
    const toMin = (t) => { const p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };
    const startMin = toMin(rs);
    const endMin = toMin(re);
    selectedThirtyMinuteSlots.clear();
    slots.forEach(slot => {
        if (slot && !slot.isReserved && slot.startMin >= startMin && slot.endMin <= endMin) {
            selectedThirtyMinuteSlots.add(slot.index);
        }
    });
    const container = document.getElementById('recommended-slots-container');
    if (container) {
        container.querySelectorAll('.recommended-slot-pill').forEach(pill => {
            const idx = parseInt(pill.dataset.slotIndex, 10);
            pill.classList.toggle('active', selectedThirtyMinuteSlots.has(idx));
        });
    }
    if (typeof updateSelectedSlotsSummary === 'function') updateSelectedSlotsSummary();
}

function updateRecurrencePreview() {
    const previewBox = document.getElementById('recurrence-preview');
    if (!previewBox) return;

    // Refresh the calendar's full-series highlight whenever recurring inputs change.
    computeRecurringSeriesDates();
    applyCalendarSeriesHighlight();

    const semStart = document.getElementById('semester-start').value;
    const semEnd = document.getElementById('semester-end').value;
    const startTime = document.getElementById('recur-start-time').value;
    const endTime = document.getElementById('recur-end-time').value;
    const days = getCheckedDays('recur-day');

    if (!semStart || !semEnd || !startTime || !endTime || days.length === 0) {
        previewBox.style.display = 'none';
        return;
    }

    const primaryDates = generateRecurringDates(days, semStart, semEnd, startTime, endTime);
    let totalCount = primaryDates.length;
    let message = `${totalCount} reservation${totalCount !== 1 ? 's' : ''} will be created`;

    const addSecond = document.getElementById('add-second-schedule').checked;
    if (addSecond) {
        const days2 = getCheckedDays('recur-day-2');
        const start2 = document.getElementById('recur-start-time-2').value;
        const end2 = document.getElementById('recur-end-time-2').value;
        if (days2.length > 0 && start2 && end2) {
            const secondDates = generateRecurringDates(days2, semStart, semEnd, start2, end2);
            totalCount += secondDates.length;
            message = `${primaryDates.length} lecture + ${secondDates.length} lab = ${totalCount} total reservations`;
        }
    }

    previewBox.textContent = message;
    previewBox.style.display = 'block';
}

/* ── Batch Submission (Recurring) ─────────────────────────────────────────── */
async function batchSubmitReservations(hostName, hostEmail, hostRole, eventTitle, eventDescription, eventRequirement, eventGuests, eventLocation, roomId, allDates) {
    const progressOverlay = document.getElementById('batch-progress-overlay');
    const progressBar = document.getElementById('batch-progress-bar');
    const progressText = document.getElementById('batch-progress-text');
    const progressStatus = document.getElementById('batch-progress-status');

    progressOverlay.style.display = 'flex';
    const total = allDates.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < allDates.length; i++) {
        const slot = allDates[i];
        progressText.textContent = `Submitting ${i + 1} of ${total}...`;
        progressStatus.textContent = `${new Date(slot.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — ${slot.start.split('T')[1]} to ${slot.end.split('T')[1]}`;
        progressBar.style.width = `${Math.round(((i + 1) / total) * 100)}%`;

        const payload = {
            host: { name: hostName, email: hostEmail, role: hostRole },
            event: {
                title: eventTitle,
                description: eventDescription || null,
                requirement: eventRequirement || null,
                numberParticipant: eventGuests,
                location: eventLocation,
                startTime: slot.start,
                endTime: slot.end
            },
            roomId: roomId,
            reservation_status: 'confirmed'
        };

        const result = await createReservation(payload);
        if (result.success) { successCount++; } else { failCount++; }

        // Small pause between requests to avoid overwhelming the API
        await new Promise(r => setTimeout(r, 120));
    }

    progressOverlay.style.display = 'none';
    progressBar.style.width = '0%';

    // Show batch success modal
    const msg = failCount === 0
        ? `All ${successCount} reservations were scheduled successfully.`
        : `${successCount} of ${total} reservations were created. ${failCount} failed -- check the schedule dashboard and retry as needed.`;

    document.getElementById('batch-success-message').textContent = msg;
    document.getElementById('batch-success-overlay').style.display = 'flex';
}

function goToNextStep(step) {
    if (validateStep(step)) {
        currentStep = step + 1;
        updateWizardStepUI();
        
        // Scroll form container to top on transition
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }
}

function goToPrevStep(step) {
    currentStep = step - 1;
    updateWizardStepUI();
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

/* ── Smart Scheduling & Time Autocomplete ─────────────────────────────────── */
function setupDateSync() {
    const startTimeInput = document.getElementById('event-starttime');
    const endTimeInput = document.getElementById('event-endtime');
    
    if (!startTimeInput.value) return;
    
    const startVal = new Date(startTimeInput.value);
    
    // Auto-sync end date to match start date, and time to +1 hour
    const endRecommended = new Date(startVal.getTime() + (60 * 60 * 1000));
    endTimeInput.value = formatLocalDateToISO(endRecommended);
}

/* ── Interactive Classroom Caching & Loading ─────────────────────────────── */
async function handleRoomSelection(roomId) {
    const alertBox = document.getElementById('classroom-availability-alert');
    const calendarSection = document.getElementById('classroom-calendar-section');
    const timeHelperPanel = document.getElementById('time-helper-panel');

    // Reset UI
    alertBox.style.display = 'none';
    calendarSection.style.display = 'none';
    timeHelperPanel.style.display = 'none';
    cachedRoomReservations = [];

    if (!roomId) {
        alertBox.style.display = 'block';
        alertBox.textContent = '💡 Select a classroom to view its interactive availability calendar.';
        return;
    }

    // Check status map first
    const roomStatus = roomStatusMap[roomId.toString()];
    if (roomStatus === 'reserved' || roomStatus === 'maintenance') {
        alertBox.style.display = 'block';
        alertBox.className = 'classroom-availability-alert warning';
        alertBox.innerHTML = `⚠️ <strong>Room Unavailable</strong>: This classroom is globally seeded as <strong>${roomStatus}</strong> inside the database. No reservations can be scheduled.`;
        return;
    }

    alertBox.style.display = 'block';
    alertBox.className = 'classroom-availability-alert loading';
    alertBox.textContent = '🔄 Loading classroom availability data...';

    try {
        const reservations = await getReservations();
        if (reservations) {
            // Cache active bookings matching selected roomId
            cachedRoomReservations = reservations.filter(r => 
                r.room_id === parseInt(roomId, 10) && 
                r.reservation_status.toLowerCase() !== 'cancelled'
            );
            
            alertBox.style.display = 'none';
            calendarSection.style.display = 'block';
            renderCalendar();
        } else {
            alertBox.style.display = 'block';
            alertBox.className = 'classroom-availability-alert error';
            alertBox.textContent = '❌ Failed to fetch room schedules. Please try again.';
        }
    } catch (e) {
        alertBox.style.display = 'block';
        alertBox.className = 'classroom-availability-alert error';
        alertBox.textContent = `❌ Network Error: ${e.message}`;
    }
}

/* ── Month-by-Month Calendar Grid Builder ─────────────────────────────────── */
function renderCalendar() {
    const monthYearEl = document.getElementById('calendar-month-year');
    const daysGrid = document.getElementById('calendar-days-grid');
    
    if (!monthYearEl || !daysGrid) return;

    daysGrid.innerHTML = '';

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    monthYearEl.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    // Get first day of the month and total number of days
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    // Render spacer empty cells before the first day
    for (let i = 0; i < firstDayIndex; i++) {
        const spacer = document.createElement('div');
        spacer.className = 'calendar-day empty';
        daysGrid.appendChild(spacer);
    }

    // Get today's local date for calendar rendering
    const today = new Date();
    today.setHours(0,0,0,0);

    // Paint cells for each day
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        const currentDayDate = new Date(calendarYear, calendarMonth, day);
        
        // Highlight past days
        if (currentDayDate < today) {
            dayCell.classList.add('past');
        }

        // Format day to standard date string (YYYY-MM-DD)
        const pad = (num) => String(num).padStart(2, '0');
        const dateString = `${calendarYear}-${pad(calendarMonth + 1)}-${pad(day)}`;

        // Highlight dates that belong to the recurring series being built
        if (recurringSeriesDates.has(dateString)) {
            dayCell.classList.add('recurring-series');
        }

        // Check reservations for this date
        const dayBookings = cachedRoomReservations.filter(r => {
            const start = new Date(r.startTime);
            const end = new Date(r.endTime);
            // set times to midnight for date match
            const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const dEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            return currentDayDate >= dStart && currentDayDate <= dEnd;
        });

        // Availability indicator dot
        const dot = document.createElement('span');
        dot.className = 'day-indicator-dot';

        if (dayBookings.length === 0) {
            dayCell.classList.add('available');
            dot.classList.add('status-available');
        } else {
            // Check if fully occupied during academic hours (7:00 AM - 11:00 PM = 16 hours)
            let totalOccupiedMinutes = 0;
            // Simplified overlap accumulator
            dayBookings.forEach(b => {
                const bStart = new Date(b.startTime);
                const bEnd = new Date(b.endTime);
                
                // clip to selected day
                const clipStart = new Date(Math.max(bStart.getTime(), new Date(calendarYear, calendarMonth, day, 7, 0).getTime()));
                const clipEnd = new Date(Math.min(bEnd.getTime(), new Date(calendarYear, calendarMonth, day, 23, 0).getTime()));
                
                if (clipStart < clipEnd) {
                    totalOccupiedMinutes += (clipEnd - clipStart) / (1000 * 60);
                }
            });

            if (totalOccupiedMinutes >= 16 * 60) {
                dayCell.classList.add('fully-booked');
                dot.classList.add('status-fully');
            } else {
                dayCell.classList.add('partially-booked');
                dot.classList.add('status-partial');
            }
        }
        
        dayCell.appendChild(dot);

        // Highlight currently selected day
        if (selectedDayString === dateString) {
            dayCell.classList.add('active-selected');
        }

        // Click listener to select date and populate helper slots
        dayCell.addEventListener('click', () => {
            // Remove previous active selection class
            const activeCell = daysGrid.querySelector('.active-selected');
            if (activeCell) activeCell.classList.remove('active-selected');

            dayCell.classList.add('active-selected');
            selectedDayString = dateString;

            selectCalendarDay(day, calendarMonth, calendarYear, dayBookings);
        });

        daysGrid.appendChild(dayCell);
    }
}
/* ── Select Date and Populate Available Slot Pills ────────────────────────── */
function selectCalendarDay(day, month, year, dayBookings) {
    // Cache the active day details for dropdown re-renders
    activeSelectedDay = day;
    activeSelectedMonth = month;
    activeSelectedYear = year;
    activeSelectedDayBookings = dayBookings;
    selectedThirtyMinuteSlots.clear();

    // Recurring (course) helper: clicking a calendar date ticks the matching
    // weekday pill and seeds the semester start date, so the recurring schedule
    // auto-fills from the calendar instead of requiring manual entry.
    const schedTypeSel = document.getElementById('schedule-type');
    if (schedTypeSel && schedTypeSel.value === 'recurring') {
        const pickedDate = new Date(year, month, day);
        const dow = pickedDate.getDay(); // 0=Sun ... 6=Sat (Mon-Fri = 1-5 match the pills)
        const dayPill = document.querySelector(`input[name="recur-day"][value="${dow}"]`);
        if (dayPill) dayPill.checked = true;
        const semStartInput = document.getElementById('semester-start');
        if (semStartInput && !semStartInput.value) {
            const pad2 = (n) => String(n).padStart(2, '0');
            semStartInput.value = `${year}-${pad2(month + 1)}-${pad2(day)}`;
        }
        if (typeof updateRecurrencePreview === 'function') updateRecurrencePreview();
    }

    const timeHelperPanel = document.getElementById('time-helper-panel');
    const selectedDateEl = document.getElementById('time-helper-selected-date');
    const timelineContainer = document.getElementById('daily-timeline-container');
    
    if (!timeHelperPanel || !selectedDateEl || !timelineContainer) return;

    const pad = (num) => String(num).padStart(2, '0');
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    selectedDateEl.textContent = `📅 Daily Schedule: ${monthNames[month]} ${day}, ${year}`;
    timeHelperPanel.style.display = 'block';

    // RENDER TIMELINE OF BOOKINGS
    timelineContainer.innerHTML = '';
    if (dayBookings.length === 0) {
        timelineContainer.innerHTML = '<div class="timeline-empty">🎉 No scheduled reservations for this date. The room is fully open!</div>';
    } else {
        dayBookings.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).forEach(b => {
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

    // GENERATE RECOMMENDED FREE SLOTS
    generateRecommendedTimeSlots(day, month, year, dayBookings);
}

function generateRecommendedTimeSlots(day, month, year, dayBookings) {
    const slotsContainer = document.getElementById('recommended-slots-container');
    const slotsSection = document.getElementById('recommended-slots-section');
    if (!slotsContainer || !slotsSection) return;

    slotsContainer.innerHTML = '';

    updateSelectedSlotsSummary();
    const durationType = '1';

    // Target operating hours: 7:00 AM - 11:00 PM
    const startDayMin = 7 * 60; // 420
    const endDayMin = 23 * 60;   // 1380
    const totalIntervals = (endDayMin - startDayMin) / 30; // 32 intervals

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

    const formatMinutesTo12h = (totalMins) => {
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        const suffix = h >= 12 ? 'PM' : 'AM';
        const dispH = h % 12 === 0 ? 12 : h % 12;
        const dispM = m === 0 ? '00' : String(m).padStart(2, '0');
        return `${dispH}:${dispM} ${suffix}`;
    };

    const recommendedSlots = Array.from({ length: totalIntervals }, (_, index) => ({
        index,
        startMin: startDayMin + index * 30,
        endMin: startDayMin + (index + 1) * 30,
        isReserved: !isFree[index]
    }));

    if (recommendedSlots.length === 0) {
        slotsContainer.innerHTML = '<span class="no-slots-alert">⚠️ No recommended free time slots available on this date.</span>';
    } else {
        recommendedSlots.forEach(slot => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'recommended-slot-pill';
            pill.dataset.slotIndex = String(slot.index);

            if (durationType === 'continuous') {
                const durationHours = (slot.endMin - slot.startMin) / 60;
                const durationLabel = durationHours === 1 ? '1h' : `${durationHours}h`;
                pill.textContent = `${formatMinutesTo12h(slot.startMin)} - ${formatMinutesTo12h(slot.endMin)} (${durationLabel} free)`;
            } else {
                if (slot.isReserved) {
                    pill.textContent = `🔒 ${formatMinutesTo12h(slot.startMin)} - ${formatMinutesTo12h(slot.endMin)} (Reserved)`;
                    pill.classList.add('reserved');
                    pill.disabled = true;
                } else {
                    pill.textContent = `${formatMinutesTo12h(slot.startMin)} - ${formatMinutesTo12h(slot.endMin)}`;
                }
            }

            // Click listener only for non-reserved slots
            if (!slot.isReserved) {
                pill.addEventListener('click', () => {
                    toggleThirtyMinuteSlot(slot.index, recommendedSlots, day, month, year, formatMinutesTo12h);
                });
            }

            slotsContainer.appendChild(pill);
        });
    }

    // In recurring mode, pre-select the slots matching the entered class time
    preselectRecurSlots(recommendedSlots);
}

function toggleThirtyMinuteSlot(slotIndex, slots, day, month, year, formatMinutesTo12h) {
    if (selectedThirtyMinuteSlots.has(slotIndex)) {
        selectedThirtyMinuteSlots.delete(slotIndex);
    } else {
        const candidateSlots = new Set(selectedThirtyMinuteSlots);
        candidateSlots.add(slotIndex);
        const sorted = Array.from(candidateSlots).sort((a, b) => a - b);
        const hasGap = sorted.some((value, index) => index > 0 && value !== sorted[index - 1] + 1);

        if (hasGap) {
            selectedThirtyMinuteSlots = new Set([slotIndex]);
            showToast('Start a new reservation range, then select adjacent 30-minute blocks.', 'warning');
        } else {
            selectedThirtyMinuteSlots = candidateSlots;
        }
    }

    applyThirtyMinuteSelection(slots, day, month, year, formatMinutesTo12h);
}

function applyThirtyMinuteSelection(slots, day, month, year, formatMinutesTo12h) {
    const slotsContainer = document.getElementById('recommended-slots-container');
    const startTimeInput = document.getElementById('event-starttime');
    const endTimeInput = document.getElementById('event-endtime');

    if (!slotsContainer || !startTimeInput || !endTimeInput) return;

    slotsContainer.querySelectorAll('.recommended-slot-pill').forEach(pill => {
        const index = parseInt(pill.dataset.slotIndex, 10);
        pill.classList.toggle('active', selectedThirtyMinuteSlots.has(index));
    });

    if (selectedThirtyMinuteSlots.size === 0) {
        updateSelectedSlotsSummary();
        return;
    }

    const sortedIndexes = Array.from(selectedThirtyMinuteSlots).sort((a, b) => a - b);
    const firstSlot = slots[sortedIndexes[0]];
    const lastSlot = slots[sortedIndexes[sortedIndexes.length - 1]];
    const pad = (num) => String(num).padStart(2, '0');
    const startH = Math.floor(firstSlot.startMin / 60);
    const startM = firstSlot.startMin % 60;
    const endH = Math.floor(lastSlot.endMin / 60);
    const endM = lastSlot.endMin % 60;

    startTimeInput.value = `${year}-${pad(month + 1)}-${pad(day)}T${pad(startH)}:${pad(startM)}`;
    endTimeInput.value = `${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(endM)}`;

    // In recurring (course) mode, also fill the class start/end time fields from the
    // picked slots so the calendar selection populates the recurring schedule too.
    const schedTypeEl = document.getElementById('schedule-type');
    if (schedTypeEl && schedTypeEl.value === 'recurring') {
        const recurStartInput = document.getElementById('recur-start-time');
        const recurEndInput = document.getElementById('recur-end-time');
        if (recurStartInput) recurStartInput.value = `${pad(startH)}:${pad(startM)}`;
        if (recurEndInput) recurEndInput.value = `${pad(endH)}:${pad(endM)}`;
        if (typeof updateRecurrencePreview === 'function') updateRecurrencePreview();
    }

    const durationMinutes = selectedThirtyMinuteSlots.size * 30;
    const durationLabel = durationMinutes < 60 ? `${durationMinutes} minutes` : `${durationMinutes / 60} hours`;
    const startLabel = formatMinutesTo12h(firstSlot.startMin);
    const endLabel = formatMinutesTo12h(lastSlot.endMin);

    updateSelectedSlotsSummary(`${startLabel} to ${endLabel} (${durationLabel})`);
    showToast(`Selected reservation time: ${startLabel} to ${endLabel}.`, 'success');
}

function updateSelectedSlotsSummary(summaryText = 'Select adjacent blocks to build your reservation.') {
    const summary = document.getElementById('selected-slots-summary');
    if (summary) {
        summary.textContent = summaryText;
    }
}

// Helper function to format local Date objects to 'YYYY-MM-DDTHH:MM' required by datetime-local input fields
function formatLocalDateToISO(date) {
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
}

function serializeLocalDateTimeForApi(inputValue) {
    if (!inputValue) return null;
    return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

// Handles submitting the classroom reservation
async function submitReservation(event) {
    event.preventDefault();

    const warningBox = document.getElementById('validation-warning');
    warningBox.style.display = 'none';
    warningBox.textContent = '';

    // Collect values from the form
    const hostName = document.getElementById('host-name').value.trim();
    const hostEmail = document.getElementById('host-email').value.trim();
    const hostRole = document.getElementById('host-role').value;

    const eventTitle = getResolvedEventTitle();
    const eventDescription = document.getElementById('event-description').value.trim();
    const eventRequirement = document.getElementById('event-requirement').value.trim();
    const eventGuests = parseInt(document.getElementById('event-guests').value, 10);
    const eventLocation = document.getElementById('event-location').value;
    const scheduleType = document.getElementById('schedule-type').value;

    // Read room select value even if disabled (from kiosk QR context)
    const roomSelect = document.getElementById('room-id');
    const roomId = parseInt(roomSelect.value, 10);

    if (!roomId) {
        warningBox.textContent = 'Validation Error: Please select a valid classroom.';
        warningBox.style.display = 'block';
        warningBox.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // 1.5. Dynamic Room Availability Validation (Reserved or under Maintenance)
    const roomStatus = roomStatusMap[roomId.toString()];
    if (roomStatus === 'reserved' || roomStatus === 'maintenance') {
        const errorMsg = 'Validation failed: Room is not available (Reserved or under Maintenance)';
        warningBox.textContent = errorMsg;
        warningBox.style.display = 'block';
        warningBox.scrollIntoView({ behavior: 'smooth' });
        showToast(errorMsg, 'error');
        return;
    }

    // ── RECURRING BRANCH ──────────────────────────────────────────────────
    if (scheduleType === 'recurring') {
        const semStart = document.getElementById('semester-start').value;
        const semEnd = document.getElementById('semester-end').value;
        const recurStart = document.getElementById('recur-start-time').value;
        const recurEnd = document.getElementById('recur-end-time').value;
        const days = getCheckedDays('recur-day');

        if (!semStart || !semEnd || !recurStart || !recurEnd || days.length === 0) {
            warningBox.textContent = 'Recurring Validation: Please select at least one day of the week, class times, and semester start/end dates.';
            warningBox.style.display = 'block';
            warningBox.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (new Date(semStart) >= new Date(semEnd)) {
            warningBox.textContent = 'Recurring Validation: Semester end date must be after start date.';
            warningBox.style.display = 'block';
            warningBox.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const hostName = document.getElementById('host-name').value.trim();
        const hostEmail = document.getElementById('host-email').value.trim();
        const hostRole = document.getElementById('host-role').value;

        // Collect all date/time slots
        let allDates = generateRecurringDates(days, semStart, semEnd, recurStart, recurEnd);

        // Optional second schedule (lab/discussion)
        if (document.getElementById('add-second-schedule').checked) {
            const days2 = getCheckedDays('recur-day-2');
            const start2 = document.getElementById('recur-start-time-2').value;
            const end2 = document.getElementById('recur-end-time-2').value;
            if (days2.length > 0 && start2 && end2) {
                allDates = allDates.concat(generateRecurringDates(days2, semStart, semEnd, start2, end2));
                // Sort chronologically
                allDates.sort((a, b) => new Date(a.start) - new Date(b.start));
            }
        }

        if (allDates.length === 0) {
            warningBox.textContent = 'Recurring Validation: No dates found in the selected semester range for the chosen days.';
            warningBox.style.display = 'block';
            warningBox.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const confirmBatch = confirm(`This will create ${allDates.length} reservation${allDates.length !== 1 ? 's' : ''} for the semester. Continue?`);
        if (!confirmBatch) return;

        await batchSubmitReservations(hostName, hostEmail, hostRole, eventTitle, eventDescription, eventRequirement, eventGuests, eventLocation, roomId, allDates);
        return;
    }

    // ── ONE-TIME BRANCH ───────────────────────────────────────────────────
    const startTimeVal = document.getElementById('event-starttime').value;
    const endTimeVal = document.getElementById('event-endtime').value;
    const startObj = new Date(startTimeVal);
    const endObj = new Date(endTimeVal);

    if (startObj >= endObj) {
        warningBox.textContent = 'Validation Error: End time must be after start time.';
        warningBox.style.display = 'block';
        warningBox.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // Academic operating hours validation (7:00 AM - 11:00 PM) on a single day
    const startHour = startObj.getHours() + startObj.getMinutes() / 60;
    const endHour = endObj.getHours() + endObj.getMinutes() / 60;
    const isSameDay = startObj.getFullYear() === endObj.getFullYear() && 
                      startObj.getMonth() === endObj.getMonth() && 
                      startObj.getDate() === endObj.getDate();
    const startsBeforeSeven = startHour < 7;
    const endsAfterEleven = (endHour > 23) || (endHour === 0) || !isSameDay;

    if (startsBeforeSeven || endsAfterEleven) {
        const academicError = 'Validation failed: Reservations can only be scheduled within standard academic operating hours (7:00 AM - 11:00 PM) on a single day.';
        warningBox.textContent = academicError;
        warningBox.style.display = 'block';
        warningBox.scrollIntoView({ behavior: 'smooth' });
        showToast(academicError, 'warning');
        return;
    }

    if (startObj < new Date()) {
        const confirmPast = confirm("Note: You are scheduling a reservation in the past. Proceed?");
        if (!confirmPast) return;
    }

    // 2. Strict Academic Email Verification Rules (KISS & Secure)
    const emailLower = hostEmail.toLowerCase();
    if (hostRole === 'Faculty') {
        if (!emailLower.endsWith('@wtamu.edu')) {
            warningBox.textContent = 'Validation Error: Faculty / Professor role requires a secure academic email ending with @wtamu.edu.';
            warningBox.style.display = 'block';
            warningBox.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    } else {
        // Students, Staff, and Organizations
        if (!emailLower.endsWith('@buffs.wtamu.edu') && !emailLower.endsWith('@wtamu.edu')) {
            warningBox.textContent = 'Validation Error: Student, Staff, and Organization roles require a valid WTAMU academic email (@buffs.wtamu.edu or @wtamu.edu).';
            warningBox.style.display = 'block';
            warningBox.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }

    // Show loading state on submit button
    const submitBtn = document.querySelector('.submit-form-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Validating & Submitting...';
    submitBtn.disabled = true;

    try {
        // 3. Dynamic Booking Overlap Validation
        const reservations = await getReservations();
        if (reservations) {
            // Filter bookings bound to same room that are active (not cancelled)
            const activeRoomBookings = reservations.filter(r => 
                r.room_id === roomId && 
                r.reservation_status.toLowerCase() !== 'cancelled'
            );

            // Check standard interval intersection: startA < endB && startB < endA
            for (const existing of activeRoomBookings) {
                const existingStart = new Date(existing.startTime);
                const existingEnd = new Date(existing.endTime);

                if (startObj < existingEnd && existingStart < endObj) {
                    const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    warningBox.textContent = `⚠️ Scheduling Conflict: This classroom is already reserved for "${existing.event_title}" (Host: ${existing.host_name}) on ${formatDate(existingStart)} from ${formatTime(existingStart)} to ${formatTime(existingEnd)}. Please choose another slot.`;
                    warningBox.style.display = 'block';
                    warningBox.scrollIntoView({ behavior: 'smooth' });
                    
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    return;
                }
            }
        }

        // Shape payload to match FastAPI ReservationCreate Pydantic schema
        const payload = {
            host: {
                name: hostName,
                email: hostEmail,
                role: hostRole
            },
            event: {
                title: eventTitle,
                description: eventDescription || null,
                requirement: eventRequirement || null,
                numberParticipant: eventGuests,
                location: eventLocation,
                startTime: serializeLocalDateTimeForApi(startTimeVal),
                endTime: serializeLocalDateTimeForApi(endTimeVal)
            },
            roomId: roomId,
            reservation_status: "confirmed" // Automatically set to active/confirmed status for display
        };

        const result = await createReservation(payload);

        if (result.success) {
            // Show custom success modal
            document.getElementById('success-overlay').style.display = 'flex';
        } else {
            let errorMsg = 'Failed to create reservation.';
            try {
                // Parse backend error detail if Pydantic validation failed
                const detailObj = JSON.parse(result.error);
                if (detailObj && detailObj.detail) {
                    errorMsg = `Error: ${typeof detailObj.detail === 'string' ? detailObj.detail : JSON.stringify(detailObj.detail)}`;
                }
            } catch (e) {
                errorMsg = `Error: ${result.error || 'Server error'}`;
            }
            warningBox.textContent = errorMsg;
            warningBox.style.display = 'block';
            warningBox.scrollIntoView({ behavior: 'smooth' });
            showToast(errorMsg, 'error');
        }
    } catch (err) {
        warningBox.textContent = `Connection Failure: ${err.message}`;
        warningBox.style.display = 'block';
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
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

    const toastDelayMap = {
        success: 5000,
        info: 5000,
        warning: 8000,
        error: 10000
    };
    const autoRemoveDelay = toastDelayMap[type] || 5000;

    // Auto-remove based on notification severity
    const timeoutId = setTimeout(() => {
        removeToast(toast);
    }, autoRemoveDelay);

    toast.dataset.timeoutId = timeoutId;
}

function removeToast(toast) {
    if (toast.classList.contains('fade-out')) return;
    toast.classList.add('fade-out');
    clearTimeout(parseInt(toast.dataset.timeoutId, 10));
    toast.addEventListener('animationend', () => {
        toast.remove();
    }, { once: true });

    setTimeout(() => {
        toast.remove();
    }, 450);
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

/* ── Asynchronous Host Pre-fetching & Searchable Dropdown programmatic Sync ── */
async function loadExistingHosts() {
    try {
        const reservations = await getReservations();
        if (reservations && Array.isArray(reservations)) {
            const hostMap = new Map();
            reservations.forEach(r => {
                if (r.host_name && r.host_email) {
                    const nameKey = r.host_name.trim().toLowerCase();
                    if (!hostMap.has(nameKey)) {
                        hostMap.set(nameKey, {
                            name: r.host_name.trim(),
                            email: r.host_email.trim(),
                            role: r.host_role || ''
                        });
                    }
                }
            });
            existingHosts = Array.from(hostMap.values());
            console.log(`Successfully pre-cached ${existingHosts.length} unique host profiles.`);
        }
    } catch (e) {
        console.warn("Background host pre-fetching warning:", e);
    }
}

function setSearchableDropdownValue(selectEl, value) {
    if (!selectEl) return;
    selectEl.value = value;
    
    // Dispatch standard change event
    selectEl.dispatchEvent(new Event('change'));
    
    // Find the custom input inside the custom container to sync the display text!
    const container = selectEl.closest('.custom-select-container');
    if (container) {
        const input = container.querySelector('.custom-select-input');
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        if (input && selectedOption) {
            input.value = selectedOption.text;
        }
        
        // Update styling of .selected class in custom dropdown
        const dropdown = container.querySelector('.custom-select-dropdown');
        if (dropdown) {
            const optionDivs = dropdown.querySelectorAll('.custom-select-option');
            optionDivs.forEach(div => {
                if (div.dataset.value === value) {
                    div.classList.add('selected');
                } else {
                    div.classList.remove('selected');
                }
            });
        }
    }
}
