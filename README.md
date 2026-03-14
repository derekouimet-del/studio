# Pen-Quest: AI-Powered Penetration Testing Suite

This is the production repository for **Pen-Quest**.

## 🚀 Deployment to penquest.app

Since this project uses Next.js 15 and is configured with `apphosting.yaml`, it is best deployed via **Firebase App Hosting**.

### 1. Connect to Firebase App Hosting
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the left sidebar, navigate to **Build > App Hosting**.
4. Click **Get Started** and connect your GitHub repository.
5. Follow the wizard to create a "Backend". This will set up an automated CI/CD pipeline that redeploys your app every time you push to your main branch.

### 2. Connect Your Custom Domain (`penquest.app`)
Once your App Hosting backend is created:
1. In the **App Hosting** dashboard, select your backend.
2. Click on the **Settings** tab.
3. Locate the **Custom domains** section and click **Add domain**.
4. Enter `penquest.app` (and `www.penquest.app` if desired).
5. Firebase will provide you with **A** and **AAAA** records. Log in to your domain registrar (where you bought the domain) and update your DNS settings with these values.
6. It may take up to 24-48 hours for DNS changes to propagate and for the SSL certificate to be issued.

### 3. Configure Production Secrets
Your app relies on several environment variables (like `LLAMA_API_KEY`). For production:
1. Go to the **App Hosting** dashboard -> **Settings**.
2. Under **Environment variables**, ensure you have added any secrets your tools require.
3. Secrets should be stored in **Google Cloud Secret Manager** (which Firebase will prompt you to use) for maximum security.

## 🛠 Features
- **Attack Surface Mapper**: Subdomain discovery.
- **Web Crawler**: Deep secret parsing with AWS Pair Validation.
- **DataSieve Pro**: High-performance secret extractor for large documents.
- **FofaForge**: Natural language to FOFA query builder.
- **CVE Monitor**: Real-time threat intelligence feed.

## 🛡 Security Note
Only use this tool on infrastructure you have explicit, written permission to test.
