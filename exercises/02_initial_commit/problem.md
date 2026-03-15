# Exercise 2 — Initial Commit

Now that Git knows who you are, it is time to create your first commit.

## Your Task

1. Create a file called `README.md` in the repository root.
2. Stage it with `git add`.
3. Commit it with a non-empty message.

    echo "# My Project" > README.md
    git add README.md
    git commit -m "Initial commit"

## Verify

When you are ready, run:

    git-test verify

The checker will confirm that:

- `README.md` is tracked by Git.
- At least one commit exists in the repository history.

## Hints

- Run `git status` to confirm the working tree is clean after committing.
- The commit message can be anything — it just cannot be empty.
