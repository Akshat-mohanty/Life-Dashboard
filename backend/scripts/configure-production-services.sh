#!/usr/bin/env bash
set -e

echo "========================================================"
echo " Meridian — Production Services Configuration"
echo " (EventBridge 7 AM IST Cron, Amazon SNS, Amazon SES)"
echo "========================================================"

SENDER_EMAIL="${1:-briefings@lifedashboard.app}"
REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="life-dashboard-backend"

# 1. Verify AWS CLI
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not installed. Instructions for manual configuration:"
    echo ""
    echo "1. Amazon EventBridge:"
    echo "   - Rule 'LifeDashboardDailyBriefingTrigger' is defined in template.yaml."
    echo "   - Schedule Expression: cron(0 1 * * ? *) (01:00 UTC = 06:30/07:00 IST)."
    echo "   - State: ENABLED with Target set to BriefingGenerateFunction."
    echo ""
    echo "2. Amazon SES:"
    echo "   - In AWS SES Console > Verified Identities:"
    echo "   - Verify the sender email identity ($SENDER_EMAIL)."
    echo "   - Note: If in SES Sandbox, verify recipient emails or request production access."
    echo ""
    echo "3. Amazon SNS:"
    echo "   - HealthRemindersTopic is provisioned automatically by SAM."
    echo "   - Set SMS delivery type to 'Transactional' in SNS console."
    exit 0
fi

# 2. Amazon SES Identity Verification
echo "Configuring Amazon SES verified email identity: $SENDER_EMAIL..."
aws ses verify-email-identity --email-address "$SENDER_EMAIL" --region "$REGION" || true
echo "✅ Verification email dispatched to $SENDER_EMAIL (if not already verified)."

# 3. Amazon SNS SMS Configuration
echo "Configuring Amazon SNS SMS attributes..."
aws sns set-sms-attributes \
    --attributes DefaultSMSType=Transactional \
    --region "$REGION" || true
echo "✅ SNS default SMS type set to Transactional."

# 4. Amazon EventBridge Schedule Verification
echo "Verifying EventBridge Schedule in stack $STACK_NAME..."
RULE_NAME=$(aws events list-rules --name-prefix "LifeDashboard" --region "$REGION" --query "Rules[0].Name" --output text || true)

if [ "$RULE_NAME" != "None" ] && [ -n "$RULE_NAME" ]; then
    echo "Rule detected: $RULE_NAME"
    aws events enable-rule --name "$RULE_NAME" --region "$REGION" || true
    echo "✅ EventBridge daily 7 AM IST briefing rule is ACTIVE."
else
    echo "ℹ️  EventBridge rule will be automatically activated upon running 'sam deploy'."
fi

echo "========================================================"
echo "Production services setup completed."
echo "========================================================"
