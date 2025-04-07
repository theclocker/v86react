# Technical Context

*This file details the technologies, setup, constraints, and dependencies of the project.*

## Core Technologies

*   Language(s): TypeScript (`strict: true` enabled, see `.clinerules`)
*   Framework(s): React 19
*   Key Libraries:
    *   `v86` (Emulator core, managed locally via `file:src/v86`)
    *   `@bokuweb/zstd-wasm` (Zstandard decompression)
*   Runtime Environment(s): Web Browsers (supporting Web Workers and WASM)
*   Database(s): N/A

## Development Environment Setup

*   Required Software: Node.js, Yarn (v4.6.0, see `.clinerules`)
*   Build Tools: `typescript` (`tsc`), `vite` (via Storybook)
*   Setup Steps:
    1.  Clone the repository.
    2.  Run `yarn install` to install dependencies.
    3.  (Potentially) Build local `v86` assets if needed (see `full-build` script in `package.json`).
    4.  Use `yarn build` to compile the library.
    5.  Use `yarn storybook` to run the Storybook development server.

## Technical Constraints

*(List any limitations or constraints impacting development, e.g., performance requirements, browser compatibility, hardware limitations.)*

## Key Dependencies

*   **`v86` library:** Core emulator logic. Managed as a local file dependency (`file:src/v86`), which is critical to understand for builds and updates.
*   **`@bokuweb/zstd-wasm`:** Required for decompressing assets (e.g., disk images) provided in Zstandard format.
*   **React:** Peer dependency for the consuming application.

## Tool Usage Patterns

*   Version Control: *(Strategy TBD, see `.clinerules`)*
*   Testing: Storybook for component development and visualization. *(See `.clinerules`)*
*   Linting/Formatting: Assumed Prettier/ESLint defaults via TypeScript/React ecosystem. *(See `.clinerules`)*
*   Dependency Management: Yarn v4.6.0. *(See `.clinerules`)*
*   Build System: `tsc` for library build, `storybook build` for Storybook static build.
*   CI/CD: Not specified.

---
*This context is crucial for onboarding new developers and ensuring consistent technical practices.*
