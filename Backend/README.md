# ⚙️ Backend

This folder contains the **Python backend** for the Classroom Schedule Display project. It handles the business logic, data processing, and API communication between the frontend and the MySQL database.

---

## 📚 Tech Stack

| Technology          | Purpose                                    |
| ------------------- | ------------------------------------------ |
| **Python 3.11+**    | Core programming language                  |
| **Flask**           | Web framework for API routing and requests |
| **MySQL Connector** | Connects backend to MySQL database         |
| **dotenv**          | Loads environment variables from `.env`    |

---

## 🗂️ File Structure

```example
/backend
│
├── app.py              → Main entry point
├── requirements.txt   → Python dependencies
├── README.md           → This document provides an overview and setup instructions
├── /routes             → API endpoints (Flask/FastAPI routes)
├── /models             → Data models and schemas
├── /services           → Business logic and utility functions
└── /config             → Database and environment configuration
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

3. Create a `.env` file and include database credentials:

   ```bash
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=classroom_display
   ```
    > ⚠️ Don’t commit actual credentials — just show placeholders.

4. Run the server:

   ```bash example
   python app.py
   ```

   The API should run on `http://127.0.0.1:5000` by default.

---

## 📖 Documentation & Notes

Use this section to record:

* API endpoints and request examples.
* Connection notes or changes to database config.
* Any known issues or improvements.

---

## 👥 Meet the Team

| Name           | GitHub                                                   | Role              |
| -------------- | -------------------------------------------------------- | ----------------- |
| Victor         | [@victorwithcoding](https://github.com/victorwithcoding) | Backend Developer |
| Xander Galusha | [@Xna285](https://github.com/Xna285)                     | Backend Lead Developer |

> 💻 *Huge thanks to the Backend team for implementing the core functionality and ensuring smooth communication with the database!*

