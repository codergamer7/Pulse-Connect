# **Pulse Connect, an Electronic NHF Card System — README** {#pulse-connect,-an-electronic-nhf-card-system-—-readme}

*Project description:* 

Pulse Connect is a web application designed to digitise the entire National Health Fund (NHF) application process, culminating in the instant generation of a digital NHF Card. Despite the enhanced convenience of the existing process, fewer than a quarter of the eligible population currently benefits from the NHF. This new application aims to significantly improve the accessibility and timeliness of completing the NHF application and accessing its benefits. The core goal of Pulse Connect is to accelerate the enrollment of new beneficiaries, directly supporting the NHF's mandate: to improve the effectiveness and affordability of healthcare delivery in Jamaica. 

The webapp digitises the National Health Fund (NHF) card and manages applications from patients, doctors, and NHF staff/admins. In summary, this document covers what the system does, architecture and technology choices, how to run it locally, security & compliance notes, and operational guidance. The developers have plans for mobile app implementation.

---

# **Table of contents** {#table-of-contents}

[**Electronic NHF Card System — README	1**](#pulse-connect,-an-electronic-nhf-card-system-—-readme)

[**Table of contents	1**](#table-of-contents)

[**1\. Project overview	2**](#1.-project-overview)

[**2\. Key features	2**](#2.-key-features)

[**3\. User roles & flows	3**](#3.-user-roles-&-flows)

[Patient (Applicant)	3](#patient-\(applicant\))

[Doctor (Verifier)	3](#doctor-\(verifier\))

[NHF Staff / Admin	4](#nhf-staff-/-admin)

[**4\. Suggested tech stack & architecture	4**](#4.-suggested-tech-stack-&-architecture)

[**5\. Data model (high level)	6**](#5.-data-model-\(high-level\))

[**6\. Security & compliance	6**](#6.-security-&-compliance)

[**7\. Local setup & development	7**](#7.-local-setup-&-development)

[Prerequisites	7](#prerequisites)

[Quickstart (example)	8](#quickstart-\(example\))

[Migrations & seeds	8](#migrations-&-seeds)

[Environment variables (example .env keys)	8](#environment-variables-\(example-.env-keys\))

[**8\. API overview (examples)	9**](#8.-api-overview-\(examples\))

[Auth	9](#auth)

[Patient / Application	9](#patient-/-application)

[Documents	10](#documents)

[Doctor verification	10](#doctor-verification)

[Admin	10](#admin)

[Webhook/Notifications	10](#webhook/notifications)

[**9\. Admin & operations	11**](#9.-admin-&-operations)

[**10\. Testing, monitoring, backups	11**](#10.-testing,-monitoring,-backups)

[**11\. Deployment notes	12**](#11.-deployment-notes)

[**12\. Contributing, license & contact	13**](#12.-contributing,-license-&-contact)

[**Appendix — Helpful design pointers (quick hits)	13**](#appendix-—-helpful-design-pointers-\(quick-hits\))

[**Quick start checklist (for a new developer)	14**](#quick-start-checklist-\(for-a-new-developer\))

---

# **1\. Project overview** {#1.-project-overview}

The Electronic NHF Card System lets applicants create and submit digital NHF card applications, lets doctors verify eligibility/medical confirmations, and lets NHF staff review, approve, and issue digital cards. The UI is multi-role (patients, doctors, admin) and includes:

* Multi-step application form with front \+ back validation

* Secure authentication (applicants & staff)

* Doctor verification portal

* Real-time application status tracking

* Admin workflow tools for review, verification, and issuing digital cards

* Audit logging and basic reporting

Goal: speed up NHF card issuance, reduce paperwork, and provide auditable, secure digital workflows.

---

# **2\. Key features** {#2.-key-features}

*Note: The features below include those of the prototype (in black font) and future implementations for the final product (in red).* 

* **Multi-step application** (save & continue, field validation, file uploads)

* **Secure user auth** (signup, login, password reset, (2FA optional)

* **Role-based access control** (Patient, Doctor, NHF Staff / Admin)

* **Doctor verification** (doctors receive verification requests, sign/decline)

* **Real-time status tracking** for applicants (submitted → under review → doctor verification → approved/declined → issued)

* **Admin dashboard** to triage applications, assign reviewers, and send feedback

* **Document storage** (scanned IDs, proof of address, medical documents)

* **Notifications** (email/SMS on status changes)

* **Audit logs** for all critical state changes

* **Export/reporting** for staff (CSV, PDF)

* **Rate limiting & basic abuse protections**

---

# **3\. User roles & flows** {#3.-user-roles-&-flows}

### **Patient (Applicant)** {#patient-(applicant)}

* Register / Login

* Start a new application (multi-step form)

* Upload documents (ID, proof of address, supporting docs)

* Submit application

* See real-time application status; receive notifications

* Download the issued digital NHF card (QR \+ secure token)

### **Doctor (Verifier)** {#doctor-(verifier)}

* Register / Login (or invited by admin)

* Receive verification requests from NHF

* View applicant data & documents

* Approve / Request changes / Decline; optionally add signed notes

* Sign verification digitally (audit trail)

### **NHF Staff / Admin** {#nhf-staff-/-admin}

* Log in to the admin portal

* View incoming applications; filter/search

* Assign applications to reviewers

* Request doctor verification; send feedback to the applicant

* Approve / Decline and issue a digital card

* Manage users, doctors, and system settings

* View reports & audit logs

---

# **4\. Suggested tech stack & architecture** {#4.-suggested-tech-stack-&-architecture}

**Frontend**

* React Vite 

* TypeScript 

* Tailind Css  
* Lovable UI Components  
* ShadCN UI  
* Lucide React Icons  
* Framer Motion   
* Recharts

**Backend**

* Python  
    
* Node.js \+ Fastify \+TypeScript

* Authentication: JWT (access \+ refresh tokens) or OAuth2 for SSO

* Database: SQLite (primary); Flask

* File storage: Github

* Containerization: Docker \+ Docker Compose

* Optional: GraphQL if you prefer type-safe APIs

**Infrastructure & DevOps**

* CI: GitHub Actions / GitLab CI

* Hosting: Vercel/Netlify for frontend (if static), Node backend on ECS / GCP / DigitalOcean / Heroku

* DB backups and monitoring

* Logging: centralized logs (ELK, Datadog, or simple CloudWatch)

* TLS everywhere (Let's Encrypt / managed certs)

**Architecture notes**

* Use RESTful endpoints with clear role-based middleware

* Separate microservices only if needed; monolith-first is fine

* Keep PII encrypted at rest and in transit

* All document uploads should be scanned for malware before processing

---

# **5\. Data model (high level)** {#5.-data-model-(high-level)}

Tables / Entities (example):

* `users` (id, role, email, password\_hash, name, phone, created\_at, last\_login)

* `patients` (user\_id → users, nhf\_id?, dob, address, etc.)

* `applications` (id, patient\_id, status, created\_at, updated\_at)

* `application_steps` (application\_id, step\_name, data JSONB, completed\_at)

* `documents` (id, application\_id, type, s3\_key, uploaded\_by, checksum, created\_at)

* `doctors` (user\_id → users, license\_number, clinic\_info, verified)

* `verifications` (id, application\_id, doctor\_id, status, notes, signed\_at)

* `audit_logs` (id, user\_id, action, target\_type, target\_id, metadata JSONB, created\_at)

* `notifications` (id, user\_id, channel, status, payload, created\_at)

**Status enum example**  
 `draft`, `submitted`, `in_review`, `doctor_verification_pending`, `doctor_verified`, `approved`, `declined`, `issued`, `archived`

---

# **6\. Security & compliance** {#6.-security-&-compliance}

**Authentication & Authorization**

* Strong password policy (bcrypt/argon2)

* JWT with short-lived access tokens \+ refresh tokens

* Role-based access control (RBAC) enforced server-side

* 2FA encouraged for admin users (TOTP or SMS)

**Data protection**

* Encrypt sensitive fields at rest (e.g., national ID numbers) and use TLS in transit.

* Document storage access should use pre-signed URLs with short expiry.

* Audit all admin actions and verification signatures.

**Compliance**

* Follow local Data Protection Act / privacy laws — store only what is necessary and retain per policy.

* Provide user-facing privacy policy and terms.

* Implement right-to-access / right-to-delete processes for applicants.

* Keep data retention policy configurable by admin.

**Other**

* Input validation & sanitization to avoid injection vulnerabilities.

* Rate-limit public endpoints and apply bot detection on forms.

* Keep dependencies up-to-date and run vulnerability scans.

---

# **7\. Local setup & development** {#7.-local-setup-&-development}

The commands below are examples. Adjust to your project's package manager / scripts.

## **Prerequisites** {#prerequisites}

* Node 18+ (or latest LTS)

* PostgreSQL

* Redis (for queues & caching)

* Docker (optional but recommended)

* Yarn or npm

## **Quickstart (example)** {#quickstart-(example)}

\# clone  
git clone git@github.com:your-org/nhf-digital-card.git  
cd nhf-digital-card

\# install  
yarn install

\# Set environment variables  
cp env.example .env  
\# edit .env with DB credentials, S3 keys, JWT secrets, etc.

\# start dev (backend \+ frontend)  
\# Option A: Docker Compose  
docker-compose up \--build

\# Option B: local  
yarn workspace backend dev  
yarn workspace frontend dev

## **Migrations & seeds** {#migrations-&-seeds}

\# run migrations (example using prisma or knex)  
yarn workspace backend migrate:up

\# seed test data  
yarn workspace backend db:seed

## **Environment variables (example `.env` keys)** {#environment-variables-(example-.env-keys)}

\# Server  
PORT=4000  
NODE\_ENV=development  
JWT\_SECRET=replace\_with\_strong\_secret  
JWT\_REFRESH\_SECRET=replace\_with\_strong\_refresh\_secret

\# Database  
DATABASE\_URL=postgres://user:pass@localhost:5432/nhf

\# Redis  
REDIS\_URL=redis://localhost:6379

\# Storage  
S3\_BUCKET=nhf-docs  
S3\_REGION=us-east-1  
S3\_ACCESS\_KEY\_ID=  
S3\_SECRET\_ACCESS\_KEY=

\# Email / SMS  
SENDGRID\_API\_KEY=  
TWILIO\_SID=  
TWILIO\_TOKEN=

---

# **8\. API overview (examples)** {#8.-api-overview-(examples)}

This is an outline — adapt to your design.

### **Auth** {#auth}

* `POST /api/auth/register` — register user (role param)

* `POST /api/auth/login` — returns access & refresh tokens

* `POST /api/auth/refresh` — refresh tokens

* `POST /api/auth/password-reset` — request reset

* `POST /api/auth/password-reset/confirm`

### **Patient / Application** {#patient-/-application}

* `GET /api/applications` — list (patient sees own; admin sees all)

* `POST /api/applications` — create new (starts draft)

* `PUT /api/applications/:id/step` — save step payload

* `POST /api/applications/:id/submit` — submit application

* `GET /api/applications/:id/status` — get status & history

### **Documents** {#documents}

* `POST /api/applications/:id/documents` — upload (returns temp upload URL or accept multipart)

* `GET /api/documents/:id` — get pre-signed URL (RBAC-protected)

### **Doctor verification** {#doctor-verification}

* `GET /api/doctor/requests` — list pending verifications

* `POST /api/doctor/requests/:id/respond` — approve/decline with notes & signature

### **Admin** {#admin}

* `GET /api/admin/applications` — advanced filtering

* `POST /api/admin/applications/:id/assign` — assign to staff

* `POST /api/admin/applications/:id/approve` — approve & issue card

* `POST /api/admin/applications/:id/decline` — decline with reason

### **Webhook/Notifications** {#webhook/notifications}

* `POST /api/webhook/s3-upload-callback` — optional

* `POST /api/webhook/doctor-signed` — optional for external signing services

**Example curl: submit application**

curl \-X POST "https://api.example.com/api/applications/123/submit" \\  
  \-H "Authorization: Bearer $ACCESS\_TOKEN" \\  
  \-H "Content-Type: application/json"

---

# **9\. Admin & operations** {#9.-admin-&-operations}

**Admin dashboard tasks**

* Review pending applications, filter by status/date/region

* Manage doctor directory and verify their credentials

* Configure system-level settings (document retention, notification templates)

* Audit logs for compliance review

**Operational runbook (short)**

* Monitor queue backlog (Redis/Bull)

* Monitor failed jobs and re-process with `yarn queue:retry`

* Check scheduled tasks for reminders to doctors

* Monitor storage buckets and set lifecycle rules for old documents

* Rotate JWT / encryption keys periodically

---

# **10\. Testing, monitoring, backups** {#10.-testing,-monitoring,-backups}

**Testing**

* Unit tests: Jest (backend & frontend)

* Integration tests: Supertest (API)

* End-to-end: Playwright or Cypress (critical flows: apply → doctor verify → admin approve)

* Add CI tests for PRs (lint, tests, security check)

**Monitoring & Logging**

* Use structured logs (JSON) with request IDs

* Track errors with Sentry / Rollbar

* Metrics: Prometheus/Grafana or managed service

**Backups**

* Automated DB backups (daily) with point-in-time recovery if possible

* Periodic backup of S3 buckets or enable lifecycle to cold-storage

* Test recovery plans quarterly

---

# **11\. Deployment notes** {#11.-deployment-notes}

* Use environment-specific secrets for production (do not commit `.env`)

* Use managed DB with automated backups & encryption at rest

* Ensure HTTPS/TLS on all endpoints; HSTS enabled

* Autoscale backend components but keep database sizing appropriate

* Use separate accounts/projects for staging and production

* Review logs for PII exposure — mask or exclude sensitive fields

---

# **12\. Contributing, license & contact** {#12.-contributing,-license-&-contact}

**Contributing**

* Fork the repo, create a feature branch, open PR with description

* Run tests locally and ensure linting passes

* Use clear commit messages and link to issue numbers

* Maintain backward-compatible API changes unless version bumping

**Code style**

* Use TypeScript lint rules, Prettier formatting

* Keep components modular and reuse forms / validation schemas

**License**

* Choose a license that fits your organization (e.g., MIT for open, proprietary for closed). Add `LICENSE` file.

**Contact**

* Project owner / maintainer: `team@example.com` (replace with real contact)

* Security issues: `security@example.com`

---

# **Appendix — Helpful design pointers (quick hits)** {#appendix-—-helpful-design-pointers-(quick-hits)}

* Make the multi-step form save progress to server every step (autosave) — prevents lost work.

* Use pre-signed S3 uploads to avoid routing large files through your server.

* Use a human-readable application ID (e.g., `NHF-2025-000012`) for tracking.

* Issue a digital card as a signed JWT \+ QR code. QR payload should point to a short-lived verification endpoint that returns minimal public info (card valid / issued date).

* Implement email templates with localised copy (Jamaican English / Patois if needed).

* Provide an appeals/feedback mechanism on declined applications.

* Keep an admin audit trail of every change (who, what, when, why).

* Use feature flags for rolling out new verification steps.

---

# **Quick start checklist (for a new developer)** {#quick-start-checklist-(for-a-new-developer)}

* Clone the repo

* Copy `.env.example` → `.env` and fill secrets

* Run migrations and seeds

* Start backend & frontend (or use Docker Compose)

* Register a test account (patient) and submit a test application

* Create a doctor account and verify an application

* Create an admin account and approve/issue a digital card

