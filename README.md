### Features Implemented

-   User authentication with email login
-   Problem submission and verification system
-   Personal statistics tracking
-   Weak topics analysis with graphical representation
-   Custom contest creation
-   Friend system and profile viewing
-   Problem set browsing with sorting capabilities
-   Practice mode for skill improvement
-   Team creation and management with member profiles
-   Codeforces profile comparison with rating graphs

### Hosted Link

[DevBits Platform](https://devbits-iota.vercel.app/)

### Technologies Used

-   React.js (Frontend)
-   Next.js (React framework)
-   Firebase (Authentication and Database)
-   Chart.js (Graphing)
-   CSS Modules (Styling)
-   `uuid` (Unique ID generation)

### Key Components

Based on the project structure visible in the image:

-   `Leaderboard.jsx`: Displays user rankings
-   `ProblemsetPage.jsx`: Shows available coding problems
-   `ProfileCompo.jsx`: User profile component
-   `sidebar.jsx`: Navigation sidebar
-   Custom contest management
-   Friend system implementation
-   Practice mode
-   Teams management
-   Codeforces profile comparison

### Getting Started

1.  Clone the repository
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
4.  Add your firebase's environment variables to the .env.local file
5.  Open \[http://localhost:3000](http://localhost:3000) in your browser

### How It Works

1.  Users log in with their email ID
2.  To verify their account, users must submit an incorrect answer to a given problem
3.  Once verified, users can:
    *   Check their statistics
    *   View graphs of their weak topics
    *   Practice coding problems
    *   Create custom contests
    *   Add friends and view their profiles
    *   Browse and sort the problem set
    *   Create and join teams
    *   Compare Codeforces profiles
