# Security checks in CI/CD

This project runs security checks in GitHub Actions, aligned with **OWASP ASVS** (Application Security Verification Standard) and secure SDLC practices.

## Workflows

| Workflow | File | Triggers | What it does |
|----------|------|----------|--------------|
| **CI** | `.github/workflows/ci.yml` | Push/PR to `development`, `main`, `master` | Lint, format check, tests, build |
| **Security** | `.github/workflows/security.yml` | Push/PR + weekly schedule | Dependency audit, secret scan |

## Security workflow details

1. **Dependency audit (OWASP supply chain)**  
   - `npm ci` for lockfile integrity and reproducible installs  
   - `npm run audit` (fails on **high** and **critical** vulnerabilities)  
   - Maps to ASVS 14.x (supply chain, dependencies)

2. **Secret detection**  
   - **Gitleaks** scans the repo (including history) for committed secrets  
   - Config: `.github/gitleaks.toml` (allowlist for examples/docs)  
   - Maps to ASVS 6.x / 14.x (secrets, secure config)

3. **Optional: OWASP Dependency-Check**  
   - Commented in `security.yml`; uncomment to run CVE/NVD scan and upload SARIF.

## Running checks locally

```bash
# Install (lockfile integrity)
npm ci

# Dependency vulnerabilities (fail on high/critical)
npm run audit

# Full audit report (no fail)
npm run audit:check

# Lint (includes type-check)
npm run lint
```

## Adjusting severity

- To fail only on **critical**: in `package.json`, change  
  `"audit": "npm audit --audit-level=high"`  
  to  
  `"audit": "npm audit --audit-level=critical"`.
- To allow the security workflow to run but not fail the job on audit: in `security.yml`, add  
  `continue-on-error: true`  
  to the "npm audit" step (not recommended for production).

## Reporting security issues

Do not open public issues for security vulnerabilities. Report them privately to the maintainers or via your organization’s process.
