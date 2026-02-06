CREATE PROCEDURE `sp_insert_reservation`(
    -- Host information
    IN p_host_name VARCHAR(100),
    IN p_host_email VARCHAR(150),
    IN p_host_role VARCHAR(50),

    -- Event information
    IN p_event_title VARCHAR(150),
    IN p_event_description TEXT,
    IN p_event_requirement VARCHAR(255),
    IN p_event_numberParticipant INT,
    IN p_event_location VARCHAR(255),
    IN p_event_startTime DATETIME,
    IN p_event_endTime DATETIME,

    -- Reservation information
    IN p_roomId INT,
    IN p_reservation_status VARCHAR(50)
)
BEGIN
    -- Variables to store newly created or reused IDs
    DECLARE v_host_id INT;
    DECLARE v_event_id INT;
    DECLARE v_reservation_id INT;

    /*
      -----------------------------------------
      This procedure creates a FULL reservation:
        1. Finds or creates the HOST
        2. Creates the EVENT
        3. Creates the RESERVATION linking host + event + room
      All steps happen inside ONE transaction.
      If anything fails everything rolls back.
      Example:
        CALL sp_insert_reservation(
          'bob brown','bbrown@wtamu.edu','Organizer',
          'Study Session','Final review','Projector',10,'WTAMU Library',
          '2025-12-22 18:00:00','2025-12-22 20:00:00',
          1,'Reserved'
        );
    */

    -- Error handler: if any SQL error occurs, undo everything
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'ERROR: insert failed; transaction rolled back' AS message;
    END;

    /* -------------------------
       VALIDATION CHECKS
       -------------------------
       These ensure required fields are provided
       and prevent invalid data from being inserted.
    */
    IF p_host_name IS NULL OR p_host_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'host name is required';
    END IF;

    IF p_host_email IS NULL OR p_host_email = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'host email is required';
    END IF;

    IF p_event_title IS NULL OR p_event_title = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'event title is required';
    END IF;

    -- Event time must be valid
    IF p_event_startTime IS NULL OR p_event_endTime IS NULL 
       OR p_event_startTime >= p_event_endTime THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'event startTime must be before endTime';
    END IF;

    -- Room must exist
    IF p_roomId IS NULL OR NOT EXISTS (SELECT 1 FROM room WHERE room_id = p_roomId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'roomId is invalid (room not found)';
    END IF;
	
    -- Room must be AVAILABLE (not reserved or under maintenance)
    IF EXISTS (
		SELECT 1 
        FROM room 
        WHERE room_id = p_roomId
			AND status IN ('reserved', 'maintenance')
	) THEN 
		SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'Room is not available (Reserved or under Maintenance)';
	END IF;
    
    /* -------------------------
       START TRANSACTION
       -------------------------
       All inserts must succeed together.
    */
    START TRANSACTION;

        /* -----------------------------------------
           STEP 1: HOST (reuse if email already exists)
           -----------------------------------------
           - If host email exists reuse that host_id
           - If not create a new host
        */
        SELECT host_id INTO v_host_id
        FROM host
        WHERE email = p_host_email
        LIMIT 1;

        IF v_host_id IS NULL THEN
            -- Create new host
            INSERT INTO host(name, email, role)
            VALUES(p_host_name, p_host_email, p_host_role);
            SET v_host_id = LAST_INSERT_ID();
        ELSE
            -- Update existing host info (optional but helpful)
            UPDATE host
               SET name = p_host_name,
                   role = p_host_role
             WHERE host_id = v_host_id;
        END IF;

        /* -----------------------------------------
           STEP 2: EVENT (always create a new event)
           -----------------------------------------
        */
        INSERT INTO event(title, description, requirement, numberParticipant, location, startTime, endTime)
        VALUES(p_event_title, p_event_description, p_event_requirement, p_event_numberParticipant, p_event_location, p_event_startTime, p_event_endTime);
        SET v_event_id = LAST_INSERT_ID();

        /* -----------------------------------------
           STEP 3: RESERVATION
           -----------------------------------------
           - Links room + host + event
           - createdAt = NOW()
           - endAt = event end time
        */
        INSERT INTO reservation(roomId, hostId, eventId, status, createdAt, endAt)
        VALUES(p_roomId, v_host_id, v_event_id, p_reservation_status, NOW(), p_event_endTime);
        SET v_reservation_id = LAST_INSERT_ID();

    -- Save everything
    COMMIT;

    /* -----------------------------------------
       RETURN VALUES (for backend)
       -----------------------------------------
       Backend receives:
         - message: 'OK'
         - reservation_id
         - host_id
         - event_id
    */
    SELECT
        'OK' AS message,
        v_reservation_id AS reservation_id,
        v_host_id AS host_id,
        v_event_id AS event_id;
END