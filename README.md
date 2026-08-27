# Delta — one app (frontend + backend together)

**Delta**, a platform connecting **Founders**, **Consultants**, and **Investors** —
served as a single Node process: Express serves the API *and* the black-and-silver
frontend (`/public`) from the same origin, so there's nothing to configure or
CORS to fight with.

## Stack
Node.js, Express, MongoDB (Mongoose), JWT auth, Multer (file uploads), vanilla JS frontend.

## Run it
```bash
cd delta-app
cp .env.example .env   # fill in MONGO_URI (a local `mongodb://localhost:27017/delta` works)
                         # and set JWT_SECRET to any long random string
npm install
npm start                # or: npm run dev (with nodemon)
```
Then open **http://localhost:5000** — that's the whole app: landing page, "Get
started" → signup → role → profile/vision → ID upload → dashboard, all live
against the real API.

You'll need a running MongoDB instance (local install, Docker, or a free
MongoDB Atlas cluster — just paste its connection string into `MONGO_URI`).

**Note on ID verification:** `AUTO_APPROVE` is set to `true` in
`controllers/onboardingController.js` so you can walk through the full flow
end-to-end without a separate admin approval step. Flip it to `false` and wire
up `PATCH /api/onboarding/admin/review/:userId` (or a real KYC provider) before
shipping this for real.

## Onboarding Flow (3 interfaces)

**1. Sign up / log in**
- `POST /api/auth/signup` — `{ email, password }` → returns JWT
- `POST /api/auth/login` — `{ email, password }` → returns JWT

Send the JWT as `Authorization: Bearer <token>` on every request below.

**2. Interface 1 — Role selection**
- `POST /api/onboarding/role` — `{ role: "founder" | "consultant" | "investor" }`

**3. Interface 2 — Personal details + vision for joining**
- `POST /api/onboarding/profile` — `{ fullName, phone, location, vision, founderDetails / consultantDetails / investorDetails, ... }`

**4. Interface 3 — Government ID proof**
- `POST /api/onboarding/id-verification` (multipart/form-data)
  - fields: `idType`, `idNumber`
  - files: `documentFront` (required), `documentBack`, `selfie`
  - Defaults to **manual review** (`status: "pending"`). An admin approves via:
    - `PATCH /api/onboarding/admin/review/:userId` — `{ status: "approved" | "rejected", rejectionReason? }`
  - Set `AUTO_APPROVE = true` in `onboardingController.js` if you want instant approval instead.

- `GET /api/onboarding/status` — check current stage at any time.

Once `onboardingStage === "completed"`, the role-based dashboards below unlock.

## Founder dashboard (`/api/founder`)
| Feature | Endpoint |
|---|---|
| Pitch your idea | `POST /pitch`, `PUT /pitch/:id`, `GET /pitch/mine`, `DELETE /pitch/:id` |
| Search investors | `GET /search/investors?domain=&investorType=&q=` |
| Search consultants | `GET /search/consultants?expertise=&q=` |
| Portfolio / resume | `PUT /portfolio`, `GET /portfolio/mine` |
| Connect with other founders/investors | see **Connections** below |

## Consultant dashboard (`/api/consultant`)
| Feature | Endpoint |
|---|---|
| Browse/search founders | `GET /search/founders?domain=&stage=&isTechStartup=&q=` |
| Create your own consultancy | `POST /consultancy`, `PUT /consultancy/:id`, `GET /consultancy/mine` |
| Search investors | `GET /search/investors?domain=&q=` |
| Consultant resume | `PUT /resume`, `GET /resume/mine` |

## Investor dashboard (`/api/investor`)
| Feature | Endpoint |
|---|---|
| Search startups by preference (tech/non-tech, domain, stage) | `GET /search/startups?isTechStartup=&domain=&stage=&q=` |
| View a startup's full pitch | `GET /startups/:id` |
| List available domains (for filter UI) | `GET /domains` |
| Search consultants | `GET /search/consultants?expertise=&q=` |

## Connections (shared, `/api/connections`)
Works for any role pair (founder↔founder, founder↔investor, consultant↔founder, etc.)
| Feature | Endpoint |
|---|---|
| Send a connection request | `POST /request` — `{ recipientId, message? }` |
| Accept / reject | `PATCH /:id/respond` — `{ status: "accepted" \| "rejected" }` |
| My connections | `GET /mine` |
| Pending incoming requests | `GET /pending` |

## Notes for production
- Move uploaded ID documents to encrypted cloud storage (e.g. S3 + KMS) instead of local disk.
- Add rate limiting (`express-rate-limit`) on auth and ID-verification endpoints.
- Restrict `/api/onboarding/admin/review/:userId` to admin-only users (add an `isAdmin` flag or separate `Admin` model).
- Consider a real KYC provider (Onfido, Veriff, IDcheck) instead of manual review for the ID verification step.
