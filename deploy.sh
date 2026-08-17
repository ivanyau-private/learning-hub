#!/usr/bin/env bash
# =============================================================================
# Learning Hub — one-shot deploy to GitHub Pages
#
#   ./deploy.sh
#
# Creates the repo, pushes, turns on Pages, and prints the URL.
# Re-run it any time to publish changes — it detects an existing repo and
# just pushes.
#
# Needs one of:
#   • the gh CLI, already logged in  (brew install gh && gh auth login)
#   • a GitHub token with the `repo` scope, which it will prompt for
#     https://github.com/settings/tokens → Tokens (classic)
#
# Nothing is written to disk except the git remote; the token is only held
# in a shell variable for the length of the run.
# =============================================================================

set -euo pipefail

REPO_NAME="${REPO_NAME:-learning-hub}"
BRANCH="main"
cd "$(dirname "$0")"

say()  { printf '\033[1;35m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

[ -d .git ] || die "Run this from inside the learning-hub folder."

# ---------------------------------------------------------------- identity
if [ -z "$(git config user.email || true)" ]; then
  git config user.email "ivanyau722@gmail.com"
  git config user.name  "Ivan"
fi

# ---------------------------------------------------------------- auth
USE_GH=0
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  USE_GH=1
  USER_NAME="$(gh api user --jq .login)"
  ok "Using the gh CLI, signed in as $USER_NAME"
else
  say "GitHub token with the 'repo' scope"
  echo "  Create one at https://github.com/settings/tokens → Tokens (classic)"
  echo "  It is not echoed and not saved."
  printf '  Token: '
  read -rs TOKEN; echo
  [ -n "${TOKEN:-}" ] || die "No token given."

  RESP="$(curl -sS -H "Authorization: Bearer $TOKEN" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/user 2>&1 || true)"
  USER_NAME="$(printf '%s' "$RESP" | sed -n 's/.*"login": *"\([^"]*\)".*/\1/p' | head -1)"
  if [ -z "$USER_NAME" ]; then
    echo "$RESP" | head -3 >&2
    die "GitHub did not accept that token. Check it has the 'repo' scope and hasn't expired."
  fi
  ok "Authenticated as $USER_NAME"
fi

api() { # api METHOD PATH [BODY]
  local m="$1" p="$2" body="${3:-}"
  if [ "$USE_GH" = 1 ]; then
    if [ -n "$body" ]; then gh api -X "$m" "$p" --input - <<<"$body"
    else gh api -X "$m" "$p"; fi
  else
    if [ -n "$body" ]; then
      curl -fsS -X "$m" -H "Authorization: Bearer $TOKEN" \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com$p" -d "$body"
    else
      curl -fsS -X "$m" -H "Authorization: Bearer $TOKEN" \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com$p"
    fi
  fi
}

# ---------------------------------------------------------------- repo
if api GET "/repos/$USER_NAME/$REPO_NAME" >/dev/null 2>&1; then
  ok "Repo $USER_NAME/$REPO_NAME already exists"
else
  say "Creating $USER_NAME/$REPO_NAME (public — required for Pages on a free plan)"
  api POST "/user/repos" \
    '{"name":"'"$REPO_NAME"'","description":"Learning Hub — AI course + English plan tracker","public":true,"has_issues":false,"has_wiki":false,"has_projects":false}' \
    >/dev/null
  ok "Repo created"
fi

# ---------------------------------------------------------------- push
if [ "$USE_GH" = 1 ]; then
  REMOTE="https://github.com/$USER_NAME/$REPO_NAME.git"
else
  REMOTE="https://$USER_NAME:$TOKEN@github.com/$USER_NAME/$REPO_NAME.git"
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git branch -M "$BRANCH"

say "Pushing"
git push -u origin "$BRANCH" --quiet
ok "Pushed"

# keep the token out of .git/config afterwards
git remote set-url origin "https://github.com/$USER_NAME/$REPO_NAME.git"

# ---------------------------------------------------------------- pages
say "Turning on GitHub Pages"
if api GET "/repos/$USER_NAME/$REPO_NAME/pages" >/dev/null 2>&1; then
  ok "Pages was already enabled"
else
  api POST "/repos/$USER_NAME/$REPO_NAME/pages" \
    '{"source":{"branch":"'"$BRANCH"'","path":"/"}}' >/dev/null 2>&1 \
    && ok "Pages enabled" \
    || say "Could not enable Pages over the API — do it once by hand: Settings → Pages → Deploy from a branch → $BRANCH / (root)"
fi

URL="https://$USER_NAME.github.io/$REPO_NAME/"
echo
ok "Live in about a minute at:"
printf '\033[1;36m   %s\033[0m\n' "$URL"
echo
echo "   On iPhone / iPad: open that in Safari → Share → Add to Home Screen."
echo "   Then ⟳ in the app → paste a second token, this one with ONLY the gist"
echo "   scope → Create new gist → copy the Gist ID onto your other devices."
echo
