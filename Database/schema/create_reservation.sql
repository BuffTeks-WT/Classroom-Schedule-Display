CREATE TABLE reservation (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    roomId INT NOT NULL,
    hostId INT NOT NULL,
    eventId INT NOT NULL,
    status VARCHAR(50),
    createdAt DATETIME NOT NULL,
    endAt DATETIME NOT NULL,

    FOREIGN KEY (roomId) REFERENCES room(room_id),
    FOREIGN KEY (hostId) REFERENCES host(host_id),
    FOREIGN KEY (eventId) REFERENCES event(event_id)
);