# OncoCare EHR — Oncology Electronic Health Record System

## What Is This Project?

OncoCare is a **USA-compliant Oncology Electronic Health Record (EHR) system** built for cancer care management. It covers the full lifecycle from patient registration and AI-powered imaging analysis to treatment planning, payer submissions, and patient self-service.

Built with **Django** (backend) + **React/TypeScript** (frontend) across three roles: **Superadmin**, **Hospital (Clinician)**, and **Patient**.

---

## Why Does This Exist?

Cancer care involves many specialists, complex workflows, and strict compliance requirements. OncoCare brings them together:

- Clinicians need structured AJCC-standard staging and treatment roadmaps
- Hospitals need AI-powered report analysis (MRI, CT, pathology PDFs) to reduce manual entry  
- Patients need a clear view of their treatment journey without medical jargon
- Insurance teams need ICD-10, CPT codes, and claim tracking built in
- Compliance teams need full audit trails of every data change

---

## Architecture

```
React Frontend (TypeScript/Vite)
  ↕ REST API + WebSocket
Django Backend (DRF + JWT)
  ↕
PostgreSQL Database
  ↕
Claude AI (Anthropic API) — for imaging/document analysis
```

---

## 3 Roles — Complete Flow

### Role 1: Superadmin

Platform-level control across all hospital tenants.

```
/superadmin/dashboard     → Platform health, total hospitals/users/patients
/superadmin/hospitals     → Create/manage hospital tenants
/superadmin/users         → Manage all platform users + roles
/superadmin/analytics     → Cross-hospital KPIs: AI accuracy, chemo completion
/superadmin/audit         → Full security + activity audit trail
```

---

### Role 2: Hospital (Clinician / Staff)

All clinical workflows: intake, imaging AI, oncology, treatments, billing.

**Complete Patient Journey:**

```
1. REGISTER PATIENT (/patients/add)
   → Name, DOB, gender, blood group, US address, emergency contact, insurance

2. UPLOAD & ANALYZE IMAGING (/hospital/imaging)
   → Upload CT/MRI/X-Ray/PDF/JPG
   → Claude AI analyzes → extracts findings, abnormalities, tumor indicators
   → Returns: confidence score, urgency level, recommendations, staging hints
   → Saved in Django MedicalReport model

3. CREATE ONCOLOGY RECORD (/oncology/add)
   → Select from 67 ACS cancer types
   → TNM staging: T stage, N stage, M stage (AJCC 8th Edition)
   → Clinical stage (Stage 0 through IVC)
   → Grade (G1–G4), histology type, tumor size
   → Biomarkers (ER, PR, HER2, PD-L1 as JSON)
   → ECOG performance status (0–4)
   → Recommended: surgery, chemo, radiation, immunotherapy, targeted therapy

4. TREATMENTS (/treatments)
   → 8 treatment types: surgery, chemo, radiation, immunotherapy, etc.
   → Response tracking: complete response, partial response, stable, progression
   → Calendar view at /treatments/calendar

5. SYMPTOM MONITORING (/symptoms)
   → Log symptoms with severity (mild / moderate / severe / life-threatening)
   → Pain score 0–10, progression tracking
   → Real-time notification to care team on severe reports

6. FOLLOW-UPS (/hospital/followups)
   → Follow-up date, imaging summary, tumor marker summary
   → Recurrence flag → auto-updates oncology status to "Recurrent"

7. PAYER SUBMISSION (/payer-submissions)
   → ICD-10-CM + CPT + HCPCS codes
   → CMS-1500 or UB-04 claim types
   → Authorization status tracking (pending/approved/denied/appealing)
   → Claim number tracking + resubmission support

8. PATIENT DETAIL (/patients/:id)
   → Tabs: Overview | Allergies | Vitals | Medications | Conditions | Lifestyle | Family History
```

---

### Role 3: Patient Portal

```
/patient/dashboard         → Treatment progress, vitals snapshot, active meds, AI plan
/patient/health-metrics    → Vitals history, symptom reports, quick links
/patient/treatment-plan    → Full treatment roadmap from oncologist
/patient/profile           → Edit profile, emergency contacts, insurance
/patient/documents         → All uploaded reports + AI summaries
/vitals                    → Vitals log (BP, sugar, SpO2, weight)
/medications               → Active medications list
/allergies                 → Allergy list
/conditions                → Chronic conditions
/symptoms                  → Report a symptom
```

