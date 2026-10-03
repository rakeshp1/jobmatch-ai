# Testing report

Review date: 2026-10-03. Code under test started at commit `9d3fbee` on `cursor/jobmatch-ai-cabb`, checked out at `/tmp/jobmatch-review`. Frontend `http://127.0.0.1:43123` and API `http://127.0.0.1:43124` were restarted from that worktree. Checks used the HTTP API, headless Chrome (Playwright), and a deliberate database-open failure.

## Checklist

| Area | What was exercised | Result |
| --- | --- | --- |
| Dashboard | Empty board, then sample jobs after a sample resume. Stats, Ready / Optimization / Skill gap sections, Add job and Load sample jobs. | Passed after fixes |
| Resume upload | Choose PDF, sample resume, extracted skills and text | Passed |
| PDF validation | `.txt` renamed in the browser; HTML bytes named `.pdf`; blank PDF; 26-page PDF; 5 MB + 200 bytes | Rejected with a clear 400. No stack in the body |
| Resume replacement | Replace sample PDF with another text PDF, then load the sample again | Passed |
| Add job | Empty submit, short description, `javascript:` URL, valid save | Field errors, then analysis page |
| Edit job | Change title and save | Returned to analysis with the new title |
| Delete job | Confirm dialog, Escape cancels, confirm deletes and returns to matches | Passed |
| Job matches | Filters with `aria-pressed`, search “Helios”, re-score path covered by API `analyze` and `analyze-all` | Passed |
| View analysis | Score, disclaimer, skills, recommendations | Passed |
| Improve match | Accept disabled with nothing selected; placeholder draft blocked; edited line saved; re-run | Passed |
| Accept recommendations | UI and API. Old `{ recommendationIds }` body is rejected. Unedited `[[placeholder]]` text is rejected | Passed |
| Re-run match analysis | Improve page button and `POST /jobs/:id/analyze` | Passed |
| Ready to apply | Sample Senior Data Engineer scored 90, status `ready_to_apply` | Passed |
| Open application | Applications board opened `https://example.com/jobs/northstar-senior-data-engineer` in a new tab | Passed |
| Mark as applied | Mark Senior Data Engineer applied, then Move back | Passed |
| Applications page | Columns with jobs, and the empty state “No applications yet” on a fresh database | Passed |
| Navigation / sidebar | Primary nav on desktop. At 390px the sidebar stays `visibility: hidden` until Menu, then Resume navigation works | Passed |
| Loading states | Present in the components. The browser run waited on real requests; it did not freeze the network to screenshot each spinner | Not separately screenshot-tested |
| Empty states | Dashboard “No roles yet”, applications “No applications yet”, per-column “None in this status” when jobs exist | Passed for the first two |
| Error messages | Validation, bad upload, missing file, bad JSON, unknown route, API stopped | Passed. See below |
| Responsive layout | Chrome at 1280×900, 768×900, and 390×844. Horizontal overflow was 0 on dashboard, matches, and resume | Passed |
| Not found route | `/does-not-exist` shows “That page is not on the board” | Passed |

## Scenarios

- Empty fields on Add job: title, company, and description errors. Submit stays on the page.
- Very long text: a 20,001-character description returns 400 “Job description must be between 40 and 20,000 characters.” A URL longer than 2,000 characters returns 400.
- Invalid URLs: `javascript:alert(1)`, `ftp://`, `www.example.com`, and `https://user:pass@example.com/jobs/1` are rejected. `https://example.com/jobs/special` is stored.
- Invalid resume types and missing file: `.txt` is rejected in the browser and by `POST /resume`. A missing file returns 400 “Choose a PDF resume to upload.”
- Duplicate jobs: creating the same title and company twice via the API returns two rows and does not crash. Loading samples a second time adds 0 and skips 4. A double form submit used to create two jobs; after the fix it creates one.
- Special characters and markup: title `<img src=x onerror=alert(1)> Engineer` and company `O'Reilly & Sons` render as text. Chrome recorded no page error. SQL title `' OR 1=1 --` is stored as that literal string.
- Extremely long job descriptions: rejected at 20,001 characters. A JSON body over the 1 MB parser limit returns 413 “Request is too large.”
- API stopped: dashboard still shows “Where your search stands” and the banner “Cannot reach the API. Start the backend on port 43124 and refresh.” No page error.
- Database cannot be opened: replacing `jobmatch.db` with a directory makes the process exit. The log line is `JobMatch could not open its database (SQLITE_CANTOPEN).` The browser is in the same state as an API outage. Data was restored afterward; the four sample jobs and the sample resume came back.
- Rapid repeated clicks: two `requestSubmit()` calls on Add job created two “Rapid Click Role” rows before the fix and one “Single Submit Role” after it.
- Match spread with the sample resume: Senior Data Engineer 90 Ready to Apply, Azure Data Engineer 74 Needs Improvement, Data Scientist 56 Saved, Machine Learning Engineer 29 Saved.

