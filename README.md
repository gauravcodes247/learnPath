# LearnPath: Personalised AI Learning Content Recommender

React (Vite) + Express + MongoDB Atlas (Aggregation, Vector Search, TTL) + Gemini API.

A student takes topic quizzes → an aggregation pipeline computes topic-wise accuracy →
weak topics are matched to the content library with vector search → Gemini writes a
plain-language diagnosis, a step-by-step study plan and new practice questions,
grounded in the retrieved resources → the result is cached with a TTL index.

## Run it (≈10 minutes)

### 1. MongoDB Atlas (free)
1. Create a free **M0** cluster at cloud.mongodb.com.
2. *Database Access* → add a user + password. *Network Access* → add your IP (or `0.0.0.0/0` for the demo).
3. *Connect → Drivers* → copy the connection string.

### 2. Gemini key (free, optional)
Get one at https://aistudio.google.com/apikey. Without a key the app still works:
local embeddings + a rule-based study plan (the UI shows "Rule-based (no LLM)").

### 3. Backend
```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env  → then fill MONGODB_URI and GEMINI_API_KEY
npm install
npm run seed                # content library + embeddings, question bank, demo student, vector index
npm run dev                 # http://localhost:5000  (API docs: /api-docs)
```

Add these two lines to `backend/.env` (any long random string works as the secret):
```
JWT_SECRET=put-any-long-random-string-here
JWT_EXPIRES_IN=7d
```

### 4. Frontend
```bash
cd frontend/learnPath
npm install
npm run dev                 # http://localhost:5173
```
Log in with **demo@learnpath.com / 123456** (14 days of quiz history, weak in Graphs and DP).

Other seeded accounts (password `123456` for all):

| Account | Role | Sees |
|---|---|---|
| teacher@learnpath.com (Prof. Anjali Rao) | teacher | her students: Demo, Aarav, Priya |
| teacher2@learnpath.com (Prof. Vikram Iyer) | teacher | his students: Rohan, Sneha, Kabir |
| admin@learnpath.com | admin | **Teachers** page (every teacher's class stats) + every student, can reassign a student's teacher |
| aarav@, priya@, rohan@, sneha@, kabir@learnpath.com | student | own dashboard |

New students choose their teacher on the register form.

> If you add, remove or change `GEMINI_API_KEY`, run `npm run seed` again so the stored
> embeddings and the query embeddings come from the same model.

### Vector index (only if the seed couldn't create it)
Atlas → your cluster → **Atlas Search** → Create Search Index → **Vector Search** → JSON editor,
database `learnpath`, collection `contents`, name `content_vector_index`:
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "topic" }
  ]
}
```
Until the index is ready, the API falls back to cosine similarity computed in Node, and the
dashboard shows which method was used (`Retrieval: atlas-vector-search` vs `in-app-cosine`).

## Where each required concept lives

| Requirement | Where |
|---|---|
| Document modelling | `backend/src/models/`: `Content` (library + embedding), `Question`, `QuizAttempt` (answers **embedded**, topic denormalised), `RecommendationCache` |
| Aggregation pipeline | `backend/src/services/analyticsService.js`: `$unwind` → `$group` → `$project` per-topic accuracy inside one `$facet` (by topic, overall, trend); recent mistakes pipeline |
| Atlas Vector Search | `backend/src/services/recommendationService.js`: `$vectorSearch` on `content_vector_index`; index created in `src/seed/seed.js` |
| TTL index | `backend/src/models/RecommendationCache.js`: `createdAt` with `expires` (`RECO_TTL_SECONDS`); cache is also cleared when a new attempt is saved |
| LLM integration | `backend/src/services/llmService.js` (Gemini REST: generate + embed) and `buildPrompt()` in `recommendationService.js` |
| Dashboard + charts | `frontend/learnPath/src/components/Dashboard.jsx` (recharts bar per topic + score trend) |
| Conditional rendering | `Recommendations.jsx`: loading skeleton / error / empty / ready; cached vs fresh badges |
| Custom hook | `src/hooks/useRecommendations.js`: fetch + sessionStorage cache + regenerate |
| Quiz (controlled inputs, instant feedback) | `src/components/Quiz.jsx` |
| Student → teacher mapping | `User.teacher` (reference to another document in the same `users` collection, indexed); `ownDataOnly` lets a teacher open only students whose `teacher` is them |
| Admin teachers view | `getTeachersOverview()` in `analyticsService.js`: teacher → `$lookup` students → `$lookup` attempts with an **array** `localField` → `$map`/`$let` per-student scores → class topic accuracy; `TeachersOverview.jsx` |
| Teacher view (students) | `getAllStudentsOverview()` in `analyticsService.js`: `users` → `$lookup` attempts → `$unwind` answers → `$group` by (student, topic) → `$group` by student → `$sortArray`; `StudentsOverview.jsx` (table, search, weak-topic chart, drill-down) |
| JWT auth | `backend/src/middleware/auth.js` (`signToken`, `protect`, `ownDataOnly`); frontend `src/api.js` sends `Authorization: Bearer <token>` and logs out on 401 |

## API
All routes except register/login need `Authorization: Bearer <token>`.
`/students/:id/...` returns 403 unless `:id` is the logged-in student (or an admin).

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/users/register`, `/api/users/login` | auth, returns `{ token, user }` |
| GET | `/api/users/me` | user from the token |
| GET | `/api/content?topic=` | content library |
| GET | `/api/content/search?q=` | semantic search |
| GET | `/api/quiz/topics`, `/api/quiz/questions?topic=&limit=` | quiz bank |
| POST | `/api/quiz/attempts` | save attempt for the logged-in student (graded server-side) |
| GET | `/api/students/:id/analytics` | aggregation results |
| GET | `/api/students/:id/recommendations?refresh=true` | study plan (TTL-cached) |
| GET | `/api/users/teachers` | public list of teachers (sign-up dropdown) |
| GET | `/api/teacher/students` | teacher → own students, admin → all (or `?teacherId=`): quizzes, this week, score, weak + strongest topics, teacher name |
| GET | `/api/admin/teachers` | **admin only**: per teacher: students, active this week, quizzes, class average, students below 60%, weakest topic; plus unassigned count |
| PATCH | `/api/admin/students/:id/teacher` | **admin only**: assign/unassign a student's teacher |

## Demo script (for evaluation)
1. Log in as the demo student → dashboard: red bars for Graphs and Dynamic Programming.
2. Study plan shows the diagnosis, ordered resources with match scores, and badges for cache/LLM/retrieval.
3. Refresh the page → "Cached" (served from the TTL cache).
4. Click **Practise targeted questions** → answer → instant feedback → back to Dashboard: charts updated and a fresh plan generated.
5. Library tab → search "shortest path with negative weights" → semantic results with scores.
6. Log in as **teacher@learnpath.com** → only her 3 students (quizzes, this week, score, weak topics) → click one to open their dashboard. Log in as **teacher2@** → a different 3. Log in as **admin@** → **Teachers** page (class average, students below 60%, weakest topic per teacher) → click a teacher for their students → reassign with the Teacher dropdown.
7. Show `/api-docs`: call `/api/users/login`, click **Authorize**, paste the token, then call the protected routes. Without it they return 401.
8. Show the indexes in Atlas (`createdAt` TTL index, `content_vector_index`).

## Not done yet / ideas for "refinement after peer testing"
- Save good AI-generated questions into the `questions` collection (`source: "ai"`).
- Admin page to add content (embedding generated on insert).
