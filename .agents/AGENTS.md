# Project Rules for CineMind

## Implementation Priority Order
When there are multiple implementation options or ambiguities, ALWAYS prioritize decision-making in the following order:
1. User Request (Yêu cầu trực tiếp của tôi)
2. Project Documentation (Tài liệu trong project)
3. Coding Convention (Quy chuẩn lập trình của dự án)
4. Reference Website (Website tham khảo chieuphimquocgia.com.vn)
5. AI Proposals (Đề xuất của AI)

*Note: The reference website is NEVER the final decision maker.*

## Real World Architecture & Data Binding Standard
- All UI data (movies, banners, theaters, showtimes, promotions, news, reviews, user preferences...) MUST be fetched dynamically from Backend APIs and Database.
- NO hard-coded business data in Frontend components.
- Frontend responsibilities:
  - Call APIs (using `axiosClient`).
  - Render data dynamically.
  - Handle `loading`, `empty`, and `error` states gracefully.
- Backend responsibilities:
  - Manage data, business logic, and security.
  - Handle image uploads (e.g., Cloudinary) and store image URLs in DB.
  - Expose RESTful APIs for consumption.
- Admin CRUD updates must immediately reflect on the Frontend UI without modifying Frontend source code.
- Temporary Mock Data: Used ONLY when Backend API does not exist yet. Must be clearly marked with comments `// MOCK DATA - REPLACE WITH API: <ENDPOINT>` for easy replacement when APIs are implemented.

## Git Branching & Synchronization Standard
- Every feature implementation MUST have separate dedicated branches for both Backend and Frontend.
- BE and FE must always be synchronized on the feature scope (BE feature X = FE feature X).
- Branch Naming Convention:
  - Backend: `feature/<feature-name>` (e.g., `feature/auth-foundation`)
  - Frontend: `feature/<feature-name>-fe` (e.g., `feature/auth-foundation-fe`)
- `main` / `master` branch MUST only contain base/foundation setup. Feature-specific code lives in its feature branch until merged.

## Business Reference
- Reference Website: https://chieuphimquocgia.com.vn/
- Purpose: The reference website is used only to understand the general business workflow of an online movie ticket booking system.
- The project DOES NOT aim to clone or replicate this website.
- Development principles:
  - Keep the implementation simple.
  - Suitable for a university graduation project.
  - Focus on core business features only.
  - Ignore enterprise-level functionalities.
  - If the reference website contains complex workflows, simplify them while preserving the main business logic.
  - Never assume a feature exists unless it is explicitly required in this project.

## Coding Rules
- Always minimize context usage.
- Only read files related to the current feature.
- Never scan the whole project.
- Never refactor unrelated code.
- Never change APIs unless requested.
- If more information is needed, ask me before reading additional files.
- Always explain why a file is needed before opening it.

## Feature Lifecycle & Approval Workflow
- Every feature development MUST follow this step-by-step lifecycle:
  1. Complete Feature Implementation (Hoàn thành feature)
  2. Commit
  3. Push
  4. Pull Request
  5. Merge into main
  6. Checkout main
  7. Pull origin/main
  8. Create new branch from main
  9. Code next feature
- **CRITICAL:** Every single step/action in this workflow MUST be explicitly confirmed and approved/edited by the user before execution. Never proceed to the next step without user confirmation.
