# Local Plans Reps Analysis POC
This repository contains the Proof of Concept (POC) for Local Plan representations analysis using AI. It brings together all components of the Local Plans Reps Analysis POC, including the application code and the supporting infrastructure‑as‑code.


The project utilizes the following tools to ensure code quality and consistency:
- **Linting & Formatting:** ESlint, Prettier
- **Commit Standards:** Commitlint, Husky
- **Infrastructure:** Docker
- **Database ORM:** Prisma

# Setup

## Prerequisites

Before starting, ensure you have the following installed:
* **Node.js** (Latest LTS version)
* **Docker** (Desktop or Engine)

## Installation

1.  Clone the repository.
2.  Install dependencies from the root directory:
    * run `npm i`
    
## Configuration

You need to configure environment variables for both the database and the application.

1.  **Database:** Copy `packages/database/.env.example` to create `.env`.
2.  **Application:** Copy `apps/manage/.env.example` to create `.env`.
3.  **Authentication:**
    * Obtain the `AUTH_*` environment variables from a team member and add them to `apps/manage/.env`.
    * *Alternatively:* Set `AUTH_DISABLED=false` in the file.

## Database

The database runs inside a Docker container and is managed via Prisma.

1. Start the database container from the project root:
    * run `docker compose up`

2. Once the container is running, initialize the database schema:
    * run `npm run db-migrate-dev`

## Running the Application

To start the application:

* run `apps/manage>npm run dev`

# WebStorm Run Configurations

Run configurations are included for most of the npm scripts. To use them, ensure WebStorm is configured correctly:

1.  Go to **Settings** > **Languages and Frameworks** > **Node.js**.
2.  Set the **Node interpreter** and **Package manager** fields to your local installations.

# Licensing

[MIT](https://opensource.org/licenses/mit) © Planning Inspectorate