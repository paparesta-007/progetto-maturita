# SKILL: Feature & Modification Pre-Analysis
**v2.0 — Grounded in Codebase, Hallucination-Resistant**

## Objective
Before implementing any code additions or modifications, you must produce a structured analysis anchored strictly in the actual code read. Every technical statement must cite its source (specific file + function/line). **Do not write any code until the user has explicitly approved the implementation plan.**

## Activation Trigger
Initiate this protocol for any user request containing:
* "add", "implement", "create", "insert"
* "modify", "change", "update", "refactor"
* "remove", "delete", "deprecate"
* Or any operation that alters the behavior of an existing function, route, component, or model.

---

## MANDATORY ANTI-HALLUCINATION RULES
*These rules take absolute priority over all other instructions.*

1. **NO BLIND ASSERTIONS:** Never state what a file does without having read it. If you have not read a file, write `[UNREAD]` and document it in the Knowledge Gaps section.
2. **CITE SOURCES:** Every technical claim must include its origin. Use the format `[path/to/file.ext, functionName/line]` or `[INFERRED FROM: ...]`.
3. **CONFIDENCE LEVELS:** You must distinguish between three levels of confidence for every claim:
   * `[READ]` — You have read the file/function and the claim is strictly based on it.
   * `[INFERRED]` — You have not read the target file, but deduced the information from conventions or other verified files.
   * `[UNKNOWN]` — You lack sufficient information; requires reading before proceeding.
4. **BLOCKING GAPS:** If missing information renders the analysis unreliable, **STOP IMMEDIATELY**. List the exact files or contexts required. Do not proceed with empty or highly speculative sections.
5. **NO FABRICATIONS:** Never invent names for functions, tables, columns, endpoints, or variables that you have not explicitly seen in the codebase.
6. **FLAG ASSUMPTIONS:** Explicitly state every assumption made, regardless of how obvious it may seem.

---

## PHASE 0: CODEBASE RECONNAISSANCE
*(Mandatory. Must be executed and documented before populating any subsequent sections)*

### 0a. Relevant Files Read
List every file read to produce this analysis, including the specific sections and relevance:

| File | Sections/Functions Read | Relevance |
| :--- | :--- | :--- |
| `path/to/file.ext` | `functionName()`, lines 40-80 | Contains the core authentication logic. |
| ... | ... | ... |

### 0b. Knowledge Gaps
List unread files that are strictly necessary for a comprehensive analysis:

| Missing File | Why It Is Needed | Impact on Analysis |
| :--- | :--- | :--- |
| `path/to/missing.ext` | Contains current database migrations | DB section is partially speculative. |
| ... | ... | ... |

**CRITICAL:** If knowledge gaps make the overall analysis unreliable, halt the output here and ask the user for the missing files before continuing.

### 0c. Confirmed Tech Stack
List only the technologies verified by reading actual configuration files (e.g., `package.json`, `requirements.txt`, `go.mod`):
* **Language/Runtime:** `[READ from package.json]` Node.js 20, TypeScript 5.3
* **Framework:** `[READ from app.module.ts]` NestJS 10
* **ORM/DB:** `[INFERRED from imports]` TypeORM + PostgreSQL
* **Relevant Versions:** ...

---

## 1. TECHNICAL FEASIBILITY
* **Feasible?** Yes / Yes with limitations / No
* **Rationale:** (Cite the read files supporting this evaluation)
* **External Dependencies to Add:** (Library name, version, and reason)
* **Conflicts with Existing Dependencies:** `[READ / INFERRED / UNKNOWN - SOURCE]` 
* **Confirmed Technical Constraints:** (Only list those verified in the codebase)
* **Assumptions Made:** (List each assumption with its confidence level)
* **Complexity Estimate:** Low / Medium / High / Very High
*(Use `[UNKNOWN]` for any point that cannot be verified with the currently available files).*

---

## 2. BACKEND IMPACT

### Routes / Endpoints
| Action | Method | Path | Impacted File | Confidence Level |
| :--- | :--- | :--- | :--- | :--- |
| New | POST | `/users/avatar` | `src/users/controller.ts` (to create) | `[READ pattern confirmed]` |
| Modify | GET | `/users/:id` | `src/users/controller.ts` | `[READ line 42]` |

### Impacted Functions / Methods
For every function that requires modification:
* **File:** `src/users/users.service.ts`
* **Function:** `createUser()` `[READ, lines 15-48]`
* **Required Change:** Add `avatar_url` validation before saving.
* **Known Side Effects:** Calls `sendWelcomeEmail()` — verify if impacted.

