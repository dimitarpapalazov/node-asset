# Project: Node Asset Management API

## Overview
This is a backend API project built with TypeScript and Express.js. The goal is to create a robust, scalable asset management system while showcasing clean code and DRY principles.

## Engineering Standards
- **Clean Code:** Prioritize readability, meaningful naming, and small, focused functions/classes.
- **Commenting:** Aim for self-documenting code. Use comments sparingly; they should be concise and focused on the "why" rather than the "how". Avoid verbose or redundant explanations.
- **File Structure:** In TypeScript files, all exported values, functions, and classes must be defined at the top of the file (after imports). Internal/private helper functions and variables should be placed at the bottom.
- **Formatting:** 
    - Use 4 spaces for indentation.
    - Always ensure there is a blank line before and after top-level code structures (such as if statements, loops, and functions).
- **DRY (Don't Repeat Yourself):** Abstract shared logic into reusable utilities (in `src/utils`) or middleware.
- **TypeScript:** Use strict typing where possible. Avoid `any`.
- **Architecture:** Adhere to a standard layered architecture to ensure separation of concerns:
    - `src/controllers`: Request/Response handling.
    - `src/services`: Business logic and core functionality.
    - `src/db`: Database schema (Drizzle) and connection setup.
    - `src/routes`: API endpoint definitions.
    - `src/utils`: Reusable helper functions (e.g., environment, shutdown).
- **App vs Server Separation:** Separate the Express application instance (`src/app.ts`) from the server listener (`src/index.ts`). This ensures that integration tests (using `supertest`) can bootstrap the application without binding to a network port.
- **Security:** 
    - Use `helmet` middleware to set secure HTTP headers by default.
    - Implement public asset retrieval via unique, short-lived expiring keys to protect storage internals.
    - Apply **CORS** with restricted origins and credentials support as configured.
    - Use **express-rate-limit** to protect API endpoints from abuse.
- **Validation:** Use **Zod** for schema validation. All request bodies, parameters, and queries must be validated using the `validate` middleware. Controllers should use the `ValidatedRequest` type and access data via `req.validData` to ensure type safety.
- **Error Handling:** Use the global `errorMiddleware` and the `ApiError` utility class for consistent error responses. Controllers should not use try-catch blocks for operational errors; instead, they should rely on the middleware to catch thrown `ApiError` instances.
- **Storage Lifecycle:** Ensure all file deletion operations trigger necessary storage cleanup (Content-Addressable Storage) to prevent orphaned files.
- **Environment Management:** Always use `envOrThrow` from `src/utils/env.ts` for environment variable access to ensure validation at startup.
- **Testing (TDD):** 
    - Mandate a Test-Driven Development (TDD) approach for all new features and bug fixes.
    - Implement comprehensive unit tests wherever possible.
    - Use **Vitest** for unit testing and **supertest** for integration testing.
    - Test files must use the `.test.ts` extension and be placed alongside the code they test.
    - Prioritize high test coverage for Services and Utilities.
- **Documentation:** Always update `README.md` to reflect changes in API surface area, features, or project structure as part of the implementation task.
- **Authentication:** Use JWTs with access/refresh tokens. Access tokens should be short-lived and stateless; refresh tokens are validated against `tokenVersion` in the DB for secure revocation.

## Workflow
- **Atomic Changes:** Each task/prompt should result in a single, atomic change comparable to a single git commit.
- **Validation:** Always verify changes with tests (`npm test`) and builds (`npm run build`).

## Technical Stack
- Language: TypeScript
- Framework: Express.js
- Security: Helmet.js & Express-rate-limit
- Validation: Zod
- Database: PostgreSQL (with Drizzle ORM)
- Queue: RabbitMQ
- Authentication: JSON Web Tokens (JWT) & Argon2
- Testing: Vitest & Supertest
- Infrastructure: Docker