---

## Imaging AI Pipeline

```
User uploads file (PDF/JPG/PNG)
  → File sent to Claude AI (/v1/messages) as base64
  → AI extracts:
     • document_summary
     • findings (array of findings)
     • abnormalities (array)
     • tumor_indicators (array)
     • recommendations (clinical)
     • urgency (routine/semi_urgent/urgent/emergent)
     • cancer_indicators (true/false)
     • confidence_score (0–100)
     • stage_hints
  → Results displayed instantly in UI
  → File + AI data saved to Django /medical-reports endpoint
  → Doctor reviews → Approves (links to oncology) or Rejects
```

---

## Notification System

- **WebSocket (Socket.io):** Real-time push to browser — new symptoms, AI complete, treatment updates
- **Email:** Backend sends emails for critical events (severe symptoms, AI report ready)
- Notification bell shows unread count badge; mark as read / mark all read
- Test notification endpoint available for development

---

## Key Django Models & Choices

| Model | Notable Choices |
|-------|----------------|
| Patient | gender (M/F/O), blood group (8 types), marital status (5), insurance (insured/non_insured), 50 US states |
| Allergy | severity: mild / moderate / severe |
| ChronicCondition | 30 condition types, status: active/controlled/in_remission/resolved |
| Lifestyle | smoking (5 levels), alcohol (4 levels), activity (5 levels), diet (8 types), stress (4 levels) |
| MedicalHistory | 15 disease choices for mother + father |
| Medication | frequency: once/twice/thrice/4x daily / as needed / weekly / monthly |
| MedicalReport | 14 document types, 7 pipeline statuses |
| OncologyRecord | 67 ACS cancer types, AJCC TNM staging (T0–T4b, N0–N3b, M0–M1c), Stage 0–IVC, Grade GX–G4 |
| OncologyTreatment | 8 treatment types, 5 response choices |
| OncologySymptomReport | severity: mild/moderate/severe/life_threatening, pain 0–10 |
| OncologyPayerSubmission | claim types: CMS-1500/UB-04/837P/837I, authorization + claim status tracking |

---

## API Endpoints

```
POST   /api/auth/login                    Login → JWT tokens
GET    /api/patients                      List patients (search, filter)
POST   /api/patients                      Create patient
PATCH  /api/patients/:id                  Update patient
DELETE /api/patients/:id                  Soft-delete (is_active=false)
CRUD   /api/allergies                     Patient allergies
CRUD   /api/vitals                        Patient vitals
CRUD   /api/lifestyle                     Lifestyle info (upsert)
CRUD   /api/medical-history               Family history (upsert)
CRUD   /api/medications                   Patient medications
CRUD   /api/chronic-conditions            Chronic conditions
CRUD   /api/medical-reports               Imaging uploads + AI results
CRUD   /api/oncology-records              Oncology diagnosis records
CRUD   /api/oncology-treatments           Treatment sessions
CRUD   /api/oncology-followups            Follow-up visits
CRUD   /api/oncology-symptoms             Symptom reports
CRUD   /api/payer-submissions             Insurance claims
GET    /api/dashboard/stats               Summary counts
GET    /api/notifications                 Notification list
PATCH  /api/notifications/:id/read        Mark read
GET    /api/audit-logs                    Audit trail
```

---

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```
# Backend
ANTHROPIC_API_KEY=sk-ant-...
SECRET_KEY=your-django-secret
DATABASE_URL=postgres://user:pass@localhost/oncocare
EMAIL_HOST=smtp.sendgrid.net
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=...

# Frontend (.env.local)
VITE_API_BASE=http://localhost:8000/api
```

### Docker
```bash
docker-compose up
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, React Router v6 |
| State | Redux Toolkit + React Context |
| API | Axios with JWT auto-refresh + Socket.io |
| Backend | Django 4, Django REST Framework |
| Auth | Simple JWT (access + refresh tokens) |
| Database | PostgreSQL |
| AI | Claude claude-sonnet-4 via Anthropic API |
| Deployment | Docker Compose |

---

## Compliance

- 67 ACS cancer types (American Cancer Society official list)
- AJCC 8th Edition TNM staging
- ICD-10-CM diagnosis codes
- CPT + HCPCS procedure codes  
- CMS-1500 and UB-04 claim form support
- Patient MRN auto-generated (UUID-based)
- Soft-delete for HIPAA-style record preservation
- Full audit trail via Django admin
