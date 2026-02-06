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
└── /queries      → Validation and Example queries
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

## ▶️ Recommended Run Order

1. Run all scripts in the `schema/` folder to create database tables.
2. Run all scripts in the `seeds/` folder to insert initial data.
3. Run scripts in the `procedures/` folder to create stored procedures.
4. (Optional) Run scripts in the `queries/` folder to verify data and joins.

---

## 📖 Documentation & Notes

Use this section to describe:

* Entity-Relationship Diagrams (ERDs)
* Table structures and relationships
* Stored procedures and their purposes
* New indexes, keys, or constraints

### Stored Procedures
The `procedures/` folder contains MySQL stored procedures that handle common
reservation actions directly in the database. These procedures help keep
logic consistent and reduce repeated SQL in the application.

- **sp_insert_reservation** – adds a new reservation and its related data  
- **sp_edit_reservation** – updates an existing reservation when details change  
- **sp_delete_reservation** – removes a reservation from the system  
- **sp_get_reservation** – retrieves reservation details using related tables  

### Table Structure
The database is built around a small set of core tables that represent how
classrooms are scheduled.

- **room** stores classroom and location information  
- **host** stores faculty or student host details  
- **event** stores event information such as title, time, and requirements  
- **reservation** connects rooms, hosts, and events into a single booking  

Foreign key relationships are used so that reservations always reference valid
rooms, hosts, and events.

---

## 👥 Meet the Team

| Name          | GitHub                                     | Role               |
| ------------- | ------------------------------------------ | ------------------ |
| Haylee Torres | [@htorres38](https://github.com/htorres38) | Database Lead Developer |

> 🧠 *Thanks to the Database team for creating a robust and efficient database system for our 🎓 Classroom Design Project!*

---