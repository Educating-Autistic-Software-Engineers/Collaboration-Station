# Collaboration Station

Collaboration Station is a website that helps neurodivergent students collaborate on Scratch coding projects. Students work together on a shared Scratch editor in real time, with video, chat, breakout rooms, and task tracking built in.

This repository holds the static front end (HTML/CSS/JS) and a prebuilt copy of the Scratch GUI. The backend runs on AWS (API Gateway + Lambda + DynamoDB), and its Lambda source is mirrored in [`lambdas/`](lambdas/).

## Architecture

| Piece | Where it lives | What it does |
|---|---|---|
| Front-end pages | `*.html`, `js/`, `styles/` | Login, registration, project list, lobby, collaboration room, coin shop, admin |
| Room features | `js/cogs/` | Breakout rooms, messaging, video, tasks, sidebar |
| Scratch editor | `vm/` | Prebuilt bundle of [CollaborationStationGUI](https://github.com/Educating-Autistic-Software-Engineers/CollaborationStationGUI). Make changes there, rebuild, and copy the output here |
| Real-time sync | [Ably](https://ably.com) | Broadcasts block placements and edits between collaborators. Tokens come from the `ablyToken` endpoint |
| Video | Amazon Chime SDK (`js/chime-sdk.js`, `js/chime.bundle.js`) | Meeting creation and joining through the `create-meeting` / `join-meeting` endpoints |
| Backend API | AWS API Gateway → Lambda (`us-east-2`) | Users and registration, rooms and breakouts, tasks, task chat, messages, block placement |
| Lambda source | `lambdas/` | Synced copy of the deployed functions (see [Syncing Lambda functions](#syncing-lambda-functions)) |

### Pages

- `index.html`: login / home
- `register.html`, `forgot-password.html`, `reset-password.html`: account flows
- `projects.html`: project selection
- `lobby.html`: pre-room lobby
- `room.html`: the collaboration room (Scratch editor + video + chat + tasks)
- `shop.html`: coin shop
- `admin.html`: admin tools

## Getting started

### Prerequisites

- A modern browser
- Node.js and npm (only needed for the `ably` / Agora packages)
- A static file server, such as `npx serve` or VS Code Live Server. Opening the files directly with `file://` breaks fetch calls and module loading.

### Run locally

```bash
git clone https://github.com/Educating-Autistic-Software-Engineers/Collaboration-Station.git
cd Collaboration-Station
npm install
npx serve .
```

Then open the URL it prints (usually `http://localhost:3000`) and go to `index.html`.

### Configuration

- **API endpoints**: most API Gateway URLs are hardcoded in `js/` and `js/cogs/`. The task API base URL is in `js/config.js` (`window.TASKS_API_URL`).
- **Ably**: the client gets its tokens from the `scratchBlock/ablyToken` endpoint, so the Ably API key belongs in that Lambda's environment and never in front-end code.
- **Secrets**: `.env*` files and `js/agora_cloud_recording.js` are gitignored. Never commit API keys.

To run against your own backend, deploy the functions in `lambdas/` and replace the API Gateway URLs.

## Updating the Scratch GUI

The `vm/` directory is build output. Do not edit it by hand.

1. Make your changes in [CollaborationStationGUI](https://github.com/Educating-Autistic-Software-Engineers/CollaborationStationGUI).
2. Build it by following that repo's instructions.
3. Replace the contents of `vm/` with the new build output.

## Syncing Lambda functions

The backend Lambdas are edited and deployed in AWS. To mirror their current code into this repo:

```bash
# one-time setup: AWS CLI v2, jq, unzip
aws configure            # or: export AWS_PROFILE=<profile>

scripts/sync-lambdas.sh              # every function in us-east-2
scripts/sync-lambdas.sh scratch      # only functions whose name contains "scratch"
AWS_REGION=us-east-1 scripts/sync-lambdas.sh
```

Each function is saved to `lambdas/<function-name>/`:

- `src/`: the deployed code package
- `config.json`: runtime, handler, memory, timeout, role, and layers. It also lists the **names** of the function's environment variables, but not their values.

Review `git diff lambdas/` before committing, and look for hardcoded keys in particular.

## Project documents

- `User Requirements Document (URD) - Collaboration Station.pdf`