## Bugs found

1. Improve Match inserted canned first-person accomplishments such as “Owned Kafka topics and consumer jobs…”. Accepting one moved a 54% job to 97% and Ready to Apply.
2. A short line containing the word “required” was treated as a section heading, so “Kafka and Terraform are required…” contributed no skills.
3. `POST /api/jobs` from `Origin: https://evil.example` returned 201 and stored the job. The response omitted `Access-Control-Allow-Origin`, but the write still happened.
4. Double-submitting the job form created two jobs because the save handler awaits scoring and the button disable happens on the next render.
5. Job ids that are not safe integers were accepted by `Number()` and answered 404 instead of 400.
6. Resume display names kept characters such as `<script>`.
7. PDFs were not limited by page count.
8. If rescoring threw after a resume save, the UI still said scores were refreshed. The failure was only a server warning.
9. A database that cannot be opened printed a SQLite stack and exited.
10. On viewports at or below 860px the closed sidebar was only moved off-screen, so its links stayed available to keyboard users.
11. Eyebrow text `#c4512a` on `#f3efe6` measured 4.02:1.
12. The Improve Match heading called template text “AI-recommended” even though those lines are local drafts.

## Bugs fixed

- Recommendations are conditional drafts. Accepting requires 25–500 characters written by the user and rejects leftover `[[placeholders]]` and the stock phrases. The canned Kafka/Terraform accomplishment bullets are gone. A user-written Kafka line moved 47% to 62%, not to a fabricated Ready to Apply score.
- Section labels must look like headings. Sample bands stayed 90 / 74 / 29 / 56.
- Disallowed browser origins receive 403 before the route runs. A repeat of the evil-origin POST did not increase the job count.
- The job form, Improve Match actions, and Load sample jobs ignore a second click while the first request is in flight.
- Job ids must be safe positive integers.
- Stored resume names are basenames, stripped of control characters and `<>:"\|?*`, and end in `.pdf`. `alex <script>.pdf` is stored as `alex script.pdf`.
- PDFs over 25 pages are rejected. Extracted text over 100,000 characters is rejected. PDF.js is called with `isEvalSupported: false`.
- Resume responses include `scoresRefreshed` and `scoreWarning`. The resume page shows the warning when rescoring fails.
- A database open failure exits with one line and no stack.
- Closed mobile sidebar uses `visibility: hidden`.
- Eyebrow color is `#7a3018` (8.08:1 on the page background, 9.13:1 on cards).

## Error-handling improvements

- 400 for bad JSON, validation, bad uploads, placeholder recommendations, and unsafe ids.
- 403 for a browser origin that is not in `CORS_ORIGIN`.
- 404 for unknown routes and missing jobs.
- 409 for a SQLite unique-constraint failure, with a refresh message and no SQL text.
- 413 for payloads over 1 MB.
- 500 responses stay “Something went wrong on the server.” The handler does not send `err.stack`.
- Upload limits: 5 MB, one file, few multipart fields. Non-PDF names, non-PDF bytes, empty text, and oversized files return a short message.
- Application links are opened only after a client-side `http:` / `https:` check with no username or password. A blocked pop-up returns a sentence instead of failing silently.
- Match copy says the percentage is an overlap estimate and does not predict an interview or an offer.

## Accessibility improvements

- Job fields use `label` + `htmlFor`, `aria-invalid`, and `aria-describedby`. Errors have `role="alert"`.
- The shell content is a `<main>`. The menu button has `aria-controls` and its name switches to “Close menu”. Escape closes the menu.
- Confirm dialogs move focus inside, trap Tab, expose a description, and return focus on close.
- Match filters use `aria-pressed`. Repeated card actions include the job title in the accessible name.
- The score ring graphic is `aria-hidden`; the percentage text remains.
- Focus outline was already `:focus-visible` and was left in place. Skip link is present and could take focus in the browser test.
- Placeholder and sample-load messages use `role="alert"` or `role="status"`.

## Final status

The workflows above pass against the worktree servers. Loading spinners were not captured as their own timed screenshots. No live AI provider was called, because no `AI_API_KEY` is set; the prompt and the response sanitizer were changed and then read back in code. A real scanned image was not uploaded; a textless PDF was. `npm audit` in the frontend still reports two moderate React Router issues. The patched release is a major upgrade, so it was not applied.
