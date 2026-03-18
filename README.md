# Pen-Quest: AI-Powered Penetration Testing Suite

This is the production repository for **Pen-Quest**, currently configured for deployment to **https://penquest.app**.

## 🚀 Deployment Guide for penquest.app

Since this project uses Next.js 15, it is best deployed via **Firebase App Hosting**.

### 1. Push to GitHub
Ensure your latest code is committed and pushed to a GitHub repository.

### 2. Connect to Firebase App Hosting
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (create one if you haven't).
3. In the left sidebar, navigate to **Build > App Hosting**.
4. Click **Get Started** and connect your GitHub account.
5. Select your repository and the branch you want to deploy (usually `main`).
6. Firebase will automatically detect the Next.js setup and start the initial build.

### 3. Connect Your Custom Domain (`penquest.app`)
Once your backend is created:
1. In the **App Hosting** dashboard, select your new backend.
2. Click on the **Settings** tab.
3. Scroll to **Custom domains** and click **Add domain**.
4. Enter `penquest.app`.
5. Firebase will provide **A** and **AAAA** records. Log in to your domain registrar (where you bought the domain) and update your DNS settings with these values.
6. **Note:** SSL certificate issuance and DNS propagation can take up to 24 hours.

### 4. Configure Secrets (Llama API)
Your app requires `LLAMA_API_KEY` to run network scans.
1. In the Firebase Console, go to **App Hosting > [Your Backend] > Settings**.
2. Under **Environment variables**, ensure you add `LLAMA_API_KEY`.
3. Firebase will prompt you to store this in **Google Cloud Secret Manager**. This is the most secure way to handle keys in production.

## 🛠 Features
- **Attack Surface Mapper**: Subdomain discovery and IP mapping.
- **Web Crawler**: Deep secret parsing with AWS Pair Validation.
- **DataSieve Pro**: High-performance secret extractor for large documents (20MB limit).
- **FofaForge**: Natural language to FOFA query builder.
- **CVE Monitor**: Real-time threat intelligence feed.

## 🛡 Security Note
Only use this tool on infrastructure you have explicit, written permission to test. Unauthorized use is illegal.
