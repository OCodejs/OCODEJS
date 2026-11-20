# OCodeJS business content source

This directory defines the public business identity and curated project catalog for the OCodeJS organization.

## Source-of-truth rules

- `manifest.json` owns organization metadata and curated project records.
- Markdown articles are authored in `_articles/**/*.md` and retain their YAML frontmatter.
- The central repository imports these records into its generated `business-sync/` directory.
- The central sync workflow opens or updates a Draft Pull Request. It never merges or deploys.
- Only public, publishable content is synchronized. Never place credentials, private customer data, or internal-only material here.

## Add a project

Add a record to `projects` in `manifest.json`. Give each project a stable, unique `id`, a repository URL, a clear description, and a truthful status.

## Publish an article

Add a Markdown file under `_articles/` with frontmatter:

```yaml
---
title: Article title
description: Short summary
lang: en
---
```

Commit the change to the default branch. The central repository polls this public source and proposes the update through a Draft PR.
