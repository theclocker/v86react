# Active Context

*This file tracks the current focus, recent changes, and immediate next steps.*

## Current Focus

*Project Analysis and Documentation Update: Analyzing the existing `v86react` codebase to populate the Memory Bank and refine `.clinerules`.*

## Recent Changes

*   Analyzed `package.json`, `tsconfig.json`, `src/` structure, and `src/index.ts`.
*   Updated `.clinerules` with specific project details (language, dependencies, testing approach, project-specific rules).
*   Updated `projectbrief.md` with project name and high-level goal.
*   Updated `productContext.md` with inferred problem statement, target audience, and key features.

## Next Steps

*   Continue the Memory Bank update by reviewing and updating `systemPatterns.md`, `techContext.md`, and `progress.md` based on the project analysis.
*   Complete the documentation update task.

## Active Decisions & Considerations

*(Record any ongoing discussions, decisions made, or important points to keep in mind for the current work.)*

## Important Patterns & Preferences

*   The `.clinerules` file has been updated with specifics: TypeScript, Yarn 4.6.0, Storybook for testing, local `v86` dependency, Web Worker usage, Zstandard decompression, strict TS config.
*   React components (`.tsx`), custom hooks (`use*.ts`), and web workers (`.worker.ts`) are key structural elements.

## Learnings & Insights

*   The project structure centers around providing React wrappers (`V86`, `V86WithWorker`) for the v86 emulator.
*   Key technical aspects include managing the v86 instance (potentially via hooks), handling web worker communication, and integrating Zstandard decompression for assets.
*   The `v86` dependency is managed locally (`file:src/v86`), requiring attention during builds or updates.

---
*This file is dynamic and should be updated frequently to reflect the current state of development.*
