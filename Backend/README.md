# ⚙️ Backend

This folder contains the **Python backend** for the Classroom Schedule Display project. It handles the business logic, data processing, and API communication between the frontend and the MySQL database.

---

## 📚 Tech Stack

| Technology          | Purpose                                    |
| ------------------- | ------------------------------------------ |
| **Python 3.11+**    | Core programming language                  |
| **FastAPI**         | Modern web framework for API routing       |
| **Uvicorn**         | ASGI server for running FastAPI            |
| **MySQL Connector** | Connects backend to MySQL database         |
| **python-dotenv**   | Loads environment variables from `.env`    |

---

## 🗂️ File Structure

```example
/backend
│
├── main.py             → Main entry point (FastAPI application)
├── database.py         → Database connection and query logic
├── requirements.txt    → Python dependencies
├── Dockerfile          → Docker configuration for containerization
└── README.md           → This document
```

Keep the backend modular, separating logic for clarity and maintainability.

---

## ▶️ Installation & Run Guide

### 🧩 Requirements

* Python 3.11 or later
* pip (Python package installer)

### 🚀 Steps

1. Navigate to the backend folder:

   ```bash
   cd classroom-schedule-display/backend
   ```
   
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with database credentials:

   ```bash
   host=localhost
   port=####
   usernameDB=root
   password=yourpassword
   database=your_db_name
   ```

4. Run the server:

   ```bash
   uvicorn main:app --reload
   ```

   The API will run on `http://127.0.0.1:8000` by default.
   - `--reload` enables auto-restart on code changes (development only)

---

## � Docker Setup

To run the backend in a Docker container:

```bash
docker build -t <docker-image-name> .
docker run -p 8000:8000 --env-file .env <docker-image-name>
```

The container will expose the API on `http://localhost:8000`.

---

## 📡 API Endpoints

| Endpoint           | Method | Description                    |
| ------------------ | ------ | ------------------------------ |
| `/reservations`    | GET    | Fetch all classroom reservations |

---

## 📖 Database Connection

The backend connects to MySQL using the `Database` class in `database.py`. Ensure all environment variables in `.env` are set correctly before running the application.

---

## 👥 Meet the Team

| Name           | GitHub                                                   | Role              |
| -------------- | -------------------------------------------------------- | ----------------- |
| Victor         | [@victorwithcoding](https://github.com/victorwithcoding) | Backend Developer |
| Xander Galusha | [@Xna285](https://github.com/Xna285)                     | Backend Lead Developer |

> 💻 *Huge thanks to the Backend team for implementing the core functionality and ensuring smooth communication with the database!*
