# Node Asset Management API

A robust, scalable asset management system built with TypeScript and Express.js, emphasizing clean code, DRY principles, and a modular layered architecture.

## Description

The Node Asset Management API is a backend solution designed to manage organizational assets and projects efficiently. It leverages a modern technical stack to ensure performance, type safety, and maintainability. Key features include:

- **Secure Authentication**: JWT-based access and refresh tokens with revocation support.
- **Type-Safe Database Access**: Powered by Drizzle ORM and PostgreSQL.
- **Layered Architecture**: Clear separation of concerns between controllers, services, and database layers.
- **Comprehensive Testing**: Built with a Test-Driven Development (TDD) approach using Vitest.
- **Containerized Environment**: Easy setup and deployment using Docker and Docker Compose.

## Motivation

The development of this project was driven by two key motivations. First, I wanted to recreate a similar asset management system I worked on at my previous job; however, since that code is company property, I could not reuse it. Rebuilding it from scratch provided an excellent opportunity to refine the implementation based on what I learned.

Second, I recently completed a comprehensive backend development course, and this project serves as a practical application of the concepts I learned. It allows me to demonstrate my skills in designing maintainable, production-ready backend systems, adhering to principles like DRY, explicit typing, and modular architecture.

## Quick Start

### Prerequisites

- Node.js (v22+)
- Docker and Docker Compose

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dimitarpapalazov/node-asset.git
   cd node-asset
   ```

2. **Environment Configuration**:
   Copy the example environment file and fill in your secrets and configurations:
   ```bash
   cp .env.example .env
   ```

3. **Start the Infrastructure**:
   Launch the database and application using Docker:
   ```bash
   npm run docker-up
   ```

4. **Run Database Migrations**:
   Ensure the database schema is up to date:
   ```bash
   npm run drizzle-migrate
   ```

## Usage

The API provides the following core endpoints:

### Auth (`/auth`)
- `POST /register` - Register a new user.
- `POST /login` - Login to obtain access and refresh tokens.
- `POST /refresh` - Refresh access token.
- `POST /logout` - Logout (requires authentication).

### Health (`/health`)
- `GET /` - Check system health status.

### Users (`/users`)
- `GET /:id` - Get user profile (requires authentication).
- `DELETE /:id` - Delete user account (requires authentication).

### Projects (`/projects`)
- `POST /` - Create a project (requires authentication).
- `GET /` - List user projects (requires authentication).
- `GET /:id` - Get project details (requires authentication).
- `PUT /:id` - Update project name (requires authentication).
- `DELETE /:id` - Delete project and clean up associated assets (requires authentication).
- `GET /:id/export` - Export project assets as a zip file (requires authentication).

### Assets (`/assets`)
- `POST /` - Upload an asset (requires authentication).
- `GET /project/:projectId` - List assets by project (requires authentication).
- `GET /:id` - Get asset details (requires authentication).
- `GET /:id/versions` - List asset versions (requires authentication).
- `POST /:assetId/versions/:versionId/manipulate` - Manipulate an asset version (requires authentication).
- `DELETE /:id` - Delete an asset (requires authentication).

For local development without Docker, you can run:
```bash
npm install
npm run build
npm run local-start
```

## Contributing

Contributions are welcome! To maintain the project's high standards, please follow these guidelines:

1. **TDD First**: Every new feature or bug fix must include corresponding tests using Vitest.
2. **Clean Code**: Follow the established naming conventions and layered architecture.
3. **Strict Typing**: Avoid the use of `any`; ensure all interfaces and types are explicitly defined.
4. **Formatting**: Use 4-space indentation and maintain clear separation between top-level code structures.

Before submitting a Pull Request, ensure all tests pass:
```bash
npm test
```
