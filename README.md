# Oncade Game Template

This repository provides a comprehensive starting point for creating games with the Oncade framework. It includes a modern tech stack with TypeScript, best practices for game development, and built-in support for monetization through the Oncade platform.

## Features

- Type-safe game development with TypeScript
- 3D game development with Three.js
- React-based UI for menus and interfaces
- WebSocket-based multiplayer capabilities
- Efficient binary data communication
- Built-in Oncade SDK integration for payments and social features
- Responsive design for both web and mobile
- Organized folder structure for scalable game development
- Persistent user settings with localStorage
- Centralized modern UI with clean styling
- Interactive click/tap effects with visual feedback
- FPS counter for performance monitoring
- Keyboard shortcuts for game controls (ESC to pause)
- Social media sharing with OpenGraph tags

## Tech Stack

- **Backend**: Node.js with Express and TypeScript
- **Frontend**: React with TypeScript
- **3D Engine**: Three.js
- **Physics** (optional): Cannon.js
- **Build System**: Webpack with TypeScript loaders
- **Multiplayer**: WebSockets (ws)
- **Payment**: Oncade SDK
- **State Management**: React hooks with localStorage persistence

## Getting Started

### Prerequisites

- Node.js (>= 16.0.0)
- npm or yarn

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/oncade-game-template.git
   cd oncade-game-template
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your environment variables:
   ```
   PORT=8080
   NODE_ENV=development
   ```

### Development

Start the development server:

```
npm run dev
```

This will start both the backend server and the frontend development server with hot-reloading.

### Type Checking

Run TypeScript type checking:

```
npm run type-check
```

### Building for Production

Build the project for production:

```
npm run build
```

This command will:
1. Build the client-side code with Webpack
2. Compile the server TypeScript code

### Starting the Production Server

Start the production server:

```
npm start
```

## Folder Structure

```
/
├── public/                  # Static assets
│   ├── assets/              # Game assets (images, models, etc.)
│   └── index.html           # HTML template
├── src/                     # Source code
│   ├── components/          # React components (.tsx)
│   ├── scenes/              # Three.js scene components (.tsx)
│   ├── models/              # Game models and data structures (.ts)
│   ├── utils/               # Utility functions (.ts)
│   │   └── constants.ts     # Shared constants and configuration
│   ├── controllers/         # Game controllers (.ts)
│   ├── services/            # Service layer (API, etc.) (.ts)
│   ├── types/               # TypeScript type definitions
│   ├── assets/              # Assets imported in TS
│   ├── App.tsx              # Main React component
│   └── index.tsx            # Entry point
├── server/                  # Backend code
│   └── index.ts             # Express server
├── .env                     # Environment variables (create this)
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore file
├── tsconfig.json            # TypeScript configuration for client
├── tsconfig.server.json     # TypeScript configuration for server
├── package.json             # Dependencies and scripts
├── webpack.config.js        # Webpack configuration
└── README.md                # This file
```

## TypeScript Benefits

- **Type Safety**: Catch errors at compile time rather than runtime
- **Better IDE Support**: Improved autocomplete and IntelliSense
- **Code Navigation**: Jump to type definitions and implementations
- **Self-Documenting Code**: Types serve as documentation
- **Safer Refactoring**: Change code with confidence

## User Interface

The template includes a fully designed UI system with:

- Main menu with navigation to different screens
- Settings menu with persistent user preferences
- Game store for in-app purchases
- Responsive layout that works on all device sizes
- Clean, modern styling with professional aesthetics
- In-game HUD with score, lives, and performance metrics
- FPS counter for monitoring game performance
- Pause menu triggered by button or ESC key
- Quit button with confirmation dialog to prevent accidental exits

## Interactive Features

The template includes several interactive gameplay features:

- Click/tap effects that appear at cursor/touch position
- Object interaction with visual feedback
- Click counter that increments when interacting with 3D objects
- Smooth animations with proper cleanup for memory management
- Keyboard controls for common game actions

## Game Controls

- **ESC key**: Toggle pause menu
- **Click/Tap**: Interact with game objects and create visual effects
- **Pause Button**: Manually pause the game
- **Quit Button**: Exit to main menu (with confirmation)

## Settings Management

The game includes a complete settings management system:

- User preferences stored in localStorage
- Settings for audio, difficulty, and graphics quality
- Centralized constants for easy configuration
- Reset to default functionality
- Settings applied immediately across the game

## Best Practices

### Security

- Always validate authentication and authorization server-side
- Store secrets in `.env` files (never commit these to version control)
- Implement rate limiting to prevent API abuse

### Multiplayer Communication

- Use binary formats for efficient data packing
- Implement delta compression (only send changes)
- Use entity interpolation on the client side for smooth updates

### Cross-Platform Support

- Design UI for both desktop and mobile devices
- Implement responsive controls
- Consider optional gamepad support

## Discord Integration

This template is set up to work with the Oncade Discord app, allowing:

- User authentication via Discord
- Rich presence for social sharing
- Friend invites and multiplayer sessions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Oncade for the SDK and platform
- Three.js team for the 3D library
- React team for the UI library
- TypeScript team for the type system 