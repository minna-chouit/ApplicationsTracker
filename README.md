# Italy plan tracker

Personal tracker for the Algiers → Italy plan (Sept 2027): tasks, habits, deadlines, documents, universities, IELTS, driving.
Vite + React + TypeScript, no backend, installable PWA that works offline.

## Run
```
npm install
npm run dev        # http://localhost:5173
npm test           # date/streak/merge logic
npm run build      # production build in dist/
npm run preview    # serve dist/ (use this to test offline/install)
```

## Your data
- The plan lives in `data/*.json` and is built into the app. Edit a file, rebuild/redeploy, and new items appear.
- Your progress (ticks, notes, edited dates, scores, lessons) is stored in this browser's localStorage under `italyTracker.v1`, keyed by item id, so it survives plan updates.
- It does not sync between phone and laptop. Use Settings → Export / Import to move it or back it up.

## Deploy free (GitHub Pages)
1. Create a GitHub repo and push this folder to `main`.
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes on every push.
4. Open `https://<user>.github.io/<repo>/` on your phone → browser menu → "Add to home screen" / "Install app".

Other files: `SPEC.md` (requirements), `context/background.md` (research), `templates/` (emails, shown in the app), `scripts/icons.mjs` (regenerates app icons).
