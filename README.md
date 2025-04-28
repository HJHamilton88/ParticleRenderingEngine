# Particle Rendering Engine

A web-based 3D particle rendering engine built with React, Three.js, and Vite. Allows loading various 3D models and visualizing them as configurable particle systems with different materials and effects.

## Features

*   Load PLY, OBJ, and FBX 3D models.
*   Render models as particle systems using Three.js `InstancedMesh`.
*   Adjust particle density and size.
*   Control camera using OrbitControls.
*   Enable/disable model orbiting and adjust speed.
*   Multiple material types: Basic, Phong, Standard (PBR), Toon.
*   Customize base color, emissive color, metalness, and roughness.
*   Apply effects like pulsing.
*   Switch between 'Edit' mode (with controls) and 'Showcase' mode.

## Technologies Used

*   React
*   Vite
*   Three.js
*   @react-three/fiber
*   @react-three/drei
*   Tailwind CSS

## Setup and Installation

1.  **Prerequisites:** Node.js and npm (or yarn) installed.
2.  Clone the repository: `git clone https://github.com/HJHamilton88/ParticleRenderingEngine`
3.  Navigate to the project directory: `cd ParticleRenderingEngine`
4.  Install dependencies: `npm install`
5.  Run the development server: `npm run dev`
6.  Open your browser to `http://localhost:5173`

## Usage

*   Use the "Load 3D Model" button to upload a `.ply`, `.obj`, or `.fbx` file.
*   In 'Edit' mode, use the sliders and controls to adjust the particle appearance, materials, and effects.
*   Use the mouse to rotate and zoom the view.
*   Toggle 'Start/Stop Orbit' to rotate the model automatically.
*   Switch to 'Showcase' mode for a view without the editing controls.