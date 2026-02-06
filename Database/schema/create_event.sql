CREATE TABLE event (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    requirement VARCHAR(255),
    numberParticipant INT,
    location VARCHAR(255),
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL
);