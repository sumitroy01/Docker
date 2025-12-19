# 🚀 Chat Application – Kubernetes CI/CD

A **3-tier chat application** deployed using **Docker, Kubernetes, and Jenkins** on **AWS EC2**.
Built to demonstrate real-world DevOps automation and cloud deployment practices.

---

## 🧩 Architecture

```
Frontend (React + Nginx)
Backend (Node.js / Express)
MongoDB (Persistent Volume)
```

---

## 🛠 Tech Stack

* React, Node.js, MongoDB
* Docker & Kubernetes
* Jenkins CI/CD
* AWS EC2
* Ingress, ConfigMap, Secret, PV/PVC

---

## 🔄 CI/CD Flow

```
Git Push → Jenkins → Docker Build & Push → Kubernetes Deploy
```

* **Single Jenkinsfile** handles full automation
* Rolling updates with zero downtime

---

## 🔐 Configuration

* ConfigMaps for non-sensitive config
* Secrets for credentials & API keys
* Env injected at runtime (not inside images)

---

## ☁️ Deployment

* Jenkins + Kubernetes running on EC2
* App exposed using NGINX Ingress
* MongoDB data persisted using volumes

---

## 🎯 Highlights

* End-to-end CI/CD
* Production-style Kubernetes setup
* Secure and scalable deployment

---
