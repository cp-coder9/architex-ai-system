# Architex Axis - Freelancer Project Admin Dashboard

A comprehensive project management dashboard for architectural firms and freelancers, featuring AI-powered compliance checking, real-time collaboration, and Firebase integration.

## Features

- **Multi-Role Dashboard**: Admin, Client, and Freelancer interfaces
- **AI Compliance Agents**: Automated SANS 10400 compliance checking for architectural drawings
- **Project Management**: Track projects, drawings, time entries, and milestones
- **Invoice Management**: Automated invoicing with ZAR currency support
- **Real-time Messaging**: Built-in communication between clients and freelancers
- **Firebase Integration**: Authentication, Firestore database, and file storage
- **Mock Mode**: Works without Firebase for development/testing

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: Zustand with persistence
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Build Tool**: Vite 7
- **Deployment**: Netlify-ready configuration

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase account (optional for mock mode)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd app
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   For mock mode (no Firebase), leave `.env` values empty or use placeholder values.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   - Open http://localhost:5173
   - Use mock credentials to log in:
     - **Admin**: `admin@archflow.com` / `admin123`
     - **Client**: `client@example.com` / `client123`
     - **Freelancer**: `freelancer@example.com` / `freelancer123`

## Firebase Setup (Optional)

To use real Firebase services instead of mock mode:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password provider)
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase config to `.env`:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

For detailed Firebase setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Deployment

### Netlify (Recommended)

1. Connect your repository to Netlify
2. Build settings are pre-configured in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Netlify dashboard
4. Deploy!

For detailed deployment instructions, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md).

### Manual Build

```bash
npm run build
```

The `dist/` folder will contain the production-ready files.

## Project Structure

```
src/
├── agents/           # AI compliance checking agents
├── components/       # React components (UI + feature)
├── config/           # Configuration files (Firebase, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── orchestrator/     # Agent orchestration system
├── screens/          # Main dashboard screens
├── sections/         # Dashboard section components
├── services/         # Firebase services
├── store/            # Zustand state stores
└── types/            # TypeScript type definitions
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser.

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | No (mock mode works without) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | No |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | No |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | No |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | No |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | No |
| `VITE_USE_FIREBASE_EMULATOR` | Enable local emulators | No (dev only) |

## Debug Tools

Access debug utilities at `/debug` route when running in development mode:
- Firebase connection status
- Test data seeding/clearing
- Connection diagnostics

## Mock Mode

The application includes a comprehensive mock mode that simulates all Firebase functionality:
- Mock authentication with pre-defined users
- Mock data stores for projects, invoices, drawings
- Simulated real-time updates
- Works entirely in the browser without external services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[MIT License](./LICENSE)

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Note**: This project uses ZAR (South African Rand) as the default currency throughout the application.
