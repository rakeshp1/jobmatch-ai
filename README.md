# JobMatch AI

JobMatch AI helps a job seeker compare one resume with one or more job descriptions. It scores the overlap from 0–100%, explains the gaps, suggests resume wording, and tracks which roles are ready to apply.

It is a workflow, not a chatbot. Nothing is submitted to an employer. A score is an estimate of written overlap, not a guarantee of qualification or an interview.

## Features

- Upload a text-based PDF resume and review the extracted text, detected skills, and detected experience.
- Add, edit, and delete jobs with a title, company, description, and optional application URL.
- Score every job against the working resume.
- Bands: 90–100% Ready to Apply, 70–89% Resume Optimization Recommended, below 70% Significant Skill Gap.
- For each job: match percentage, matching skills, missing skills, missing keywords, experience gaps, recommendations, and a short explanation.
- Improve Match for roles under 90% shows the closest current wording, missing keywords, skills you might emphasize, and a draft you must edit.
- Accept only wording you rewrite so it is true. Placeholder drafts are rejected. Re-run the match afterward. A new estimate of 90% or higher moves the job to Ready to Apply. That status is an overlap band, not a prediction of an interview or an offer.
- Apply opens the saved URL in a new tab, or you mark the job Applied yourself.
- Statuses: Saved, Needs Improvement, Ready to Apply, Applied.
- Load four sample data roles on demand. They are not inserted until you click **Load sample jobs**.
- Optional sample data-engineer resume, also loaded only when you ask for it.

## Stack

- Frontend: React, Vite, React Router, Axios, modern CSS
- Backend: Node.js, Express
- Database: SQLite via `better-sqlite3`
- PDF text extraction: PDF.js (`pdfjs-dist`)
- Sample PDFs: `pdf-lib`
- Config: `dotenv`

## Architecture

```
frontend/   React UI (port 43123)
   │  REST
backend/    Express API (port 43124)
   ├── controllers/   HTTP in and out
   ├── routes/
   ├── services/      matching, improvements, PDF text, validation
   ├── models/        SQL
   ├── database/      SQLite file in backend/data (gitignored)
   └── uploads/       resume PDFs (gitignored)
```

The UI never embeds match math. The API returns structured analysis:

`matchScore`, `matchingSkills`, `missingSkills`, `missingKeywords`, `experienceGaps`, `recommendations`, `explanation`.

## How AI matching works

If `AI_API_KEY` is set, scoring calls an OpenAI-compatible chat completions endpoint (`AI_BASE_URL`, default `https://api.openai.com/v1`, model `AI_MODEL` or `gpt-4o-mini`). The model must return the JSON shape above. Invalid responses, timeouts, and HTTP errors fall back to the local matcher. Improve Match wording is always generated locally so suggestions stay available without a key.

## How fallback matching works

With no API key, the local matcher scores three signals:

1. **Skill overlap.** A skill catalog (Python, Spark, Azure Data Factory, PyTorch, and so on) is detected in the resume and the job. Requirements-section skills weigh more than body mentions, which weigh more than preferred skills.
2. **Keyword overlap.** Phrases such as “medallion architecture” or “stakeholder communication” are compared the same way.
3. **Experience alignment.** Years requested versus years found, plus overlap between the job title and the resume.
4. **Resume keyword frequency.** Matched skills that show up repeatedly nudge the score up a few points. A single passing mention does not.

The final percentage is a weighted blend of those signals, clamped to 0–100. The same resume produces different scores when the job descriptions emphasize different skills. Against the bundled data-engineer sample, the four sample jobs land in different bands: one ready to apply, one optimization, and two skill gaps.

Accepting a suggestion appends the wording you edited to a working copy of the resume. The app does not invent employers, metrics, or accomplishments, and it does not check that the line is true. The original PDF text is kept. The next match run sees the words you added, so the estimate can move. Reset to PDF text on the Resume page throws those additions away.

## Installation

Requirements: Node.js 18 or newer.

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

## Environment

Copy the example file if you want to override defaults. The app runs with no `.env` and no API key.

```bash
cp .env.example .env
```

| Variable | Role |
| --- | --- |
| `PORT` | API port. Default `43124`. |
| `CORS_ORIGIN` | Browser origins allowed to call the API. |
| `VITE_API_BASE_URL` | Optional. Frontend defaults to `http://127.0.0.1:43124/api`. Vite reads repo-root env files. |
| `AI_API_KEY` | Optional. Leave empty to use the local matcher. |
| `AI_BASE_URL` | Optional OpenAI-compatible base URL. |
| `AI_MODEL` | Optional model name. |

Do not commit real keys or uploaded resumes.

## Run

Start the API:

```bash
cd backend
npm start
```

API: [http://127.0.0.1:43124](http://127.0.0.1:43124)

Start the UI in a second terminal:

```bash
cd frontend
npm run dev
```

App: [http://127.0.0.1:43123](http://127.0.0.1:43123)

Health check: `GET http://127.0.0.1:43124/api/health`

## Try the workflow

1. Open Resume and choose **Use sample resume**, or upload your own text-based PDF.
2. On the dashboard, click **Load sample jobs**.
3. Compare the four scores. Open a role under 90% and use **Improve Match**.
4. Accept a few recommendations, then **Re-run match analysis**.
5. When a role reaches 90%, use **Apply** to open the link, or **Mark applied**.

## Known limitations

- Apply does not submit applications to external sites. It only opens a URL or records that you marked the job applied.
- Scores are estimates of resume-to-description overlap. They are not a guarantee of qualification or an interview.
- The local matcher is lexical. It cannot judge impact, seniority quality, or whether a claim is true.
- Image-only and scanned PDFs have no selectable text and are rejected.
- One active resume is stored at a time. There are no user accounts.
- Optional AI scoring depends on a provider you configure. Improve Match bullets are template-based even when that provider is on.