### Middlewares / Guards / Interceptors
* **Existing Modified:** `[READ / INFERRED / UNKNOWN - SOURCE]` (Which ones and how)
* **New Required:** (Name, responsibility, insertion point)

### Error Handling
* **New Error Cases:** (HTTP codes, messages, where they are thrown)
* **Existing Errors to Update:** `[READ / INFERRED / UNKNOWN - SOURCE]`

### Authentication / Authorization
* **Permission Changes?** `[READ / INFERRED / UNKNOWN - SOURCE]`
* **Guards Involved:** (File name and class)

---

## 3. DATABASE IMPACT

### Structure
| Table | Action | Detail | Confidence |
| :--- | :--- | :--- | :--- |
| `users` | Modify | Add column `avatar_url VARCHAR(500) NULL` | `[INFERRED: schema unread]` |
| `uploads` | New | Fields: `id`, `user_id FK`, `url`, `size`, `created_at` | `[READ pattern from migrations]` |

### Migrations
* **Required?** Yes / No
* **Type:** Additive (non-destructive) / Destructive / Requires backfill
* **Reversible?** Yes / No — (Provide rationale)
* **Risk to Existing Data:** `[UNKNOWN — verify users table volume before proceeding]`

### Impacted Queries
* `[READ src/users/users.repository.ts line 67]`
  * `SELECT * FROM users WHERE id = $1` -> Impact: None, additional column does not break `SELECT *`.
* `[INFERRED]`
  * User serialization query in `users.serializer.ts` -> Might expose `avatar_url` unexpectedly; verify first.

### Indexes / Performance
* **New Indexes Required:** (Column name, type, rationale)
* **Potentially Slow Queries:** `[READ / INFERRED / UNKNOWN - SOURCE]`

---

## 4. IMPACT ON EXISTING LOGIC

### Impacted Features (Direct & Indirect)
| Feature | Impact | Impacted File | Confidence |
| :--- | :--- | :--- | :--- |
| User Profile | Serializer will expose the new field | `src/users/serializer.ts` | `[INFERRED]` |
| Welcome Email | None (Logic is isolated) | `src/mail/mail.service.ts` | `[READ — does not use avatar]` |

### Breaking Changes
* **Present?** Yes / No
* **Detail:** (What breaks, for whom, and under what conditions)
* **Backward Compatibility:** (Will the old behavior remain available?)

### Legacy Data Compatibility
* **Are existing data records compatible?** `[READ / INFERRED / UNKNOWN - SOURCE]`
* **Potential for orphaned/inconsistent records?** (List specific scenarios)

### Non-Obvious Side Effects
* **Cache:** (Invalidation required? Which layer?)
* **Background Jobs/Workers:** `[READ / INFERRED / UNKNOWN - SOURCE]`
* **Webhooks / Event Bus:** `[READ / INFERRED / UNKNOWN - SOURCE]`
* **Serializers / DTOs:** (Required updates)

---

## 5. FRONTEND IMPACT
*(State "Not applicable" with reasoning if the change is strictly Backend/DB)*

### Components
| Action | Component | File | Confidence |
| :--- | :--- | :--- | :--- |
| New | `AvatarUpload` | `src/components/AvatarUpload.tsx` | `[READ pattern from similar components]` |
| Modify | `UserProfile` | `src/pages/Profile.tsx` | `[INFERRED — unread]` |

### API Contract
* **Request Payload Changes:** (Endpoint, added/removed fields, types)
* **Response Shape Changes:** (Added, removed, or renamed fields)
* **Versioning Required?** (Is this a breaking change for existing clients?)

### Application State
* **Modified Stores / Contexts:** `[READ / INFERRED / UNKNOWN - SOURCE]`
* **New Local State Required:** (Where, and what it manages)

### UX Impact
* **Altered User Flows:** (Describe the flow transition: Before -> After)

---

## 6. SECURITY 
*(Mandatory section — never omit)*

