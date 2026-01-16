# Copilot Instructions for Votacions

## Project Overview
**Votacions** is a static web app for collaborative photo rating (1–5 stars) with restricted user access. It uses **GitHub Pages** for hosting, **Firebase** for authentication and data storage, and implements **deterministic shuffling** per user to ensure a consistent, randomized photo order.

## Architecture

### Frontend Stack
- **Single-page HTML5 app** (`index.html`): Self-contained; all JavaScript is inline using dynamic imports
- **Styling**: CSS variables for theming (dark mode: `--bg`, `--card`, `--text`, `--accent`)
- **Firebase SDK v10.7.1**: Loaded dynamically from CDN (no build step required)

### Data Flow
1. User logs in → Firebase Authentication validates credentials
2. `images.json` fetches → shuffle deterministically per user (seeded by email hash)
3. Ratings stored in two places:
   - **Firestore**: `/users/{uid}/ratings_data/current` (cloud persistence)
   - **localStorage**: Fallback when offline
4. On logout, Firestore persists all unsaved ratings

### Key Firebase Collections
- **Authentication**: Email/Password only (no signup UI)
- **Firestore `/images/{imageId}`**: Read-only documents, auto-created by each image ID
- **Firestore `/users/{uid}/ratings_data/current`**: Stores `{ ratings, lastIndex, lastUpdated }`

## Critical Patterns

### Deterministic Shuffling (Stable Per User)
```javascript
// Email → hash → seed → shuffle is consistent across sessions
const seed = hashString(currentUser.email);
list = shuffleDeterministic(list, seed);
```
**Why**: Ensures each user always sees photos in the same random order. Uses Mulberry32 PRNG for reproducibility.

### Dual Persistence Strategy
- **Firestore first**: Primary source of truth for ratings
- **localStorage fallback**: Used if Firestore unavailable or during offline mode
- **Resume mechanism**: `lastIndex` stored in Firestore to resume where user left off

### Image Manifest Generation
Run **before** deploying: `python generate_images_manifest.py`
- Scans `./images/` directory for `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- Generates `images.json` with: `{ id, url, titulo }`
- Uses filename (without extension) as the image ID

### Hidden Statistics
- Average rating and vote count are **never shown** in UI
- Images document structure allows future analytics without exposing UI

## Development Workflow

### Setup
1. Copy photos to `./images/` directory
2. Run `python generate_images_manifest.py` (generates `images.json`)
3. Create Firebase project → enable Email/Password auth
4. Add users manually in Firebase Console (no public signup)
5. Copy `firebaseConfig` from Firebase Console → paste into `index.html` (line ~60)
6. Paste Firestore rules from [firestore.rules.txt](../firestore.rules.txt)
7. Add GitHub Pages domain to Firebase "Authorized domains" list
8. Push to GitHub → enable Pages in repo Settings

### Local Testing
- Open `index.html` in browser (or `python -m http.server`)
- Use test Firebase credentials
- Ratings save to both localStorage and Firestore

### Firestore Rules
Located in [firestore.rules.txt](../firestore.rules.txt):
- Users can only write their own ratings (via auth UID)
- Stars must be 1–5 (validated server-side)
- Public read access to image metadata (no stats exposed)

## File Structure
```
votacions/
├── index.html              # Single-page app (all code inline)
├── styles.css              # Theme variables + responsive layout
├── images.json             # Generated manifest (regenerate after adding photos)
├── generate_images_manifest.py  # Manifest generator
├── images/                 # Photo directory (add photos here)
├── data/                   # Optional: raw data or exports
├── firestore.rules.txt     # Firebase security rules
└── .github/copilot-instructions.md  # This file
```

## Common Tasks

### Add New Photos
1. Copy `.jpg`/`.png` files to `./images/`
2. Run `python generate_images_manifest.py`
3. Commit & push `images.json`

### Modify UI Colors
Edit CSS variables in `styles.css` `:root`:
```css
--bg: #0f172a;      /* Background */
--card: #111827;    /* Login card */
--accent: #22c55e;  /* Highlight (green) */
--error: #ef4444;   /* Error text */
```

### Debug Ratings
- Check `localStorage['votacions_ratings']` in DevTools
- Query Firestore: `/users/{uid}/ratings_data/current`
- Check browser console for import/Firebase errors

### Reset User Progress
Delete `/users/{uid}/ratings_data/current` in Firestore Console

## Notes for AI Agents
- **No build step**: All code is client-side; changes to `index.html` or `styles.css` are live
- **Firebase config is public**: It's embedded in HTML but secured by Firestore rules
- **Keyboard nav**: Arrow keys (← →), Home, End work for navigation
- **Accessibility**: Stars support keyboard (arrow keys + Enter/Space)
- **Email is identifier**: User progress tied to email, not user UID (key: `email_imageId`)
