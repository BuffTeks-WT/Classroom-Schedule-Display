CREATE PROCEDURE `sp_edit_reservation`(
    IN p_reservation_id INT,

    -- Host fields to update (pass NULL to keep the current value)
    IN p_host_name VARCHAR(100),
    IN p_host_email VARCHAR(150),
    IN p_host_role VARCHAR(50),

    -- Event fields to update (NULL = keep existing)
    IN p_event_title VARCHAR(150),
    IN p_event_description TEXT,
    IN p_event_requirement VARCHAR(255),
    IN p_event_numberParticipant INT,
    IN p_event_location VARCHAR(255),
    IN p_event_startTime DATETIME,
    IN p_event_endTime DATETIME,

    -- Reservation fields to update (NULL = keep existing)
    IN p_roomId INT,
    IN p_reservation_status VARCHAR(50)
)
BEGIN
    -- These will store the IDs of the host and event linked to the reservation
    DECLARE v_host_id INT;
    DECLARE v_event_id INT;

    /*
      This procedure updates an existing reservation AND the
      host + event records that belong to it.

      - Only fields you pass in will be updated.
      - Any NULL parameter means "leave the current value alone".
      - Everything happens inside ONE transaction.
      - If anything fails, the entire update is rolled back.

      Example call:
        CALL sp_edit_reservation(
            1,                     -- reservation_id
            'New Host Name', NULL, NULL,
            'New Title', NULL, NULL, NULL, NULL, NULL, NULL,
            NULL, 'Cancelled'
        );
    */

    -- If any SQL error happens, undo all changes
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'ERROR: edit failed; transaction rolled back' AS message;
    END;

    /* ------------------------------------------------------------
       VALIDATION: Make sure reservation_id was provided
       ------------------------------------------------------------ */
    IF p_reservation_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'reservation_id is required';
    END IF;

    /* 
       STEP 1: Find the host and event linked to this reservation
    */
    SELECT hostId, eventId INTO v_host_id, v_event_id
    FROM reservation
    WHERE reservation_id = p_reservation_id;

    -- If no matching reservation was found
    IF v_host_id IS NULL OR v_event_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'reservation_id not found';
    END IF;

    /* ------------------------------------------------------------
       OPTIONAL VALIDATION: Only validate room if user is changing it
       ------------------------------------------------------------ */
    IF p_roomId IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM room WHERE room_id = p_roomId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'roomId is invalid (room not found)';
    END IF;

    /* ------------------------------------------------------------
       OPTIONAL VALIDATION: Only validate event times if both provided
       ------------------------------------------------------------ */
    IF p_event_startTime IS NOT NULL 
       AND p_event_endTime IS NOT NULL
       AND p_event_startTime >= p_event_endTime THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'event startTime must be before endTime';
    END IF;

    /* ------------------------------------------------------------
       START TRANSACTION
       All updates must worl together.
       ------------------------------------------------------------ */
    START TRANSACTION;

        /* --------------------------------------------------------
           STEP 2: Update HOST record
           COALESCE(newValue, oldValue) keeps old value if NULL
           -------------------------------------------------------- */
        UPDATE host
           SET name  = COALESCE(p_host_name, name),
               email = COALESCE(p_host_email, email),
               role  = COALESCE(p_host_role, role)
         WHERE host_id = v_host_id;

        /* --------------------------------------------------------
           STEP 3: Update EVENT record
           Only updates fields that are NOT NULL
           -------------------------------------------------------- */
        UPDATE event
           SET title             = COALESCE(p_event_title, title),
               description       = COALESCE(p_event_description, description),
               requirement       = COALESCE(p_event_requirement, requirement),
               numberParticipant = COALESCE(p_event_numberParticipant, numberParticipant),
               location          = COALESCE(p_event_location, location),
               startTime         = COALESCE(p_event_startTime, startTime),
               endTime           = COALESCE(p_event_endTime, endTime)
         WHERE event_id = v_event_id;

        /* --------------------------------------------------------
           STEP 4: Update RESERVATION record
           - roomId and status update only if provided
           - endAt always syncs with event.endTime
           -------------------------------------------------------- */
        UPDATE reservation
           SET roomId = COALESCE(p_roomId, roomId),
               status = COALESCE(p_reservation_status, status),
               endAt  = (SELECT endTime FROM event WHERE event_id = v_event_id)
         WHERE reservation_id = p_reservation_id;

    -- Save all changes
    COMMIT;

    /* ------------------------------------------------------------
       RETURN RESULT:
         - message: 'OK'
         - reservation_id: the updated reservation
       ------------------------------------------------------------ */
    SELECT 'OK' AS message, p_reservation_id AS reservation_id;
END