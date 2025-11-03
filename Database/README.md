# 🗄️ Database (MySQL)

This folder contains all **MySQL database resources** for the Classroom Schedule Display project. It defines tables, schema relationships, and seed data that support backend operations.

---

## ⚙️ Tech Stack

| Technology                          | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| **MySQL**                           | Relational database management system    |
| **MySQL Workbench or VS Code Extension**       | Database modeling and visualization      |
| **ERD Tools (draw.io, Lucidchart)** | Diagram design for schema representation |

---

## 🗂️ File Structure

```
/database
│
├── README.md     → This document provides an overview and setup instructions
├── /schema       → SQL scripts for creating db, tables, relationships, etc.
├── /procedures   → Stored procedures and functions
└── /seed         → Initial data population scripts
```
Why save your SQL scripts? 🤔⁉️ 

1. **Proof of work**: Demonstrates your database design and implementation skills.
2. **Reusability**: Easily recreate or modify the database structure as needed.
3. **Collaboration**: Share scripts with team members for db understanding and updates.
4. **Documentation**: Acts as a reference for future maintenance and enhancements.
> Keep SQL scripts clean and well-commented for clarity.

---

## ▶️ Installation & Run Guide

### 🧩 Requirements

* MySQL Server (v8.0 or higher)
* MySQL Workbench or VS Code extension (recommended)
* Connect to Database server with proper user credentials

### 🚀 Steps

1. Connect to the MySQL server using your preferred client (e.g., MySQL Workbench, VS Code extension).
  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=yourpassword
  DB_NAME=database_name
  DB_PORT=port_number
  server_type=mysql
  ```
  > ⚠️ Don’t commit actual credentials — just show placeholders.

2. Navigate through the `database` folder to find tables and procedures to test and run.

---

## 📖 Documentation & Notes

Use this section to describe:

* Entity-Relationship Diagrams (ERDs)
* Table structures and relationships
* Stored procedures and their purposes
* New indexes, keys, or constraints

---

## 👥 Meet the Team

| Name          | GitHub                                     | Role               |
| ------------- | ------------------------------------------ | ------------------ |
| Haylee Torres | [@htorres38](https://github.com/htorres38) | Database Lead Developer |

> 🧠 *Thanks to the Database team for creating a robust and efficient database system for our 🎓 Classroom Design Project!*

---