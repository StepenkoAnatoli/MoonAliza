# Sources

Every page this project has fetched, and what it was used for. `P` primary/official
carries the design, `S` secondary is context, `L` lead-only is a hint and never proof.

| URL | Type | Title | Retrieved | Used for |
|---|---|---|---|---|
| https://github.com/orgs/community/discussions/13082 | S | Support for sharing secrets between jobs · community · Discussion #13082 · GitHub | 2026-09-29 | phase 0: Masking secrets in streamed output: how GitHub Actions and GitLab Runner mask a secret split across chunks, and which encodings they also mask |
| https://www.youtube.com/watch?v=p7aOmRJ0qcY | S | GitHub Actions - Masking Variables and Secrets - YouTube | 2026-09-29 | phase 0: Masking secrets in streamed output: how GitHub Actions and GitLab Runner mask a secret split across chunks, and which encodings they also mask |
| https://blog.stephane-robert.info/en/docs/pipeline-cicd/github/fondations/secrets/ | S | GitHub Actions secrets and configuration | 2026-09-29 | phase 0: Masking secrets in streamed output: how GitHub Actions and GitLab Runner mask a secret split across chunks, and which encodings they also mask |
| https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines | S | Managing Secrets in Github Pipelines | 2026-09-29 | phase 0: Masking secrets in streamed output: how GitHub Actions and GitLab Runner mask a secret split across chunks, and which encodings they also mask |
| https://raw.githubusercontent.com/actions/runner/main/src/Sdk/DTLogging/Logging/SecretMasker.cs | P | secretmasker-cs | 2026-09-29 | U-01, U-04: how the Actions runner masks secrets in log lines |
| https://raw.githubusercontent.com/actions/runner/main/src/Sdk/DTLogging/Logging/ValueEncoders.cs | P | valueencoders-cs | 2026-09-29 | U-02: which encodings of a secret the Actions runner also masks |
| https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions | P | Using secrets in GitHub Actions - GitHub Docs | 2026-09-29 | U-03: what GitHub says masking does not cover |
| https://docs.gitlab.com/ci/variables/ | P | CI/CD variables \| GitLab Docs | 2026-09-29 | U-02, U-03: GitLab's requirements for a variable to be maskable |
| https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979 | S | Fix trace short writes when large masks are configured (!2979) · Merge requests · GitLab.org / gitlab-runner · GitLab | 2026-09-29 | U-01, U-04: GitLab Runner's streaming masker source |
