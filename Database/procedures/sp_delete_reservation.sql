CREATE PROCEDURE `sp_delete_reservation`(
    IN p_reservation_id INT
)
BEGIN
    -- These store the host/event IDs linked to the reservation being deleted
    DECLARE v_host_id INT;
    DECLARE v_event_id INT;

    -- These store how many OTHER reservations still reference the same host/event
    DECLARE v_event_refs INT;
    DECLARE v_host_refs INT;

    /*
      This procedure deletes a reservation AND optionally deletes
      the event + host linked to it ONLY if they are no longer
      used by any other reservation.

      Rules:
        - Always delete the reservation
        - Delete the event ONLY if no other reservation uses it
        - Delete the host ONLY if no other reservation uses it

      This prevents orphaned data and keeps the database clean.

      Example call:
        CALL sp_delete_reservation(5);
    */

    -- Roll back everything if any SQL error occurs
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'ERROR: delete failed; transaction rolled back' AS message;
    END;

    /* ------------------------------------------------------------
       VALIDATION: reservation_id must be provided
       ------------------------------------------------------------ */
    IF p_reservation_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'reservation_id is required';
    END IF;

    /* ------------------------------------------------------------
       STEP 1: Look up the host and event linked to this reservation
       ------------------------------------------------------------ */
    SELECT hostId, eventId INTO v_host_id, v_event_id
    FROM reservation
    WHERE reservation_id = p_reservation_id;

    IF v_host_id IS NULL OR v_event_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'reservation_id not found';
    END IF;

    /* ------------------------------------------------------------
       transaction begins
       ------------------------------------------------------------ */
    START TRANSACTION;

        /* --------------------------------------------------------
           STEP 2: Delete the reservation itself
           -------------------------------------------------------- */
        DELETE FROM reservation
        WHERE reservation_id = p_reservation_id;

        /* --------------------------------------------------------
           STEP 3: Check if the event is still used anywhere else
           -------------------------------------------------------- */
        SELECT COUNT(*) INTO v_event_refs
        FROM reservation
        WHERE eventId = v_event_id;

        IF v_event_refs = 0 THEN
            DELETE FROM event WHERE event_id = v_event_id;
        END IF;

        /* --------------------------------------------------------
           STEP 4: Check if the host is still used anywhere else
           -------------------------------------------------------- */
        SELECT COUNT(*) INTO v_host_refs
        FROM reservation
        WHERE hostId = v_host_id;

        IF v_host_refs = 0 THEN
            DELETE FROM host WHERE host_id = v_host_id;
        END IF;

    -- Save all changes
    COMMIT;

    /* 
       RETURN Results:
		- message: 'OK'
         - deleted reservation ID
         - event ID that was checked/deleted
         - host ID that was checked/deleted
    */
    SELECT
        'OK' AS message,
        p_reservation_id AS deleted_reservation_id,
        v_event_id AS affected_event_id,
        v_host_id AS affected_host_id;
END