# Run Grave Digger on your own computer

This guide gets the app running on your machine, step by step. It is written for Windows PowerShell, but the commands also work in a Mac or Linux terminal (except where noted).

You do not need any API keys to run the app. Keys are optional extras (see step 4).

Branch: these steps use the `feature/github-auth` branch, which has the GitHub sign-in work.

---

## 1. Check you have the tools

You need:

- **Node.js 20 or newer**, which comes with **npm**. Download the "LTS" version from [nodejs.org](https://nodejs.org).
- **Git**. Download it from [git-scm.com](https://git-scm.com).

Open PowerShell and check both are installed:

```powershell
node -v
npm -v
git --version
```

`node -v` should print `v20` or higher (for example `v22.11.0`). If any command says "not recognized", install that tool, then close and reopen PowerShell.

---

## 2. Get the code

Pick a normal folder for your projects, for example `Documents\Code`. Do not clone straight into your home folder (`C:\Users\<you>`), because that causes confusing errors later.

```powershell
mkdir $HOME\Documents\Code -Force
cd $HOME\Documents\Code
git clone https://github.com/GitShard1/Hack-O-Treat.git
cd Hack-O-Treat
git fetch
git switch feature/github-auth
npm install
```

`npm install` downloads the project's libraries into a `node_modules` folder. It takes a minute or two the first time.

**Already cloned it before?** Go into the folder and update instead:

```powershell
cd $HOME\Documents\Code\Hack-O-Treat
git fetch
git switch feature/github-auth
git pull
npm install
```

Run `npm install` again any time you `git pull` and someone has added a library.

Every command from here on must be run **inside the `Hack-O-Treat` folder**.

---

## 3. Run it (no keys needed)

```powershell
npm run dev
```

Wait until it prints `Ready`, then open http://localhost:3000 in your browser.

Things to try:

- **Summon a public repo:** paste `https://github.com/vercel/ms` (or click one of the example repos) and press **Dig**.
- **See a saved example:** click **See a saved example** to see the full result screen instantly.
- **Monster lab:** open http://localhost:3000/lab to see every monster type and two real repos drawn side by side. This page is for working on the art and is not linked from the app.

**Placeholder text is expected.** Without an Anthropic key, the monster's look (shape, eyes, colours) and the repo facts are real, but the name, trait text and story are placeholders: the name is "Placeholder Monster", traits say "This is a placeholder." and the story is Lorem ipsum filler. The card shows a "Placeholder monster" badge. Nothing is broken.

To stop the app, click in the PowerShell window and press `Ctrl+C`.

---

## 4. Optional: add keys

Keys go in a file called `.env.local` in the project folder. Create it from the example file:

```powershell
Copy-Item .env.example .env.local
```

(On Mac or Linux: `cp .env.example .env.local`.)

Open `.env.local` in any text editor (for example `notepad .env.local`) and fill in only what you have. Everything can stay blank.

| Variable | What it does |
|---|---|
| `GITHUB_TOKEN` | A read-only GitHub token. Raises the GitHub limit from 60 to 5,000 calls per hour. Each summon uses about 6 calls, so without it you get roughly 10 summons per hour. |
| `ANTHROPIC_API_KEY` | Lets Claude write the monster's name, traits and story instead of the placeholder text. It needs API credits from [console.anthropic.com](https://console.anthropic.com); a Claude.ai subscription does not work here. If the call fails, the app falls back to the placeholder monster. |
| `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_SLUG`, `SESSION_SECRET`, `APP_URL` | "Sign in with GitHub" for private repos. Setup steps are in the README section [GitHub sign-in (private repos)](../README.md#github-sign-in-private-repos). Ask the teammate who manages the GitHub App for these values. |

**After editing `.env.local`, restart the app:** press `Ctrl+C`, then run `npm run dev` again. The app only reads the file when it starts.

Key safety:

- `.env.local` is ignored by git, so it will not be committed. Never rename it, never commit it, and never put keys in code.
- **Never paste keys in chat** (Discord, Slack, Claude, GitHub issues). If you shared one by accident, tell the team so it can be replaced.

---

## 5. Check everything works

These run without any keys:

| Command | What it does |
|---|---|
| `npm test` | Runs the tests. You should see **51 passed**. |
| `npx tsc --noEmit` | Checks the TypeScript types. No output means no problems. |
| `npm run lint` | Checks code style. |
| `npm run build` | Builds the production version. Run this before pushing to catch errors. |
| `npm start` | Runs the production build at http://localhost:3000. Run `npm run build` first. |

Stop `npm run dev` before running `npm start`, since both use port 3000.

---

## 6. Troubleshooting

**`npm install` says `ENOENT` ... `package.json`**
You are not in the project folder. Run `cd $HOME\Documents\Code\Hack-O-Treat` (or wherever you cloned it), check that `ls` shows `package.json`, then run the command again.

**A `package-lock.json` file appeared in your home folder (`C:\Users\<you>`)**
This happens if `npm install` was run outside the project. That stray file is safe to delete. The project's config already pins its own folder, so it will not confuse the app, but deleting it keeps things tidy:

```powershell
Remove-Item $HOME\package-lock.json
```

Only delete the one in your home folder, not the one inside `Hack-O-Treat`.

**"Port 3000 is in use"**
Something else (often another copy of the app) is using port 3000. Close the other PowerShell window running it, or start on a different port:

```powershell
npm run dev -- -p 3001
```

Then open http://localhost:3001. Note: GitHub sign-in only works on the port it was set up for. If you change the port, `APP_URL` in `.env.local` and the GitHub App's callback URL must use the same port (for example `http://localhost:3001` and `http://localhost:3001/api/auth/github/callback`). Public repos work on any port.

**"GitHub is rate limiting us right now"**
You used up the 60 GitHub calls per hour allowed without a token. Wait a while (the limit resets every hour), or add a `GITHUB_TOKEN` to `.env.local` (step 4) and restart the app.

**No "Sign in with GitHub" button, or "GitHub sign-in isn't set up on this server yet"**
The GitHub App variables are not set in `.env.local` (or `SESSION_SECRET` is shorter than 32 characters). That is fine: public repos work without sign-in. You only need sign-in for private repos.

**"Couldn't find owner/repo" for a private repo**
Private repos need sign-in. Click **Sign in with GitHub**, then use **Choose repos** to allow Grave Digger to read that repo. A private repo you did not pick shows as "not found". For a public repo, check the URL is spelled correctly.

**Changes to `.env.local` do nothing**
Restart the app (`Ctrl+C`, then `npm run dev`).

**Still stuck?**
Copy the error message (not your keys) and share it with the team.
