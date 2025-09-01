# FAME - Festival Artist Management & Events System

A comprehensive event management platform built with Next.js 14+ and React 18+ that manages multiple user roles including Super Admins, Stage Managers, Artists, and DJs.

## Features

-   **Multi-role User Management**: Super Admins, Stage Managers, Artists, and DJs
-   **Real-time Event Coordination**: WebSocket-based live updates
-   **Artist Registration System**: Event-specific registration with approval workflows
-   **DJ Music Management**: Track uploads, playlists, and performance coordination
-   **File Storage**: Google Cloud Storage integration with secure access
-   **Live Event Management**: Real-time performance tracking and coordination

## Technology Stack

-   **Frontend**: Next.js 14+ with React 18+
-   **Authentication**: Simple session-based auth with GCS data validation
-   **Real-time**: WebSocket connections for live updates
-   **Storage**: Google Cloud Storage (fame-data bucket)
-   **Styling**: Tailwind CSS
-   **Testing**: Jest with React Testing Library

## Getting Started

### Prerequisites

-   Node.js 18+
-   npm or yarn
-   Google Cloud Storage bucket (fame-data)

### Installation

1. Clone the repository
2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    ```bash
    cp .env.local.example .env.local
    ```

    Update the values in `.env.local` with your configuration.

4. Run the development server:

    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run start` - Start production server
-   `npm run lint` - Run ESLint
-   `npm test` - Run tests
-   `npm run test:watch` - Run tests in watch mode
-   `npm run test:coverage` - Run tests with coverage

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components
│   └── forms/          # Form components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

## Environment Variables

See `.env.local` for required environment variables:

-   `NEXT_PUBLIC_BASE_URL` - Application base URL
-   `GOOGLE_CLOUD_PROJECT_ID` - GCP project ID
-   `GOOGLE_CLOUD_PRIVATE_KEY` - GCP service account private key
-   `GOOGLE_CLOUD_CLIENT_EMAIL` - GCP service account email
-   `GCS_BUCKET_NAME` - Google Cloud Storage bucket name
-   `SESSION_SECRET` - Secret key for session management

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

This project is private and proprietary.
