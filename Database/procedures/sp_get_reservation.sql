CREATE PROCEDURE `sp_get_reservations`(
    IN p_reservation_id INT,
    IN p_start_from DATETIME,
    IN p_end_to DATETIME,
    IN p_host_name VARCHAR(100)
)
BEGIN
    /*
      Purpose: Get Procedure returns Reservation details. 
      Return reservation + host + event + room details with filters that are optional.
      Params:
        p_reservation_id : exact reservation_id (NULL = ignore)
        p_start_from     : filter by event window (NULL = ignore)
        p_end_to         : filter by event window (NULL = ignore)
        p_host_name      : partial host name match (NULL = ignore)

      Examples:
        CALL sp_get_reservations(1, NULL, NULL, NULL);
        CALL sp_get_reservations(NULL, '2025-12-01 00:00:00', '2025-12-31 23:59:59', NULL);
        CALL sp_get_reservations(NULL, NULL, NULL, 'Haylee');
    */

    SELECT
        r.reservation_id,
        r.status        AS reservation_status,
        r.createdAt,
        r.endAt,

        rm.room_id,
        rm.number       AS room_number,
        rm.building,
        rm.capacity,
        rm.equipment,
        rm.status       AS room_status,

        h.host_id,
        h.name          AS host_name,
        h.email         AS host_email,
        h.role          AS host_role,

        e.event_id,
        e.title         AS event_title,
        e.description   AS event_description,
        e.requirement   AS event_requirement,
        e.numberParticipant AS event_guests,
        e.location      AS event_location,
        e.startTime,
        e.endTime
    FROM reservation r
    JOIN host h  ON r.hostId = h.host_id
    JOIN event e ON r.eventId = e.event_id
    JOIN room rm ON r.roomId = rm.room_id
    WHERE
        (p_reservation_id IS NULL OR r.reservation_id = p_reservation_id)
        AND (p_host_name IS NULL OR h.name LIKE CONCAT('%', p_host_name, '%'))
        AND (p_start_from IS NULL OR e.endTime >= p_start_from)
        AND (p_end_to IS NULL OR e.startTime <= p_end_to)
    ORDER BY r.reservation_id;
END