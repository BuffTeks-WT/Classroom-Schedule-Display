CREATE TABLE room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    equipment VARCHAR(255),
    status VARCHAR(50)
);