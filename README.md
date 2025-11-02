# Japanese Mahjong Leaderboard

A web-based leaderboard system for tracking Japanese Mahjong game results.

## Features

- Add and manage players
- Record game results with scores and positions (东, 南, 西, 北)
- Automatic leaderboard calculation based on points and rankings
- View game history
- Edit and delete recorded games
- Champion indicator for the top player
- Data persistence using localStorage

## Getting Started

Simply open `index.html` in a web browser. No server or installation required!

## Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g., `mahjong-leaderboard`)
2. Upload all files to the repository:
   ```
   - index.html
   - script.js
   - styles.css
   - README.md
   ```
3. Go to your repository Settings → Pages
4. Under "Source", select the branch (usually `main` or `master`) and folder (usually `/root`)
5. Click Save
6. Your site will be available at `https://[your-username].github.io/[repository-name]`

## Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies)
- Data stored locally in browser's localStorage
- Responsive design that works on mobile and desktop

