# Prompt for Claude Code

Copy everything below the line into Claude Code, run from inside this folder.

---

Build me a personal progress-tracker web app for my plan to apply for an English-taught AI/CS master's in Italy (September 2027 intake), get my IELTS, and get my driving licence in Algeria before I leave.

Read these files first, in this order:
1. `SPEC.md` – what the app must do (features, data model, behaviour, design constraints).
2. `context/background.md` – why the plan looks the way it does (rules, risks, money). Use it for tooltips/notes, not as UI copy to paste everywhere.
3. Everything in `data/` – the seed data. Do not invent tasks or dates; load these files. Dates marked `"estimated": true` must be shown as estimates.
4. `templates/` – text I copy and send (emails). Show them with a copy button.

Tech: Vite + React + TypeScript, no backend. Persist all my progress in localStorage, with JSON export/import so I never lose it. Make it a PWA so I can install it on my phone and use it offline.

Seed data rule: on first load, import the JSON in `data/`. Store my changes (checked tasks, notes, edited dates, logged hours, scores) separately from the seed, keyed by item `id`, so that if I update the seed files later, my progress is kept.

Before writing code, propose a short design plan (palette, type, layout) and show it to me. Then build it, run it, and check it on a phone-sized viewport. Finish by telling me how to run it and how to deploy it free (GitHub Pages or similar).
