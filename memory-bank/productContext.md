# Product Context

*This file explains the "why" behind the project.*

## Problem Statement

*Integrating the v86 emulator directly into React applications requires significant boilerplate code for setup, state management, communication (especially with web workers), and handling emulator events. This project aims to simplify this integration.*

## Target Audience

*React developers who need to embed x86 virtualization capabilities (running legacy software, operating systems, specific applications) within their web applications.*

## Desired User Experience

*(How should users interact with the product? What should the experience feel like?)*

## Key Features & Functionality (from User Perspective)

*   **Simple Integration:** Provides a declarative React component (`<V86>`) to easily embed the emulator.
*   **Abstraction:** Hides the complexity of initializing and managing the v86 instance.
*   **Worker Support:** Offers an option (likely `v86WithWorker.tsx`) to run the emulator in a web worker for better performance, abstracting the communication logic.
*   **(Potential) Configuration:** Allows passing configuration options (like BIOS, disk images) to the emulator via component props.

---
*Understanding the product context helps ensure the technical implementation aligns with user needs and business goals.*
