# 🎓 Classroom Schedule Display 🦬 

A student‑led initiative designed to simplify how **classroom schedules** and **room reservations** are displayed across campus. Built collaboratively by BuffTeks members using a modern tech stack with a focus on responsive web design, robust backend APIs, and efficient database management, all supported by DevOps best practices.

---

## 🧭 Introduction

The **Classroom Schedule Display Project** provides a digital solution for displaying classroom occupancy and availability in real time. Each classroom will have a dedicated display showing:

* Current and upcoming reservations.
* Room details such as course name, instructor, and time slot.
* Automatic updates synced from the backend.

This documentation also serves as a **reference** for BuffTeks developers. It’s written to help new contributors understand the project’s layout, tools, and workflow.

---

## 🧰 Tech Stack

| Layer    | Technology                | Purpose                                               |
| -------- | ------------------------- | ----------------------------------------------------- |
| Frontend | **HTML, CSS, JavaScript** | Build responsive and interactive room displays        |
| Backend  | **Python (Flask)**        | Manage API logic and serve classroom data             |
| Database | **MySQL**                 | Store and retrieve classroom and reservation data     |
| DevOps   | **Git, GitHub, Docker**   | Handle collaboration, version control, and deployment |

> 🧩 Each folder (Frontend, Backend, Database, DevOps) includes its own README with setup, file structure, and team details.

---

## 📂 Repository Structure

```
/frontend   → HTML • CSS • JavaScript UI
/backend    → Python API and server logic
/database   → MySQL schema, migrations, and seed data
/devops     → Docker setup, GitHub Actions, CI/CD scripts
```

> Keep all documentation inside the respective folders. Avoid placing unrelated files in the root directory.

---

## 👥 Meet the Dev Team


| Frontend   | Backend  | Database  | DevOps    |
| ---------- | -------- | --------- | --------- |
| **AD Diallo** — [@ad1135773](https://github.com/ad1135773)   | **Xander Galusha** — [@Xna285](https://github.com/Xna285) | **Haylee Torres** — [@htorres38](https://github.com/htorres38) | **Kiet Trinh** — [@KietTrinh7](https://github.com/KietTrinh7)   |
| **Josue Bravo** — [@jbravo2buffs](https://github.com/jbravo2buffs)    | **Victor** — [@victorwithcoding](https://github.com/victorwithcoding)    |           | **Emmanuel Nwokike** — [@EmmanuelNwokike](https://github.com/EmmanuelNwokike)|
| **Seth Crump** — [@Scrump05](https://github.com/Scrump05)    |     |           | |

| Team Leads | Faculty Advisors |
| ---------- | -----------------|
| **Benjamin Mosley** — [@Benny-ui-ux](https://github.com/Benny-ui-ux)   | **Dr. Carl Zhang** — [@czhangwt](https://github.com/czhangwt) |
| **Jesus Torres** — [@TorresjDev](https://github.com/TorresjDev)    |

---

## 🚀 Getting Started (For Developers)

### 1. Clone the repository

- Copy the repo URL from GitHub. Open folder where you want to store the project, then open a terminal, verify you are in the desired folder directory in terminal, and run:

```bash
git clone <REPO_URL> # this clones the repo locally
cd classroom-schedule-display # changes directory to the project folder
code .  # (for VS Code)
```

### 2. Create your branch from `main`


Follow the naming convention:

```bash
<team>/<github-username>-<short-task> 
```

**Example:**

```bash
git checkout -b database/htorres-create-db-table
```

### 3. Run your respective environment

**Frontend:** Open `index.html` directly or use VS Code Live Server.
**Backend:**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Database:**

```bash
mysql -u root -p
CREATE DATABASE <database_name>;
USE <database_name>;
SOURCE ./database/schema/<table_name>.sql; # example
```

**DevOps:**

```bash
cd devops/docker
docker build -t classroom-schedule-display .
docker run -p 5000:5000 classroom-schedule-display
```

---

## 🌱 Learning & Best Practices

* **Commit small, clear changes.** Example: `feat(frontend): add schedule grid`
* **Keep PRs short.** Reviewers should understand your work quickly.
* **Document your work** inside your team folder’s README.
* **Use .env files** for local secrets and never push credentials.
* **Collaborate actively**—ask questions and share progress.

> 💡 *This project is a learning platform—focus on growth, teamwork, and clean code.*

---

## ✅ Ready for Contribution Guidelines


### 1. Stage your changes:
```bash
# if many files changed
git add . # stages all changed files

# if specific files changed
git add <file1> <file2> # stages specific files

# stage all changes
git add -A
```
### 2. Next commit in the following format:

   ```bash
    # For best practices, write clear commit messages!
    # Conventional message format: type(scope): description
   git commit -m "feat(<team>): <what you did>" # e.g., feat(database): created db and tables.
   ```
      - More Examples: `fix(backend): resolve database connection error`

### 3. Before merging, **rebase with `main`** to prevent conflicts.
     - Rebase your branch with main before pushing
       ```bash
       git checkout <team>/<developer>-<short-task> # switch to your branch
       git rebase main # rebase your branch with latest main
       # Resolve any conflicts if they arise, then continue rebase
       git rebase --continue
       ```
### 4. Always **sync with `main`** before pushing:
     - Pull latest and greatest from main before pushing
       ```bash
       git checkout main # switch to main branch
       git pull origin main # pulls latest and greatest from main
       git checkout <team>/<developer>-<short-task> # switch back to your branch
       git merge main # merge your branch with main
       ```
    > 🫸 **Once all conflicts are resolved proceed to push your changes.**

### 5. Push your branch & set upstream:
     - If this is your first push of the branch, set upstream
       ```bash
       git push -u origin <team>/<developer>-<short-task>
       ```
     - If branch already exists remotely, just push
        ```bash
          git push
        ```
### 6. Next open a Pull Request (PR) in GitHub:
   * Target branch: `main`
   * Title: `<team>: <short task>` (example: `database: created db and tables for Classroom Schedule`)
   * Description: **What / Why / How / Test steps**
     * **frontend**: include UI screenshots
     * **backend**: include API test results
     * **database**: include sample queries or ER diagrams
     * **devops**: include deployment logs or workflow screenshots
     * Screenshots or test notes if applicable
### 7. Update your **team README** with new files, changes, or diagrams.

---

### Key Notes:
- Always rebase your branch with main before pushing.
- Pull latest changes from main and merge them with your branch before opening a PR.
- Include diagrams/screenshots for documentation where applicable.
- Use clear, conventional commit messages.
- Follow the PR checklist below before submitting.
- Never commit secrets (API keys, service accounts). Use `.env` files.  
  - Do not forget to verify/add `.env` to `.gitignore`!
- Reach out to the Tech Lead if you hit any blockers!

### Commit Message Guide (short & useful)

Use Conventional Commits:
  * `feat`: new feature
  * `fix`: bug fix
  * `docs`: docs only
  * `chore`: tooling/maintenance
  * `ci`: CI/CD updates

    Examples:
      ```bash
      feat(database): add reservations table & seed data
      fix(backend): correct overlap validation for bookings
      ci(devops): add GitHub Actions for API tests
      ```

## 🧩 Final Notes

This project is meant to continue production. Treat this repository as a **training ground** for professional collaboration, version control, and multi‑role teamwork.
Keep experimenting, documenting, and helping each other learn.

> “Let’s build it right, keep it simple, and ship it together.”  — BuffTeks Team 🚀
