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

The primary goal of this project is to showcase high-quality software engineering practices in a Node.js environment. By adhering to strict standards like DRY, explicit typing, and modular design, this API serves as both a functional tool and a blueprint for building maintainable, production-ready backend systems.

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

- **Auth**: `/auth` - Handles user registration, login, and token management.
- **Health**: `/health` - System status and health checks.
- **Users**: `/users` - User profile and management.
- **Projects**: `/projects` - Management of projects and associated assets.

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
