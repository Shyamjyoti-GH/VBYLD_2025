# MyBharat Scheme Discovery Platform (VBLYD Hackathon)

This project is a submission for the **VBLYD Hackathon**, addressing the "Civic Technology & Governance" theme. It serves as a foundational module for a larger vision to enhance the **mybharat.gov.in** platform.

## 🎯 Hackathon Problem Statement

**Theme:** Civic Technology & Governance
**Problem Statement:** *Build an app that uses AI or vernacular voice search to help citizens find and apply for government welfare schemes based on their location and profile.*

This application is our initial answer to this challenge. While our current implementation focuses specifically on **government internships**, the underlying architecture and AI-matching logic are designed to be expanded to encompass the full spectrum of government welfare schemes.

## ✨ Key Features

- **Personalized Recommendations:** Uses an algorithm to match users with internships based on their skills, course, location, and preferences.
- **Interactive Onboarding:** An intuitive, multi-step survey wizard to gather user information seamlessly.
- **Dynamic & Modern UI:** A clean, responsive interface built with modern, framework-less web technologies.
- **Editable User Profiles:** Allows users to view and update their profile information, skills, and preferences at any time.
- **AI Match Score View:** Displays recommended internships as informative cards.
- **Real-time Database:** Utilizes Google Firestore for storing and retrieving user and internship data instantly.
- **Dark/Light Mode:** Includes a theme toggler for improved user comfort and accessibility.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Backend:** Google Firebase (Firestore)
- **Styling:** Font Awesome for icons
- **Bundler/Build Tool:** None (Framework-less)

## 🚀 Getting Started

This project is configured to run directly as a static web application.

### Prerequisites

- A modern web browser.
- A Google Firebase account and a new project to host the data.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd <project-directory>
    ```

3.  **Firebase Configuration:**
    - Create a new file at `public/firebase-config.js`.
    - Inside this file, add your Firebase project's configuration details. It should export the initialized Firebase app.

    ```javascript
    // public/firebase-config.js

    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    export const db = getFirestore(app);
    ```

4.  **Run the Application:**
    - Open the `public/index.html` file in your web browser.
    - For the best experience (to avoid CORS issues with local file access), serve the `public` directory using a local web server extension, such as VS Code's "Live Server".

## 📁 Project Structure

```
.
├── public/                 # All client-side application files
│   ├── index.html          # Main HTML entry point
│   ├── style.css           # All application styles
│   ├── main.js             # Core application logic
│   ├── firebase-config.js  # Firebase setup and initialization
│   └── ...
├── blueprint.md            # Project development history and plan
├── firebase.json           # Firebase hosting configuration
├── firestore.rules         # Security rules for the database
├── .gitignore              # Files and folders to be ignored by Git
└── README.md               # This file
```
