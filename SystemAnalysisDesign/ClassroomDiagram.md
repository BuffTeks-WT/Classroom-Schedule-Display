# 🧩 Classroom Schedule Display — Complete UML & ERD Documentation

This document contains all the core **system design diagrams** for the Classroom Schedule Display Project — built using **Mermaid syntax** for full GitHub Markdown support.

Each section represents a distinct phase of system design:
| Diagram | Focus | Purpose |
|----------|--------|----------|
| **[ERD](#-1-entity-relationship-diagram-erd)** | Data relationships | Database design and structure |
| **[Class Diagram](#-2-class-diagram-uml)** | System structure | Object-oriented logic mapping |
| **[Activity Diagram](#-3-activity-diagram-flowchart)** | Process flow | User journey and system actions |
| **[UI/UX Diagram](#-4-uiux-diagram)** | User interface | User interaction and experience |
| **[Sequence Diagram](#-5-sequence-diagram)** | Interaction over time | Message flow between objects |
| **[Gitflow Diagram](#-6-gitflow-diagram)** | Development workflow | Branching strategy and collaboration |
---

## 🗄️ System Design Diagrams

### 🧱 1. Entity-Relationship Diagram (ERD)
The ERD outlines the core entities and their relationships for managing classroom reservations. Helpful for database schema design and understanding data flow between components for backend development.
```mermaid
---
title: Classroom Reservation Entity-Relationship Diagram
config:
    theme: forest  
---
erDiagram 
    direction BT

    ROOM {
        int room_id
        string number
        string building
        int capacity
        string equipment
        %% statuses: available, reserved, maintenance 
        string status 
    }

    HOST {
        int host_id
        string name
        string email
        string role
    }

    EVENT {
        int event_id
        string title
        string description
        string requirement
        int numberParticipant
        %% location could be room number or virtual link or both
        string location
        datetime startTime
        datetime endTime
    }

    RESERVATION {
        int reservation_id
        int roomId
        int hostId
        int eventId
        %% statuses: pending, confirmed, cancelled
        string status
        datetime createdAt
        datetime endAt
    }

    
    ROOM ||--o{ RESERVATION : has
    HOST ||--o{ RESERVATION : manages
    EVENT ||--o{ RESERVATION : schedules

```

**Explanation:**
- Every entity includes a unique ID for relational integrity.
- **Host** Represents users who create/manage reservations.
- **Room** Contains details about each classroom.
- **Event** Holds information about scheduled activities.
- **Reservation** Links hosts, rooms, and events together.
- **Cardinality**:
  - **ROOM** can exist without a reservation (0..*), but each reservation requires exactly one room.
  - **EVENT** and **HOST** follow a similar one-to-many structure with reservations.
  - Each **Reservation** requires one host, one room, and one event.

---

### 🧱 2. Class Diagram (UML)
The class diagram represents the object-oriented structure of the classroom reservation system. Also useful for database design and backend logic implementation.

```mermaid
---
title: Classroom Reservation Class Diagram
config:
    theme: forest  
---
classDiagram 
    direction BT

    class Room {
        + int id
        + string number
        + string building
        + int capacity
        + string equipment
        + enum status
        + checkAvailability()
        + reserve()
        + cancelReservation()
    }

    class Event {
        + int id
        + string title
        + string description
        + int numberParticipant
        + string requirement
        + string location
        + datetime startTime
        + datetime endTime
        + addReservation()
        + cancelReservation()
    }

    class Host {
        + int id
        + string name
        + string email
        + string role
        + createReservation()
        + cancelReservation()
    }

    class Reservation {
        + int id
        + Room room
        + Host host
        + Event event
        + string status
        + datetime start_time
        + datetime end_time
        + confirm()
        + cancel()
    }

    Room "1" --> "*" Reservation : contains
    Event "1" --> "*" Reservation : linked
    Host "1" --> "*" Reservation : created_by
```

**Explanation:**
- Classes mirror ERD entities but include **behavior (methods)** for application logic.
- Each reservation links to one room, host, and event.
- Ideal for backend OOP frameworks (Flask, Django, .NET, etc.).

---

### 🔁 3. Activity Diagram (Flowchart)
The activity diagram illustrates the workflow for making a classroom reservation. It captures user actions and system decisions. Useful for frontend development and backend developers to understand user interactions.

```mermaid
---
title: Classroom Reservation Activity Diagram
config:
    theme: forest  
---
flowchart TD
    Start@{ shape: circle, label: "Start" } --> A(Classroom Display Dashboard)
    A --> B{Select Action}
    %% B: action 1
    B -->|Make Reservation| C(View Available Rooms)
    C --> D(Select Room)
    D -->|Create Event| E(Reservation Form)
    E --> F{Submit Reservation}
    %% B: action 2
    B -->|View All Schedules| I(Display Schedules)
    I -->|Select to view| J(Reservation Details) 

  
```   

**Explanation:**
- Represents the main activities and decision points in the reservation process.

---

### 🌀 4. UI/UX Diagram
The UI/UX diagram provides a high-level overview of the user interface for the classroom display system. It focuses on key screens and user interactions to enhance user experience.

```mermaid
---
title: Classroom Display UI/UX Diagram
config:
    theme: forest  
---
flowchart TD
    A[🏫 Classroom Display Dashboard]
    A --> B[🆕 Make Reservation]
    A --> C[📅 View Schedule]

```

**Explanation:**
- Focuses on primary user actions: making reservations and viewing schedules.
- Useful for frontend developers and UI/UX designers to create intuitive interfaces.

---

### ⏳ 5. Sequence Diagram
The sequence diagram details the interaction flow for a user making a classroom reservation. It captures the message exchanges between the user, frontend, backend, and database.

```mermaid
---
title: Reservation Sequence Diagram
config:
    theme: forest  
---
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant DB@{ "type": "database" }

    Note over User, DB: User initiates login and reservation process
    User->>Frontend: Login
    Frontend->>Backend: Authenticate User
    Backend->>DB: Query User Credentials

    User->>Frontend: Request to view available rooms
    Frontend->>Backend: Fetch available rooms
    Backend->>DB: Query available rooms
    DB-->>Backend: Return available rooms
    Backend-->>Frontend: Send available rooms
    Frontend-->>User: Display available rooms

```

**Explanation:**
- Captures the step-by-step interaction for making a reservation.
- Helps both frontend and backend developers understand the flow of data and control.

### 🌿 6. Gitflow Diagram
Using Gitflow branching diagram to help visualize the development workflow for the Classroom Schedule Display project.

```mermaid
---
title: Gitflow Diagram
config:
    theme: forest
---
gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Setup project structure"
    
    branch frontend/feature/ui
    checkout frontend/feature/ui
    commit id: "Implement UI components"
    checkout develop
    merge frontend/feature/ui id: "Merge UI feature"

    branch backend/feature/api
    checkout backend/feature/api
    commit id: "Develop API endpoints"
    checkout develop
    merge backend/feature/api id: "Merge API feature"

    branch database/feature/schema
    checkout database/feature/schema
    commit id: "Design database schema"
    checkout develop
    merge database/feature/schema id: "Merge DB schema feature"

    branch devops/feature/deployment
    checkout devops/feature/deployment
    commit id: "Setup CI/CD pipeline"
    checkout develop
    merge devops/feature/deployment id: "Merge DevOps feature"

    checkout main
    merge develop id: "Release to main" tag: "v1.0.0"
    
```

**Explanation:**
- Visualizes the Gitflow branching strategy for collaborative development.
- Highlights feature branches for frontend, backend, database, and DevOps tasks.


> 🦬 *BuffTeks Development Team — Designing clarity, structure, and flow for every classroom.*
