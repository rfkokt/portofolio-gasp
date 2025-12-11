# Deployment & Automation Walkthrough

I have successfully configured your project for automated deployment and AI blogging. Here is how to finalize the setup on your VPS and GitHub.

## What I Did
- **Fixed `docker-compose.yml`**: Removed duplicate keys and prepared it for production.
- **Updated Deployment Workflow**: The GitHub Action now automatically copies your `docker-compose.yml` to the VPS before deploying.
- **Created AI Agent Workflow**: A new `ai-blogger.yml` workflow runs daily to generate and publish content.
- **Updated `package.json`**: Added `postinstall` script to ensure Prisma Client is always ready.

## 🚀 Final Setup Instructions

### 1. GitHub Secrets
Go to your repository **Settings > Secrets and variables > Actions** and add:

| Secret Name | Value |
|:---|:---|
| `VPS_HOST` | Your VPS IP address (e.g., `123.45.67.89`) |
| `VPS_USER` | Your SSH username (e.g., `root`) |
| `VPS_SSH_KEY` | Your private SSH key (content of `.pem` or `id_rsa`) |
| `Z_AI_API_KEY` | Your Z.ai API Key |

### 2. GitHub Environments Setup (New!)
Since we now support Dev and Prod environments, you need to configure Environments in GitHub.

1. Go to **Settings > Environments** in your repo.
2. Create two environments: `production` and `development`.
3. Add **Environment Variables** (NOT Secrets) to each:

**For `production` environment:**
| Name | Value |
|:---|:---|
| `APP_PORT` | `3000` |
| `PB_PORT` | `8090` |
| `NEXT_PUBLIC_POCKETBASE_URL` | `https://your-domain.com` (or `http://VPS_IP:8090`) |

**For `development` environment:**
| Name | Value |
|:---|:---|
| `APP_PORT` | `3001` |
| `PB_PORT` | `8091` |
| `NEXT_PUBLIC_POCKETBASE_URL` | `https://dev.your-domain.com` (or `http://VPS_IP:8091`) |

### 3. VPS Initialization (One-Time Setup)
SSH into your VPS and run these commands to prepare the environment:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
```

### 4. Deploy!
- Push to `main` -> Deploys to Production (`~/app-prod`, ports 3000/8090)
- Push to `dev` -> Deploys to Development (`~/app-dev`, ports 3001/8091)

```bash
git checkout -b dev
git push origin dev
```
git checkout -b dev
git push origin dev
```

### 5. Create PocketBase Admin User (Important!)
Since this is a fresh install, we need to create the first admin account via the terminal.

SSH into your VPS and run:

```bash
# Go to the app directory
cd ~/app-prod

# Create admin (Replace email/pass with your own)
docker compose exec pocketbase /usr/local/bin/pocketbase superuser create rifkiokta105@gmail.com admin123456
```
Now you can login at `http://YOUR_VPS_IP:8090/_/`.

> **Troubleshooting Login:**
> If you cannot login or need to reset the admin account, delete it first and recreate it:
> ```bash
> # 1. Delete existing admin
> docker compose exec pocketbase /usr/local/bin/pocketbase superuser delete rifkiokta105@gmail.com
> 
>
> **Advanced Debugging:**
> If login still fails despite resetting, check for "zombie" processes or permissions:
> ```bash
> # Check for duplicate containers
> docker ps
> 
> # Check for non-docker pocketbase processes
> ps aux | grep pocketbase
> 
> # Check database permissions (should be owned by root or user inside container)
> ls -l ~/app-prod/pocketbase/pb_data
> 
> # NUCLEAR OPTION: Factory Reset (Wipes all data!)
> docker compose down -v
> sudo rm -rf ~/app-prod/pocketbase/pb_data
> docker compose up -d
> ```

### 6. Verify AI Agent
To test the AI blogger immediately without waiting for the schedule:
1. Go to **Actions** tab in GitHub.
2. Select **AI Blogger Agent** on the left.
3. Click **Run workflow**.

## 🛡️ Optional: HTTPS with Caddy for Subdomains
Update your Caddyfile to support both environments:

```caddy
# Production
your-domain.com {
    reverse_proxy localhost:3000
}

pb.your-domain.com {
    reverse_proxy localhost:8090
}

# Development
dev.your-domain.com {
    reverse_proxy localhost:3001
}

pb-dev.your-domain.com {
    reverse_proxy localhost:8091
}
```
Then run/reload Caddy.

## 🔧 Troubleshooting

### "Failed to fetch" or "Hash Sum mismatch" on VPS
If you see errors like `E: Failed to fetch ... mirrors.tencentyun.com ... File has unexpected size`, it means your VPS provider's package mirror is out of sync. Run these commands to fix it:

```bash
# Clean the apt cache
sudo apt-get clean
sudo rm -rf /var/lib/apt/lists/*

# Update again
sudo apt-get update
```


Then try installing Docker again.

## 🔑 How to get `VPS_SSH_KEY`?
This is the **Private Key** located on **your local computer** (the one you use to SSH into the VPS).

**Option A: You have a `.pem` file (e.g., AWS/Azure)**
On your local computer, open the file:
```bash
cat /path/to/your-key.pem
```
Copy the **entire** content (including `-----BEGIN...` and `...END-----`).

**Option B: You use your local default key**
If you just run `ssh user@ip` without a flag, your key is likely here:
```bash
cat ~/.ssh/id_rsa
# OR
cat ~/.ssh/id_ed25519
```
Copy the entire content.