* **Input Validation:** (What are the new inputs? Are they sanitized? Where?)
* **Added Attack Surface:** (New public endpoints, file uploads, etc.)
* **Authentication on New Endpoints:** (Are they protected? By which guard?)
* **Sensitive Data Exposure:** (New fields in responses that shouldn't be public)
* **Added Dependencies:** (Known vulnerabilities? Using the latest stable version?)
* **Excessive Permissions:** (Does the new code request more privileges than necessary?)

---

## 7. IMPLEMENTATION PLAN
*Every step must include exact files, precise actions, and dependencies.*

* **STEP 1 — DB Migration**
  * **File:** `db/migrations/[timestamp]_add_avatar_url_to_users.ts`
  * **Action:** Add column `avatar_url VARCHAR(500) NULL`
  * **Reversible:** Yes (DROP COLUMN)
  * **Dependencies:** None
  * **Blocks:** Step 2
* **STEP 2 — Update Entity / Model**
  * **File:** `src/users/entities/user.entity.ts`
  * **Action:** Add field `avatarUrl: string | null`
  * **Dependencies:** Step 1
  * **Blocks:** Step 3, Step 4
* ... [Continue detailing all steps] ...
* **Critical Path:** Step 1 -> 2 -> 3 -> 4 -> 5 -> 6 (Note any parallelizable steps)

---

## 8. RISKS AND ATTENTION POINTS

### Technical Risks
| Risk | Probability | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Upload file sizes too large | High | Medium | Define `MAX_FILE_SIZE` prior to implementation. |
| CDN not configured | `[UNKNOWN]` | High | Verify infrastructure before deployment. |

### Open Decisions (Require answers before proceeding)
* [ ] Maximum file size limit: How many MB?
* [ ] Storage solution: Local filesystem, S3, or other?
* [ ] Should legacy files be deleted when an avatar is updated?
* [ ] `[UNKNOWN avatar_url]` — nullable field or default placeholder?

### Assumptions Made (To be validated)
* `[INFERRED]` Project utilizes `multer` for file uploads (Unverified via `package.json`).
* `[INFERRED]` Frontend utilizes React (Inferred from project structure, unconfirmed).

### Security & Data Risks
* **Security:** Executable files disguised as images -> Server-side MIME type validation required, extension checks are insufficient. Path traversal risks -> Utilize generated UUIDs instead of original filenames.
* **Data:** Additive migration presents low risk, but `users` table volume must be verified before production execution.

---

## 9. TESTING STRATEGY

* **Unit Tests to Add:** (List target files and specific test cases, e.g., `uploadAvatar` accepts valid JPEG, rejects non-image files, etc.)
* **Integration Tests:** (List endpoints and specific scenarios, e.g., Authenticated + valid file -> 200, Unauthenticated -> 401, etc.)
* **Edge Cases:** (Concurrent uploads, user deletion mid-upload, unreachable storage, corrupted files).
* **Recommended Manual Tests:** (Full UI flow, mobile specific tests).

---

## 10. EXECUTIVE SUMMARY

| Metric | Status | Notes |
| :--- | :--- | :--- |
| **Technical Feasibility** | Yes / Warn / No | |
| **Backend Impact** | Low / Medium / High | |
| **Database Impact** | Low / Medium / High | |
| **Breaking Changes** | Yes / No | |
| **DB Migrations** | Yes / No | Additive, Reversible |
| **Security** | Requires Attention | File validation, Storage |
| **Knowledge Gaps** | N unread files | Listed in Phase 0b |
| **Effort Estimate** | X hours / Y days | |
| **Overall Risk** | Low / Medium / High | |

---

## AI BEHAVIORAL DIRECTIVES
1. **NO CODE GENERATION:** Do not write implementation code during this phase. Output only the analysis and plan.
2. **PHASE 0 PRIORITY:** Phase 0 is mandatory and precedes everything. Immediately declare if relevant files are unread.
3. **SOURCED CLAIMS:** Every technical assertion must have an explicit source or confidence level.
4. **EMBRACE THE UNKNOWN:** `[UNKNOWN]` is a valid state and strictly preferred over hallucination.
5. **HALT ON GAPS:** If Phase 0b gaps render the analysis fundamentally unreliable, interrupt the output and request the files before continuing.
6. **RESOLVE BLOCKERS:** All open decisions in Section 8 must be resolved before the user approves the plan.
7. **NO FILE ASSUMPTIONS:** Do not assume the structure of unseen files, even if the naming convention appears obvious.
8. **FLAG CONFLICTS:** Point out discrepancies between inferred data and what might realistically exist in the stack.
9. **MANDATORY CLOSING:** You must conclude the analysis by asking:
   *"Do you want me to read additional files before proceeding, or can we move forward with this plan?"*