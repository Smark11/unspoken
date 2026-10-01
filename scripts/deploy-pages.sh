#!/usr/bin/env bash
# Build and publish the site to the gh-pages branch without GitHub Actions.
# Usage: npm run deploy   (needs push access to origin)
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=$(basename "$(git remote get-url origin)" .git)
BASE_PATH="/$REPO/" npm run build
git worktree prune
git branch -D gh-pages >/dev/null 2>&1 || true
TMP=$(mktemp -d)
git worktree add -q --detach "$TMP"
(
  cd "$TMP"
  git checkout -q --orphan gh-pages
  git rm -rfq . >/dev/null 2>&1 || true
  cp -R "$OLDPWD/dist/." .
  touch .nojekyll
  git add -A
  git -c commit.gpgsign=false commit -qm "Publish built site $(date -u +%Y-%m-%dT%H:%MZ)"
  git push -f origin gh-pages
)
git worktree remove --force "$TMP"
gh api -X POST "repos/{owner}/{repo}/pages/builds" >/dev/null 2>&1 || true
echo "Published. Give GitHub a minute, then open https://$(gh api repos/{owner}/{repo}/pages -q .html_url | sed 's#https://##')"
