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
/SystemAnalysisDesign → System functional requirements and UML diagrams
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

Table of Contents:
1. [Clone the repository](#clone-the-repository)
2. [Setting up your team environment](#setting-up-your-team-environment)
3. [Project Branching Strategy](#project-branching-strategy)
4. [Create your contribution feature branch](#create-your-contribution-feature-branch)
5. [Contribution Guidelines](#contribution-guidelines)
6. [Best Practices](#best-practices)

---

### Clone the repository

- Copy the repo URL from GitHub. Open folder where you want to store the project, then open a terminal, verify you are in the desired folder directory in terminal, and run:

```bash
git clone <REPO_URL> # this clones the repo locally
cd classroom-schedule-display # changes directory to the project folder
code .  # (for VS Code)
```

### Setting up your team environment

**Frontend:** use `index.html` to run the frontend in your browser.
**Backend:** using Python app structure with Flask (update as needed)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Database:** Set up connection to MySQL DB

```bash
mysql -u root -p
CREATE DATABASE <database_name>;
USE <database_name>;
SOURCE ./database/schema/<table_name>.sql; # example
```

**DevOps:** Build and run Docker container

```bash
cd devops/docker
docker build -t classroom-schedule-display .
docker run -p 5000:5000 classroom-schedule-display
```

---

### Project Branching Strategy

Our project uses a **team-based branching workflow**:

```github
main (production)
  └── develop (integration branch)
      ├── frontend (team branch)
      ├── backend (team branch)
      ├── database (team branch)
      └── devops (team branch)
```

**Workflow:**
1. **develop** branch is created from `main` (integration branch)
2. Each team has a contribution branch: `frontend`, `backend`, `database`, `devops`
3. Team branches are created from the `develop` branch
4. Developers should create feature branches from their team branch
   examples: `dev-name/feature-description`
    - from `frontend` branch, create your contribution branch
      - `git checkout -b scrump/landing-page`
    - from `backend` branch, create your contribution branch
      - `git checkout -b xna285/api-endpoint`
    - from `database` branch, create your contribution branch
      - `git checkout -b htorres38/db-schema`
    - from `devops` branch, create your contribution branch
      - `git checkout -b kiettrinh7/docker-setup`
5. Features merge into team branches → team branches merge into `develop` → `develop` merges into `main`

### Create your contribution feature branch

First, ensure your team branch is up-to-date with `develop`:

```bash
# Step 1: Checkout develop branch
git checkout develop

# Step 2: Pull latest changes from remote develop
git pull origin develop

# Step 3: Switch back to your team branch
git checkout <team-branch>  # e.g., git checkout frontend

# Step 4: Merge develop changes into your local team branch to sync
git merge develop

# Step 5: Create your feature branch from your updated team branch
git checkout -b <dev-name>/<short-task>  # e.g., git checkout -b frontend/ad1135773-add-schedule-grid
```
From here, you can start working on your feature! and when you are complete, move on to the next section on Contribution Guidelines.

### Contribution Guidelines

When you have completed a feature or made changes that are ready to be pushed, follow these steps: 
  - Staging, committing, syncing, pushing, and creating a Pull Request (PR).

> ⚠️ **Important:** Before proceeding, ensure you are on your **feature branch** (e.g., `dev-name/short-task`).'

##### 1. Stage your changes: with one of the following commands:
```bash
# if many files changed
git add . # stages all changed files

# if specific files changed
git add <file1> <file2> # stages specific files

# stage all changes
git add -A
```
##### 2. Next commit in the following format:

```bash
# For best practices, write clear commit messages!
# Conventional message format: type(scope): description
git commit -m "feat(<team>): <what you did>" # e.g., feat(database): created db and tables.
```
- More Examples: `fix(backend): resolve database connection error`

##### 3. Before pushing, **sync your feature branch with latest changes** to prevent conflicts.
- Keep your feature branch up-to-date with your team branch and develop
 ```bash
 # Step 1: Update develop from remote
 git checkout develop
 git pull origin develop
 
 # Step 2: Update your team branch with latest develop
 git checkout <team> # switch to your team branch (e.g., frontend, backend)
 git merge develop # merge latest develop into your team branch
 
 # Step 3: Update your feature branch with latest team branch
 git checkout <dev-name>-<short-task> # switch back to your feature branch
 git rebase team # rebase your feature branch with latest team branch
 
 # Resolve any conflicts if they arise, then continue rebase
 git rebase --continue
 ```
> 🫸 **Once all conflicts are resolved proceed to push your changes.**

##### 4. Push your branch & set upstream:
- If this is your first push of the branch, set upstream
 ```bash
 git push -u origin <dev-name>/<short-task> # e.g., git push -u origin scrump/landing-page
 ```
- If branch already exists remotely, just push
```bash
  git push
```
##### 5. Open a Pull Request (PR) in GitHub:
 * **Base branch:** Your team branch (e.g., `frontend`, `backend`, `database`, `devops`)
 * **Title:** `<team>: <short task>` (example: `frontend: add schedule grid component`)
 * Description: **What / Why / How / Test steps**
   * **frontend**: include UI screenshots
   * **backend**: include API test results
   * **database**: include sample queries or ER diagrams
   * **devops**: include deployment logs or workflow screenshots
   * Screenshots or test notes if applicable
##### 6. After your feature is merged to your team branch:
 * Team leads will merge team branches into `develop` when ready
 * After testing on `develop`, it will be merged to `main` for production
 * Only `develop` merges into `main` (team branches never merge directly to `main`)

##### 7. Update your **team README** with new files, changes, or diagrams.

---

### Best Practices

#### Keeping Your Team Branch Up-to-Date

**Why this matters:** When other teams merge their work into `develop`, you want those changes in your team branch so you're working with the latest codebase.

#### Regular Sync Workflow (Recommended Daily/Before Starting New Work):

```bash
# Step 1: Checkout develop (the branch you want to pull FROM)
git checkout develop

# Step 2: Pull latest changes from remote develop
git pull origin develop

# Step 3: Switch back to your team branch
git checkout <team>  # e.g., git checkout frontend

# Step 4: Merge develop into your team branch
git merge develop
```

#### Learning and Best Practices 

* **Commit small, clear changes.** Example: `feat(frontend): add schedule grid`
* **Keep PRs short.** Reviewers should understand your work quickly.
* **Document your work** inside your team folder’s README.
* **Use .env files** for local secrets and never push credentials.
* **Collaborate actively**—ask questions and share progress.

> 💡 *This project is a learning platform—focus on growth, teamwork, and clean code.*

**Why this approach?**
- ✅ Ensures you get the absolute latest from remote `develop`
- ✅ Follows the pattern: checkout source → pull → checkout target → merge
- ✅ Keeps your team branch synchronized with integration branch
- ✅ Prevents conflicts when creating new feature branches

**When to do this:**
- Before creating a new feature branch
- Daily, if working on the project regularly
- Before starting a new work session
- When you know other teams have merged to `develop`

---

#### Key Notes:
- **Branching Strategy:** Feature branches → Team branches → `develop` → `main`
- Always sync your feature branch with your team branch and `develop` before pushing.
- Create feature branches from your team branch, not from `main` or `develop`.
- PRs target your team branch (e.g., `frontend`, `backend`), not `main`.
- Only `develop` merges into `main` (team branches merge into `develop`).
- Use clear, conventional commit messages.
- Follow the PR checklist below before submitting.
- Never commit secrets (API keys, service accounts). Use `.env` files.  
  - Do not forget to verify/add `.env` to `.gitignore`!
- Reach out to the Tech Lead if you hit any blockers!

#### Commit Message Guide (short & useful)

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
