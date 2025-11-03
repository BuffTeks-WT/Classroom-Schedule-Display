# 🚀 DevOps 

This folder contains all **DevOps resources** for the Classroom Schedule Display project. The DevOps team ensures smooth integration, deployment, and collaboration through version control, automation, and containerization.

---

## ⚙️ Tech Stack

| Tool               | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| **Git**            | Version control for tracking code changes         |
| **GitHub**         | Collaboration and remote repository hosting       |
| **Docker**         | Containerization for consistent environment setup |
| **GitHub Actions** | CI/CD pipeline automation                         |

✅ **Why it matters:** This stack ensures every commit is traceable, every environment is reproducible, and every deployment is automated and secure.

---

## 🗂️ File Structure

```
/devops
│
├── /ci         → GitHub Actions workflows
├── /docker     → Dockerfiles & Compose configs
└── /scripts    → Utility scripts (build, deploy, etc.)
```

Each folder supports automation, consistency, and deployment reliability across all teams.

---

## ▶️ Installation & Usage

### 🧩 Requirements

* Git (v2.40+)
* Docker (v24+)
* GitHub account with repo access

### 🚀 Common Commands

```bash example
# Clone the repository
git clone <REPO_URL>

# Check branch status
git status

# Build Docker image
docker build -t classroom-schedule-display .

# Run container locally
docker run -p 5000:5000 classroom-schedule-display
```

> Make sure Docker is configured and running before executing container commands.

---

## 📖 Documentation & Notes

Use this section to record:

* Pipeline or workflow updates
* Deployment steps or scripts
* Docker setup improvements or troubleshooting

Encourage logging any CI/CD or configuration changes for future DevOps contributors.

---

## 👥 Meet the Team

| Name             | GitHub                                                 | Role            |
| ---------------- | ------------------------------------------------------ | --------------- |
| Emmanuel Nwokike | [@EmmanuelNwokike](https://github.com/EmmanuelNwokike) | DevOps Engineer |
| Kiet Trinh       | [@KietTrinh7](https://github.com/KietTrinh7)           | DevOps Engineer |

> ⚡ *Big thanks to the DevOps team for maintaining reliable deployments and smooth collaboration workflows!*
