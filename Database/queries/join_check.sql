SELECT 
    r.reservation_id,
    r.status              AS reservation_status,
    r.createdAt,
    r.endAt,
    rm.room_id,
    rm.number             AS room_number,
    rm.building,
    h.host_id,
    h.name                AS host_name,
    h.role                AS host_role,
    e.event_id,
    e.title               AS event_title,
    e.location,
    e.startTime,
    e.endTime
FROM reservation r
JOIN room  
rm ON r.roomId  = rm.room_id
JOIN host  h  ON r.hostId  = h.host_id
JOIN event e  ON r.eventId = e.event_id
ORDER BY r.reservation_id;