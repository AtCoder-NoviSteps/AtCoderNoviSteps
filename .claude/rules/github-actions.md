---
description: GitHub Actions workflow rules
paths:
  - '.github/workflows/**'
---

# GitHub Actions

## workflow_dispatch Requires the Default Branch

The GitHub Actions UI only shows `workflow_dispatch` workflows that exist on the **default branch** (staging in this repo). A workflow file that only exists on a feature branch cannot be triggered from the UI.

For one-time operational workflows (e.g. migration fixes): merge to staging first, then trigger the dispatch.
