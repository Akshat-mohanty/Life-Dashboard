#!/usr/bin/env bash
set -e

echo "========================================================"
echo " Meridian — AWS Amplify Hosting Deployment"
echo "========================================================"

APP_NAME="life-dashboard"
BRANCH="main"
REGION="${AWS_REGION:-us-east-1}"

# 1. Build the production Vite bundle
echo "Building production frontend assets..."
cd "$(dirname "$0")/.."
npm run build

# 2. Package dist folder for deployment
echo "Creating deployment archive..."
cd dist
zip -r -q ../deploy.zip .
cd ..

echo "✅ Package created: deploy.zip ($(du -h deploy.zip | cut -f1))"

# 3. Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI is not installed or not in PATH."
    echo "You can deploy deploy.zip manually in the AWS Amplify Console:"
    echo "  1. Open AWS Management Console > AWS Amplify"
    echo "  2. Choose 'Deploy without Git provider' (or connect your repo)"
    echo "  3. Drag and drop deploy.zip directly into the console"
    exit 0
fi

# 4. Create or locate Amplify App
echo "Checking existing Amplify app: $APP_NAME..."
APP_ID=$(aws amplify list-apps --region "$REGION" --query "apps[?name=='$APP_NAME'].appId" --output text || true)

if [ -z "$APP_ID" ] || [ "$APP_ID" == "None" ]; then
    echo "Creating new Amplify app: $APP_NAME..."
    APP_ID=$(aws amplify create-app \
        --name "$APP_NAME" \
        --platform WEB \
        --region "$REGION" \
        --query "app.appId" \
        --output text)
    echo "Created Amplify App ID: $APP_ID"

    echo "Creating branch: $BRANCH..."
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --region "$REGION" > /dev/null
fi

# 5. Create deployment and upload zip
echo "Creating deployment for App: $APP_ID, Branch: $BRANCH..."
DEPLOY_INFO=$(aws amplify create-deployment \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --region "$REGION")

JOB_ID=$(echo "$DEPLOY_INFO" | grep -o '"jobId": "[^"]*' | cut -d'"' -f4)
ZIP_URL=$(echo "$DEPLOY_INFO" | grep -o '"zipUploadUrl": "[^"]*' | cut -d'"' -f4)

echo "Uploading deploy.zip to S3 endpoint..."
curl -s -H "Content-Type: application/zip" -T deploy.zip "$ZIP_URL"

echo "Starting deployment job: $JOB_ID..."
aws amplify start-deployment \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --job-id "$JOB_ID" \
    --region "$REGION" > /dev/null

DEFAULT_DOMAIN=$(aws amplify get-app --app-id "$APP_ID" --region "$REGION" --query "app.defaultDomain" --output text)
echo "--------------------------------------------------------"
echo "✅ Frontend successfully deployed to AWS Amplify!"
echo "App URL: https://${BRANCH}.${DEFAULT_DOMAIN}"
echo "--------------------------------------------------------"
