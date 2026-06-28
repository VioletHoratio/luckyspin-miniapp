# LuckySpin

LuckySpin is a Base Mini App for fast onchain lottery spins with a transparent reveal experience and a visible jackpot pool flow.

The project is built as a modern web application using Next.js, TypeScript, Tailwind CSS, and the Ethereum tooling stack provided by wagmi and viem.

## Repository

GitHub: https://github.com/VioletHoratio/luckyspin-miniapp.git

## Overview

LuckySpin provides a lightweight interface for running lottery-style spin interactions on Base.

The app focuses on a simple user experience:

- Open the mini app
- Connect through the supported onchain flow
- Start a spin
- View the reveal
- Follow the jackpot pool movement

The README is intended to help contributors install, run, and understand the project locally.

## Features

- Base Mini App experience
- Rapid lottery-style spin interface
- Transparent reveal flow
- Jackpot pool presentation
- Next.js App Router foundation
- Type-safe development with TypeScript
- Styling with Tailwind CSS
- Onchain interaction tooling through wagmi and viem
- Icon support through lucide-react
- Motion and interaction polish through framer-motion

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- wagmi
- viem
- lucide-react
- framer-motion

## Requirements

Before running the project, make sure you have the following installed:

- Node.js
- npm

Use a current Node.js version that is compatible with Next.js 14.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/VioletHoratio/luckyspin-miniapp.git
```

Move into the project directory:

```bash
cd luckyspin-miniapp
```

Install dependencies:

```bash
npm install
```

## Environment Setup

The project includes an example environment file.

If you want to override the public builder configuration locally, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` as needed for your local setup.

If no overrides are required, you can start by using the default configuration included with the project.

## Development

Start the local development server:

```bash
npm run dev
```

After the server starts, open the local URL shown in your terminal.

For most Next.js projects, this is commonly:

```text
http://localhost:3000
```

## Build

Create a production build:

```bash
npm run build
```

This checks and compiles the application for production use.

## Start

Run the production build locally:

```bash
npm run start
```

Make sure you have already created a production build before running this command.

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Builds the application for production.

```bash
npm run start
```

Starts the built production application.

## Project Structure

The exact structure may evolve over time, but the project is organized around a standard Next.js application layout.

Common areas may include:

- Application routes and pages
- Reusable UI components
- Styling configuration
- Onchain configuration
- Utility functions
- Public assets

## Styling

LuckySpin uses Tailwind CSS for styling.

Tailwind utility classes make it easier to build and adjust the interface directly in components while keeping the design consistent.

## Onchain Tooling

The app uses wagmi and viem for onchain connectivity and interaction support.

These libraries provide the foundation for working with Base-compatible flows in a type-safe TypeScript environment.

## UI and Interaction

The interface uses lucide-react for icons and framer-motion for motion effects.

These libraries help keep the experience clear, responsive, and polished without adding unnecessary complexity.

## Configuration Notes

Local configuration should be placed in `.env.local`.

Do not commit local environment files that contain machine-specific or private configuration.

Use `.env.example` as the reference for supported environment values.

## Deployment Notes

This is a Next.js project, so it can be deployed using platforms that support Next.js applications.

Before deployment, run:

```bash
npm run build
```

Review any required environment settings for the deployment target before publishing.

## Contributing

Contributions should keep the project focused on the LuckySpin Mini App experience.

When making changes:
