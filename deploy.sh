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
# Private by default. GitHub Pages from a private repo needs GitHub Pro;
# on a Free account run:  PUBLIC=1 ./deploy.sh
PUBLIC="${PUBLIC:-0}"
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
# gh auth status can exit 0 even when the token is bad, so prove it with a real call
if command -v gh >/dev/null 2>&1; then
  GH_LOGIN="$(gh api user --jq .login 2>/dev/null || true)"
  case "$GH_LOGIN" in
    ""|*[!A-Za-z0-9-]*) GH_LOGIN="" ;;
  esac
  if [ -n "$GH_LOGIN" ]; then
    USE_GH=1
    USER_NAME="$GH_LOGIN"
    ok "Using the gh CLI, signed in as $USER_NAME"
  fi
fi
if [ "$USE_GH" = 0 ]; then
  command -v gh >/dev/null 2>&1 && say "gh is installed but not signed in — run 'gh auth login' to skip this next time"
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

# BSD sed on macOS has no \| alternation, so parse JSON the portable way
json_bool() { # json_bool KEY  <  json
  tr ',{}' '\n\n\n' | grep "\"$1\"" | grep -Eo 'true|false' | head -1
}

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
if REPO_JSON="$(api GET "/repos/$USER_NAME/$REPO_NAME" 2>/dev/null)" && [ -n "$REPO_JSON" ]; then
  IS_PRIVATE="$(printf '%s' "$REPO_JSON" | json_bool private)"
  ok "Repo $USER_NAME/$REPO_NAME already exists (private=$IS_PRIVATE)"
  # PUBLIC=1 on an existing private repo: actually flip it, otherwise the flag
  # silently did nothing because visibility was only ever set at creation time
  if [ "$PUBLIC" = "1" ] && [ "$IS_PRIVATE" = "true" ]; then
    say "Making it public so Pages works on a Free account"
    api PATCH "/repos/$USER_NAME/$REPO_NAME" '{"private":false}' >/dev/null \
      && ok "Repo is now public" \
      || die "Could not change visibility — do it in Settings -> General -> Change visibility."
  fi
else
  if [ "$PUBLIC" = "1" ]; then
    VIS='"private":false'; say "Creating $USER_NAME/$REPO_NAME (public)"
  else
    VIS='"private":true';  say "Creating $USER_NAME/$REPO_NAME (private)"
  fi
  api POST "/user/repos" \
    '{"name":"'"$REPO_NAME"'","description":"Learning Hub — AI course + English plan tracker",'"$VIS"',"has_issues":false,"has_wiki":false,"has_projects":false}' \
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
PAGES_OK=1
if api GET "/repos/$USER_NAME/$REPO_NAME/pages" >/dev/null 2>&1; then
  ok "Pages was already enabled"
else
  if api POST "/repos/$USER_NAME/$REPO_NAME/pages" \
       '{"source":{"branch":"'"$BRANCH"'","path":"/"}}' >/dev/null 2>&1; then
    ok "Pages enabled"
  else
    PAGES_OK=0
    PAGES_ERR="$(api POST "/repos/$USER_NAME/$REPO_NAME/pages" \
                  '{"source":{"branch":"'"$BRANCH"'","path":"/"}}' 2>&1 || true)"
    IS_PRIVATE="$(api GET "/repos/$USER_NAME/$REPO_NAME" 2>/dev/null | json_bool private)"
    echo
    if [ "$IS_PRIVATE" = "true" ]; then
      printf '\033[1;33m!\033[0m %s\n' "Pages would not turn on for a PRIVATE repo."
      cat <<'MSG'

  Publishing Pages from a private repository needs GitHub Pro (about $4/month).
  On a Free account you have three choices:

    1. Upgrade to Pro, then:  Settings -> Pages -> Deploy from a branch -> main / (root)
       Note: the repo stays private but the SITE is still reachable by anyone with
       the URL. Private source, public site.

    2. Make the repo public and keep Pages free:
         PUBLIC=1 ./deploy.sh
       The repo holds the study plans only — your progress lives in your browser
       and in a private Gist, and no tokens are in it.

    3. Host it behind a login instead — Cloudflare Pages can build from a private
       GitHub repo, and Cloudflare Access puts an email one-time-PIN in front of
       the site so only you can open it. Free tier, and the only option here that
       makes the SITE itself private.

MSG
    else
      printf '\033[1;33m!\033[0m %s\n' "Pages did not turn on. GitHub said:"
      printf '   %s\n' "$(printf '%s' "$PAGES_ERR" | head -c 300)"
      echo
      echo "  Finish it in the browser — it takes one click:"
      echo "    https://github.com/$USER_NAME/$REPO_NAME/settings/pages"
      echo "    Source: Deploy from a branch -> Branch: $BRANCH -> folder: / (root) -> Save"
      echo "    Leave 'Custom domain' EMPTY. You do not need a domain."
      echo
    fi
  fi
fi

URL="https://$USER_NAME.github.io/$REPO_NAME/"
echo
if [ "$PAGES_OK" = "0" ]; then
  ok "Code is pushed to https://github.com/$USER_NAME/$REPO_NAME"
  echo "   Once Pages is on it will be at:"
  printf '\033[1;36m   %s\033[0m\n' "$URL"
  exit 0
fi
ok "Live in about a minute at:"
printf '\033[1;36m   %s\033[0m\n' "$URL"
echo
# open it straight away on macOS
command -v open >/dev/null 2>&1 && (sleep 45; open "$URL") >/dev/null 2>&1 &

echo "   Opening in your browser in ~45s, once GitHub finishes the first build."
echo
echo "   On iPhone / iPad: open that URL in Safari → Share → Add to Home Screen."
echo "   Then ⟳ in the app → paste a second token, this one with ONLY the gist"
echo "   scope → Create new gist → copy the Gist ID onto your other devices."
echo
