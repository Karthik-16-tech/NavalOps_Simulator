# Naval Insight Suite

A comprehensive web-based platform for visualizing, analyzing, and exploring naval ship systems with augmented reality (AR) and virtual reality (VR) capabilities. This project provides detailed insights into ship architecture, weapon systems, component analysis, and 3D model visualization.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Build & Deployment](#build--deployment)
- [Testing](#testing)
- [Key Components](#key-components)
- [Blender Integration](#blender-integration)

## ✨ Features

- **Ship Explorer**: Interactive 3D visualization of the INS Vikrant with part-based assembly/disassembly capabilities
- **Augmented Reality (AR)**: Experience naval vessels and systems in real-world environments
- **Virtual Reality (VR)**: Immersive VR visualization and exploration
- **Weapons Systems**: Detailed analysis and visualization of naval weapon systems
- **Component Analysis**: Comprehensive breakdown and analysis of ship components
- **3D Model Viewer**: Full-featured VR viewer for 3D ship models
- **Responsive UI**: Modern, accessible interface built with shadcn/ui components
- **Reference Images**: Blueprint-accurate reference materials loaded from organized asset directories

## 🛠️ Tech Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **3D Graphics**: Three.js with @react-three/fiber
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack React Query
- **Testing**: Vitest with Playwright
- **Linting**: ESLint
- **3D Modeling**: Blender for asset generation

## 📁 Project Structure

```
naval-insight-suite/
├── src/
│   ├── components/
│   │   ├── AppLayout.tsx          # Main application layout wrapper
│   │   ├── FloatingNavbar.tsx      # Navigation bar component
│   │   ├── NavItem.tsx            # Navigation item component
│   │   ├── NavLink.tsx            # Navigation link component
│   │   ├── SimulationLayout.tsx    # Layout for simulation/AR/VR views
│   │   └── ui/                    # shadcn UI component library
│   ├── pages/
│   │   ├── Home.tsx               # Landing page
│   │   ├── Index.tsx              # Index/dashboard page
│   │   ├── ShipExplorer.tsx        # 3D ship exploration & visualization
│   │   ├── AugmentedReality.tsx    # AR experience
│   │   ├── ARVRReality.tsx         # Combined AR/VR features
│   │   ├── WeaponsSystems.tsx      # Weapon systems analysis
│   │   ├── ComponentAnalysis.tsx   # Component breakdown & analysis
│   │   └── NotFound.tsx           # 404 error page
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   └── use-toast.ts           # Toast notification hook
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   ├── test/
│   │   ├── example.test.ts        # Example test cases
│   │   └── setup.ts               # Test configuration
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # React entry point
│   └── vite-env.d.ts              # Vite environment types
├── public/
│   ├── ins/                        # INS Vikrant reference images
│   ├── compo/                      # Component reference images
│   ├── videos/                     # Video assets
│   ├── vr-viewer.html             # Standalone VR viewer
│   └── robots.txt                 # SEO configuration
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── eslint.config.js               # ESLint configuration
├── playwright.config.ts           # Playwright test configuration
├── playwright-fixture.ts          # Playwright test fixtures
├── components.json                # shadcn components manifest
├── package.json                   # Project dependencies
└── bun.lockb                       # Dependency lock file (Bun)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- npm/pnpm/yarn/bun package manager
- (Optional) Blender 4.0+ for 3D model generation

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/naval-insight-suite.git
   cd naval-insight-suite
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or with bun
   bun install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # Server runs at http://localhost:5173
   ```

4. **View in browser**
   Open [http://localhost:5173](http://localhost:5173) to see the application

### Configuration Files

- **vite.config.ts**: Vite bundler setup with React plugin
- **tsconfig.json**: TypeScript compiler options
- **tailwind.config.ts**: Tailwind CSS theme and plugin configuration
- **postcss.config.js**: CSS processing pipeline

## 🔨 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
# or with development sourcemaps
npm run build:dev
```

### Preview Production Build
```bash
npm run preview
```

The built files are output to the `dist/` directory and ready for deployment to any static hosting platform (Vercel, Netlify, GitHub Pages, etc.).

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Watch Mode Testing
```bash
npm run test:watch
```

### Linting
```bash
npm run lint
```

Test files are located in `src/test/` and use Vitest as the test runner with Playwright for e2e testing.

## 🔧 Key Components

### AppLayout
Main wrapper component that provides the application shell with navigation and responsive layout management.

### SimulationLayout
Specialized layout for simulation, AR, and VR experiences with optimized viewport handling.

### FloatingNavbar & Navigation
Responsive navigation system with mobile support and context-aware menu items.

### UI Library
Comprehensive collection of 50+ shadcn/ui components providing:
- Form inputs and controls
- Dialogs and modals
- Data display (tables, lists, carousels)
- Notifications (toasts, alerts)
- Navigation patterns
- And many more...

## 🎨 3D & Blender Integration

### Blender Assets

- **INS_Vikrant_Blender_Generator.py**: Python script for generating INS Vikrant 3D models in Blender
- **Reference Materials**: [BLENDER_SETUP_GUIDE.md](BLENDER_SETUP_GUIDE.md) and [README_BLENDER_MODEL.md](README_BLENDER_MODEL.md)

### Asset Organization

- **Reference Images**: `public/ins/` - Blueprint-accurate images of INS Vikrant
- **Component Images**: `public/compo/` - Individual component visualizations
- **Videos**: `public/videos/` - Promotional and educational videos
- **3D Models**: Exported from Blender to Three.js compatible formats

### VR Viewer

Standalone VR viewer available at `public/vr-viewer.html` for immersive model exploration.

## 📦 Dependencies Highlights

- **React Three**: @react-three/fiber for 3D graphics integration
- **Form Management**: @hookform/resolvers for form validation
- **UI Primitives**: Complete Radix UI component library
- **State Management**: TanStack React Query for server state
- **Browser Support**: Built-in browser compatibility tracking

## 🌐 Pages Overview

| Page | Purpose |
|------|---------|
| Home | Landing page with project introduction |
| Ship Explorer | 3D visualization with part-based interaction |
| Augmented Reality | AR experience for naval systems |
| AR/VR Reality | Combined immersive experience |
| Weapons Systems | Detailed weapon system analysis |
| Component Analysis | Breakdown of ship components |

## 📝 Environment

- **Node Version**: 18+
- **Package Managers**: npm, pnpm, yarn, or bun supported
- **Browsers**: Modern browsers with ES2020 support

## 🤝 Contributing

When adding new features or components:

1. Use TypeScript for type safety
2. Follow the existing component structure in `src/components/`
3. Add appropriate tests to `src/test/`
4. Ensure code passes ESLint validation
5. Update this README if adding significant features

## 📄 Additional Documentation

- [Blender Setup Guide](BLENDER_SETUP_GUIDE.md)
- [Blender Model README](README_BLENDER_MODEL.md)
- [Blender Quick Start](BLENDER_QUICK_START.txt)

## 🎯 Project Goals

- Provide comprehensive visualization of advanced naval vessels
- Enable immersive AR/VR experiences for ship exploration
- Deliver accurate technical analysis of weapons systems and components
- Create an accessible platform for naval enthusiasts and professionals

---

**Last Updated**: April 2026
