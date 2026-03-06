---
title: Confirming Spring Upstream
toc: true
---

# Confirming Spring Upstream

---

You may have some references to the Fall 2025 repository -- and my apologies for not replacing the link when including the git instructions. The instructions are updated, but the following includes specific instructions for each circumstance. 

There are two scenarios you could fall into:
1. **You forked the Fall repo**, or
2. **Your upstream is the Fall repo**. 

You can determine if you fall into either of these scenarios from the following steps. 

**Check your repo name.** It should be `Interactive-Data-Vis-Spring2026`. If the reference is `-Fall2025`, follow instructions for [forking the correct repo](#if-you-forked-the-fall-repo).

**Check your remote repository links.** You can do so by navigating to the project folder in your terminal and running: 

```sh
git remote -v
```

You should see both your origin and upstream remotes. Example:

```text
origin    https://github.com/[YOUR_USERNAME]/Interactive-Data-Vis-Spring2026.git (fetch)
origin    https://github.com/[YOUR_USERNAME]/Interactive-Data-Vis-Spring2026.git (push)
upstream  https://github.com/InteractiveDataVis/Interactive-Data-Vis-Spring2026.git (fetch)
upstream  https://github.com/InteractiveDataVis/Interactive-Data-Vis-Spring2026.git (push)
```

If your upstream is not there, **or it references the old repo** at `https://github.com/InteractiveDataVis/Interactive-Data-Vis-Fall2025.git`, you'll need to re-do the upstream via [the instructions below](#if-your-upstream-is-the-fall-repo). 

Once you're done, you can pull Lab 1 into your fork. And I promise, no fall references this time...

---

## If you forked the Fall repo

This does require a complete re-forking of the appropriate repo to include all the details you will need for this semester.

You should first fork the appropriate repo before archiving the incorrect fork. That way, you can copy the work you've already done for Lab 0.

1. Follow the instructions in the [Lab 0 readme](https://github.com/InteractiveDataVis/Interactive-Data-Vis-Spring2026/tree/main/src/lab_0) to fork the correct repo. You probably already have all the installations if you completed them before. 
2. Confirm your upstream is correct by continuing to the following steps:

---

## If your `upstream` is the Fall repo

Your fork of the class repo should stay connected to the correct Spring 2026 class repository. That way you can pull new labs, fixes, and content when I update the repo.

You should be able to push and pull from your origin, as well as pull new content from the class repo. 

- **`origin`** → your fork (e.g. `https://github.com/[YOUR_USERNAME]/Interactive-Data-Vis-Spring2026.git`)
- **`upstream`** → the class repo: `https://github.com/InteractiveDataVis/Interactive-Data-Vis-Spring2026.git`

If **`upstream`** is missing, add it:

```sh
git remote add upstream https://github.com/InteractiveDataVis/Interactive-Data-Vis-Spring2026.git
```

If **`upstream`** already exists but points to the wrong URL, update it instead:

```sh
git remote set-url upstream https://github.com/InteractiveDataVis/Interactive-Data-Vis-Spring2026.git
```

Then run `git remote -v` again to confirm.

For the full GitHub setup (fork, clone, upstream, Pages, and syncing), see [Lab 0: Getting Started](/lab_0/readme).

---

## Pulling Released Labs

After your upstream points to the Spring 2026 repo, pull the latest content (including Lab 1) into your local copy:

```sh
git fetch upstream
git merge upstream/main
```

Do this from your project folder, ideally before you start new work. If you have uncommitted changes, commit or stash them first (commit = [save changes to the repo](https://docs.github.com/en/pull-requests/committing-changes-to-your-project); stash = [temporarily set them aside](https://docs.github.com/en/desktop/making-changes-in-a-branch/stashing-changes-in-github-desktop)). After merging, you should see the `lab_1` folder and any other updates from the class repo.

You can repeat these two steps every time a new lab is released. 