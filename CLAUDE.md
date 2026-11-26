# LearnPath: notes for Claude Code

College NoSQL project. Keep changes small and in the existing style; don't re-explore the whole repo.

## Layout
- `backend/` Express 5 + Mongoose 9, ES modules. `server.js` → `src/app.js` → `src/routes/index.js`
  - routes: `userRoutes.js` (`/api/users`), `learnRoutes.js` (everything else, with swagger comments)
  - controllers: `userController.js`, `learnController.js`
  - `src/middleware/auth.js`: JWT `signToken`, `protect` (sets `req.user = {id, role, name}`), `ownDataOnly` for `/students/:userId` (self; teacher only if `student.teacher` is them; admin anyone), `staffOnly` (teacher/admin), `adminOnly`
  - services: `analyticsService.js` (aggregations), `recommendationService.js` (vector search + LLM pipeline + TTL cache), `llmService.js` (Gemini REST + local fallbacks), `userService.js`
  - models: `User`, `Content` (embedding is `select:false`), `Question`, `QuizAttempt` (embedded answers), `RecommendationCache` (TTL)
  - `src/seed/data.js` + `seed.js` → `npm run seed`
- `frontend/learnPath/` React 19 + Vite, recharts. No router: `App.jsx` switches views by state.
  - `src/api.js` fetch wrapper: adds the Bearer token (localStorage `lp-token`), calls the `onUnauthorized` handler on 401 (Vite proxies `/api` → :5000)
  - `src/hooks/useRecommendations.js`, `src/components/{Auth,Dashboard,Recommendations,Quiz,QuizPage,Library,StudentsOverview,TeachersOverview}.jsx`
  - Roles: `student` → Dashboard/Quiz/Library; `teacher` → Students (own, via `User.teacher`)/Library; `admin` → Teachers (`TeachersOverview`, `/admin/teachers`) → Students (all or `?teacherId=`, + reassign)/Library. `Dashboard readOnly` is reused for the drill-down
  - Styles: all in `src/index.css` (`App.css` and `src/assets/` are leftover template files, unused)

## Rules
- Every non-auth route uses `protect`; take the student from `req.user.id`, never from the request body.
- Env loads via `import "dotenv/config"` as the first import (ES imports are hoisted).
- Every LLM/embedding call must keep a working fallback (no key → still demoable).
- Embedding dimension is 768 everywhere (`EMBED_DIM`); re-seed after changing embedding provider.
- Commands: backend `npm run dev`, `npm run seed`; frontend `npm run dev`, `npm run build`.
