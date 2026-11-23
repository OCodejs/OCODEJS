# OCodeJS Bot — GitHub App setup

This repository's first bot phase performs advisory AI reviews on pull requests using a local open-source model. It does not push commits, modify files, approve PRs, merge PRs, or deploy.

## 1. Create the GitHub App

Open https://github.com/organizations/OCodejs/settings/apps/new while signed in with an account that can manage GitHub Apps for the OCodejs organization.

Suggested settings:

- GitHub App name: `ocodejs` (use this exact name if available so the generated bot login can be `ocodejs[bot]`; GitHub controls slug availability and may require a different slug).
- Homepage URL: https://github.com/OCodejs/OCODEJS
- Webhook: disable **Active** for this Actions-only phase.
- Repository permissions:
  - Metadata: Read-only (required by GitHub)
  - Pull requests: Read and write (to publish review comments)
- Do not grant Contents write, Issues write, Administration, Actions write, or Secrets permissions for this phase.

Create the App, then generate a private key. Install the App on the `OCodejs/OCODEJS` repository only.

## 2. Add repository Actions configuration

In https://github.com/OCodejs/OCODEJS/settings/secrets/actions:

- Add repository **variable** `OCODEJS_BOT_CLIENT_ID`: the GitHub App **Client ID** (not the App ID).
- Add repository **secret** `OCODEJS_BOT_PRIVATE_KEY`: the complete PEM private-key contents.

Never commit the PEM file or paste it into an issue, PR, or chat.

## 3. Trigger and verify

Mark a same-repository Draft PR ready for review, or update an already-ready PR targeting `main`. The unprivileged `OCodeJS Bot — PR Review Signal` workflow runs on `pull_request` with empty permissions, no secrets, no checkout, and no PR-code execution. The trusted `workflow_run` publisher is defined on the default branch; it validates the originating workflow and current same-repository, non-draft PR, fetches at most 50 KB of diff through the GitHub API as data, runs Qwen2.5-Coder locally, then creates a short-lived installation token and posts an advisory comment. The trusted publisher never checks out or executes PR code. Draft PR creation alone does not start model inference.

Fork-originated PRs may emit the unprivileged signal, but the trusted publisher rejects them. They remain subject to normal CI and human review.

## 4. Security and limitations

- The model receives only up to 50 KB of textual diff, not the full repository.
- PR contents are treated as untrusted prompt data; the model is not given shell or repository write tools.
- The PR signal workflow has no secrets and no permissions; the privileged publisher runs only from the default branch via `workflow_run` and never checks out PR code.
- The App private key is first exposed to a trusted step after model inference; the App token is scoped to Pull requests: write. and is scoped to Pull requests: write.
- No automatic code changes, commits, approvals, merges, or deployments are performed.
- Local inference is API-key-free, but runner time, model download time, and bandwidth are still consumed. Public-repository standard GitHub-hosted Actions usage is currently free; private-repository usage is subject to plan quotas and billing.
- Review comments are advisory and can be incorrect. Required CI and human review remain authoritative.

## 5. Planned next phase

After the App identity and first review run are verified, add opt-in patch generation on an isolated feature branch, with tests, diff limits, cancellation, and a Draft PR. Only then consider organization-wide installation and repository allowlisting.
