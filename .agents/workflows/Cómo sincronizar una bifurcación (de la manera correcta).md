Cómo sincronizar una bifurcación (de la manera correcta)

---
description: Keep your fork up-to-date with the original repo
---

1. **Add Upstream Remote**:
   - Check if you already have it.
   // turbo
   - Run `git remote -v`
   - If not, add it (replace `[original-repo-url]` with the actual URL):
   // turbo
   - Run `git remote add upstream [original-repo-url]`

2. **Fetch Upstream Changes**:
   - Fetch the latest branches and commits from the upstream repository.
   // turbo
   - Run `git fetch upstream`

3. **Merge into Main**:
   - Switch to your local main branch.
   // turbo
   - Run `git checkout main`
   - Merge the upstream changes.
   // turbo
   - Run `git merge upstream/main`

4. **Push to Your Fork**:
   - Update your fork on GitHub/GitLab.
   // turbo
   - Run `git push origin main`

5. **Pro Tips**:
   - Always sync `main` before creating a new feature branch.
   - Never commit directly to `main` on a fork; always use feature branches.

