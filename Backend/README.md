# ⚙️ Backend

This folder contains the **Python backend** for the Classroom Schedule Display project. It handles business logic, data validation, and API communication between the frontend and the MySQL database.

---

## 👥 Developed by:

| Name           | GitHub                                                   | Role                   |
| -------------- | -------------------------------------------------------- | ---------------------- |
| Xander Galusha | [@Xna285](https://github.com/Xna285)                     | Backend Lead Developer |

---

## 📚 Tech Stack

| Technology          | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| **Python 3.11+**    | Core programming language                      |
| **FastAPI**         | High-performance web framework for API routing |
| **Uvicorn**         | ASGI server for running FastAPI                |
| **MySQL Connector** | Database connection with **Connection Pooling**|
| **Pydantic**        | Data validation and serialization schemas      |
| **python-dotenv**   | Loads environment variables from `.env`        |

---

## 🗂️ File Structure

```text
/Backend
│
├── main.py             → Entry point (FastAPI application & Endpoints)
├── database.py         → Database class (Connection Pooling & Stored Procs)
├── models.py           → Pydantic models for Request/Response validation
├── test_db.py          → Script to verify database connection & logic
├── requirements.txt    → Python dependencies
├── Dockerfile          → Docker configuration
├── .dockerignore       → Docker build exclusion rules
└── README.md           → Documentation
```

---

## ▶️ Installation & Run Guide

### 1. Prerequisites
* Python 3.11 or later
* MySQL Database (with Stored Procedures installed)

### 2. Setup

Navigate to the backend folder:
```bash
cd Backend
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Configuration
Create a `.env` file in the `Backend` directory with your database credentials:

```ini
host=localhost_name
port=port_number
usernameDB=root_name
password=your_password
database=your_db_name
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

### 4. Run Server
Start the development server with auto-reload:
```bash
uvicorn main:app --reload
```
The API will be available at [`http://127.0.0.1:8000`](http://127.0.0.1:8000).

---

## 🧪 Verification & Testing

To verify that all 4 CRUD (Create, Read, Update, Delete) operations are working seamlessly with the database:

1. Ensure your `.env` file is properly configured with your active database credentials.
2. Run the integration test script:
   ```bash
   python test_db.py
   ```

This script will sequentially **Create, Read, Update, and Delete** a test reservation to ensure the backend database connection and Stored Procedures are fully operational.

### Troubleshooting
-   **Connection Failed**: Verify your `.env` file matches your MySQL server credentials and the server is running.
-   **Missing Tables/Routines**: Ensure the database is fully seeded with tables and Stored Procedures (Refer to the `Database/` directory).

---

## 🐳 Docker Setup

Build and run the backend in a secure container:

```bash
# Build the image
docker build -t classroom-backend .

# Run the container (mapping port 8000)
docker run -p 8000:8000 --env-file .env classroom-backend
```

---

## 📡 API Endpoints

| Method | Endpoint                         | Description                                      |
| :----- | :------------------------------- | :----------------------------------------------- |
| `GET`  | `/reservations`                  | Fetch reservations (Supports optional filtering) |
| `POST` | `/reservations`                  | Create a new reservation                         |
| `PUT`  | `/reservations/{reservation_id}` | Update an existing reservation                   |
| `DELETE`| `/reservations/{reservation_id}`| Delete a reservation                             |

> **Note:** Access the interactive API documentation at `/docs` (Swagger UI) or `/redoc` when the server is running.

---

## 📖 Database Architecture

The backend utilizes a robust **Database** class in `database.py` featuring:

*   **Connection Pooling:** Efficiently manages database connections using `mysql.connector.pooling`.
*   **Stored Procedures:** All operations interact via Stored Procedures (`sp_get_reservations`, `sp_insert_reservation`, etc.) for security and performance.
*   **Pydantic Models:** All incoming data is validated against strict schemas in `models.py` before processing.

---

> 💻 *Huge thanks to the Backend team for implementing the core functionality and ensuring smooth communication with the database!*
