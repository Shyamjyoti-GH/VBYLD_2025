# Blueprint: PM Internship Recommendation App

## Overview

This document outlines the architecture, features, and development plan for the PM Internship Recommendation application. The goal is to create a user-friendly platform for students to find and get recommendations for PM-related government internships. The application leverages a modern, framework-less frontend and a Firebase backend for data storage.

## Project History

### v1: Core Application

This version established the main user interface and experience.

*   **Frontend:** Built with modern, framework-less HTML, CSS, and vanilla JavaScript (`main.js`).
*   **Backend:** Integrated with Firebase (Firestore) for data storage and user authentication.
*   **UI/UX:**
    *   A professional and welcoming interface that includes a multi-step survey modal to onboard users and collect their preferences.
    *   A dynamic main content view with a sidebar for navigation.
    *   Editable user profile section (name, age, study, etc.).
    *   Views for managing user skills, language, and location.
    *   An "AI Match Score" view to display recommended internship cards.
    *   A functional search bar and theme toggle (Dark/Light mode).
    *   A dedicated "About Us" section.

### v2: Data and Content Expansion

*   **Backend Data:** 
    *   Added four new, diverse internships to the Firestore database using a temporary Node.js script with the Firebase Admin SDK.
    *   The new internships cover skills in Web Dev, UI/UX, App Dev, and Graphic Design, with locations in Karnataka, Maharashtra, Telangana, and Rajasthan.
    *   Managed security rules by temporarily enabling writes and restoring them to a secure, read-only state after the update.
*   **Content Update:**
    *   Updated the content of the "About Us" section in `public/index.html` to better reflect the project's mission, vision, and origins as part of the VBLYD 2025 submission.

## Current Plan

*   **Objective:** No active plan. The system is stable and awaiting the next user request.
*   **Last Action:** Successfully updated the "About Us" content and logged the changes in this blueprint.
