# Project: Node Asset Management API

## Overview
This is a backend API project built with TypeScript and Express.js. The goal is to create a robust, scalable asset management system while showcasing clean code and DRY principles.

## Engineering Standards
- **Clean Code:** Prioritize readability, meaningful naming, and small, focused functions/classes.
- **File Structure:** In TypeScript files, all exported values, functions, and classes must be defined at the top of the file (after imports). Internal/private helper functions and variables should be placed at the bottom.
- **Formatting:** 
    - Use 4 spaces for indentation.
    - There should be a new line before and after each block of code (curly braces).
- **DRY (Don't Repeat Yourself):** Abstract shared logic into reusable utilities or middleware.
- **TypeScript:** Use strict typing where possible. Avoid `any`.
- **Architecture:** Aim for a modular structure that can grow with the project.

## Workflow
- **Atomic Changes:** Each task/prompt should result in a single, atomic change comparable to a single git commit.
- **Validation:** Always verify changes with tests or manual checks where appropriate.

## Technical Stack
- Language: TypeScript
- Framework: Express.js
- (Upcoming: PostgreSQL, Drizzle ORM, Docker, RabbitMQ)
