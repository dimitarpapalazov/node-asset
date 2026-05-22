# Project: Node Asset Management API

## Overview
This is a backend API project built with TypeScript and Express.js. The goal is to create a robust, scalable asset management system while showcasing clean code and DRY principles.

## Engineering Standards
- **Clean Code:** Prioritize readability, meaningful naming, and small, focused functions/classes.
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
- **Environment Management:** Always use `envOrThrow` from `src/utils/env.ts` for environment variable access to ensure validation at startup.
- **Testing:** 
    - Use **Vitest** for unit and integration testing.
    - Test files must use the `.test.ts` extension and be placed alongside the code they test.
    - Prioritize testing for Services and Utilities.

## Workflow
- **Atomic Changes:** Each task/prompt should result in a single, atomic change comparable to a single git commit.
- **Validation:** Always verify changes with tests (`npm test`) and builds (`npm run build`).

## Technical Stack
- Language: TypeScript
- Framework: Express.js
- Database: PostgreSQL (with Drizzle ORM)
- Testing: Vitest
- Infrastructure: Docker
- (Upcoming: RabbitMQ)
