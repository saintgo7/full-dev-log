# GitHub Secrets Setup Guide

This document describes the required GitHub Secrets for the DevLog Hub CI/CD pipelines.

## Required Secrets

### Repository Secrets

Navigate to your repository: **Settings > Secrets and variables > Actions**

#### Core Secrets

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `GITHUB_TOKEN` | Automatically provided by GitHub | All workflows |

#### Container Registry

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `REGISTRY_USERNAME` | Container registry username | `saintgo7` |
| `REGISTRY_PASSWORD` | Container registry password/token | (Personal Access Token) |

> **Note**: For GitHub Container Registry (ghcr.io), the built-in `GITHUB_TOKEN` is sufficient.
> For other registries (Docker Hub, AWS ECR), you need to configure these secrets.

#### Database Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DATABASE_URL_STAGING` | PostgreSQL connection for staging | `postgresql://user:pass@host:5432/db` |
| `DATABASE_URL_PRODUCTION` | PostgreSQL connection for production | `postgresql://user:pass@host:5432/db` |

#### Application Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `JWT_SECRET_STAGING` | JWT signing key for staging | `your-staging-jwt-secret-32-chars` |
| `JWT_SECRET_PRODUCTION` | JWT signing key for production | `your-production-jwt-secret-32-chars` |

#### Deployment Secrets (Kubernetes/Cloud)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `KUBE_CONFIG_STAGING` | Base64-encoded kubeconfig for staging | `base64 ~/.kube/staging-config` |
| `KUBE_CONFIG_PRODUCTION` | Base64-encoded kubeconfig for production | `base64 ~/.kube/production-config` |

#### Cloud Provider Secrets (Choose based on your provider)

**AWS**
| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | AWS region (e.g., `ap-northeast-2`) |

**Google Cloud**
| Secret Name | Description |
|-------------|-------------|
| `GCP_SERVICE_ACCOUNT_KEY` | Base64-encoded service account JSON |
| `GCP_PROJECT_ID` | GCP project ID |

**DigitalOcean**
| Secret Name | Description |
|-------------|-------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DO API token |
| `DIGITALOCEAN_CLUSTER_ID` | Kubernetes cluster ID |

#### Notification Secrets (Optional)

| Secret Name | Description |
|-------------|-------------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL |

---

## Environment Configuration

### Setting Up Environments

1. Go to **Settings > Environments**
2. Create two environments: `staging` and `production`

#### Staging Environment

- **Name**: `staging`
- **Protection rules**: None (auto-deploy)
- **Environment secrets**: Add staging-specific secrets

#### Production Environment

- **Name**: `production`
- **Protection rules**:
  - Required reviewers: Add 1-2 reviewers
  - Wait timer: 5 minutes (optional)
- **Environment secrets**: Add production-specific secrets

---

## Setup Commands

### Generate JWT Secret

```bash
# Generate a secure 32-character secret
openssl rand -base64 32
```

### Encode Kubeconfig

```bash
# Encode kubeconfig file for secret
cat ~/.kube/config | base64 -w 0
```

### Create GitHub Personal Access Token

1. Go to **Settings > Developer settings > Personal access tokens > Tokens (classic)**
2. Generate new token with scopes:
   - `write:packages` - Push packages to GitHub Container Registry
   - `read:packages` - Pull packages
   - `delete:packages` - Delete packages (optional)

---

## Verification

After setting up secrets, verify with a test workflow run:

```bash
# Trigger a test run
gh workflow run ci.yml --ref develop
```

Check the Actions tab for successful execution.

---

## Security Best Practices

1. **Rotate secrets regularly** - Change production secrets every 90 days
2. **Use environment-specific secrets** - Never share secrets between staging and production
3. **Limit access** - Only grant secret access to necessary team members
4. **Audit access** - Review secret access logs periodically
5. **Never commit secrets** - Use `.gitignore` to exclude secret files

---

## Troubleshooting

### Secret Not Found

```
Error: Input required and not supplied: token
```

**Solution**: Verify the secret name matches exactly (case-sensitive).

### Permission Denied

```
Error: Resource not accessible by integration
```

**Solution**: Check repository permissions and GITHUB_TOKEN scope.

### Container Registry Auth Failed

```
Error: unauthorized: authentication required
```

**Solution**:
1. Verify `GITHUB_TOKEN` has `packages:write` permission
2. Check if package visibility matches repository visibility

---

## Quick Setup Checklist

- [ ] Create `staging` environment
- [ ] Create `production` environment with protection rules
- [ ] Add `DATABASE_URL_STAGING` secret
- [ ] Add `DATABASE_URL_PRODUCTION` secret
- [ ] Add `JWT_SECRET_STAGING` secret
- [ ] Add `JWT_SECRET_PRODUCTION` secret
- [ ] Add cloud provider secrets (if using external deployment)
- [ ] Add notification webhook secrets (optional)
- [ ] Verify secrets with test workflow run
