# CloFast Reconciliation Agent for AWS Bedrock AgentCore

This is a custom AWS Bedrock AgentCore agent that performs intelligent financial document reconciliation for the CloFast application.

## Features

- **Intelligent Matching**: Advanced transaction matching using multiple criteria
- **Confidence Scoring**: AI-powered confidence scores for each match (0-100%)
- **Detailed Reasoning**: Comprehensive explanations for match decisions
- **Discrepancy Detection**: Identifies specific issues with unmatched transactions
- **AWS Native**: Built specifically for AWS Bedrock AgentCore runtime

## Architecture

The agent follows the AWS Bedrock AgentCore service contract:
- **Container**: ARM64 Docker container
- **Port**: 8080 (required by AgentCore)
- **Endpoints**: 
  - `POST /invocations` - Main reconciliation processing
  - `GET /ping` - Health check endpoint

## Matching Logic

The agent uses sophisticated matching algorithms:

1. **Custom Rule Matching** (25 points): Applies user-defined matching rules
2. **Amount Matching** (30 points): Exact or fuzzy amount comparison
3. **Date Proximity** (20 points): Matches transactions within date tolerance
4. **Description Similarity** (15 points): Semantic similarity analysis
5. **Reference ID Matching** (25 points): Exact reference ID comparison

Transactions are considered reconciled with ≥80% confidence.

## Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- Docker with buildx support
- Python 3.11+

### Step 1: Build the Agent

```bash
# Clone or create the agent directory
cd agentcore-reconciliation-agent

# Install dependencies locally for testing
pip install -r requirements.txt
```

### Step 2: Test Locally

```bash
# Run the agent locally
python agent.py

# Test the endpoints
curl http://localhost:8080/ping
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Reconcile financial documents",
    "data": {
      "leftDocument": [{"Amount": 100, "Date": "2024-01-01", "Description": "Payment"}],
      "rightDocument": [{"Amount": 100, "Date": "2024-01-01", "Description": "Payment"}]
    },
    "context": {
      "matching_rules": []
    }
  }'
```

### Step 3: Deploy to AWS

```bash
# Run the deployment script
python deploy.py YOUR_AWS_ACCOUNT_ID us-east-1

# Follow the prompts to build and push the Docker image
```

### Step 4: Configure CloFast

Update your CloFast server `.env` file:

```env
AWS_BEDROCK_AGENTCORE_RUNTIME_URL=https://your-runtime-url.amazonaws.com
AWS_BEDROCK_AGENT_ID=clofast-reconciliation-agent
AWS_BEDROCK_SESSION_ID=reconciliation-session
```

## API Contract

### Request Format

```json
{
  "prompt": "Reconcile financial documents",
  "context": {
    "profile": {
      "profileName": "Monthly Reconciliation",
      "profileDescription": "POS vs Bank Statement"
    },
    "extraction_rules": [...],
    "matching_rules": [
      {
        "matchingRuleName": "Amount and Date",
        "rules": [
          {"term1": "Amount", "term2": "Amount"},
          {"term1": "Date", "term2": "TransactionDate"}
        ]
      }
    ]
  },
  "data": {
    "leftDocument": [...],
    "rightDocument": [...]
  },
  "sessionId": "unique-session-id"
}
```

### Response Format

```json
{
  "reconciliationResults": [
    {
      "leftTransaction": {...},
      "rightTransaction": {...},
      "isReconciled": true,
      "matchedFields": ["Amount (Exact)", "Date (Same Day)"],
      "confidence": 95.0,
      "aiReasoning": "Excellent match (95.0%) with strong alignment...",
      "discrepancies": []
    }
  ],
  "summary": {
    "totalTransactions": 100,
    "reconciledCount": 85,
    "unreconciledCount": 15,
    "confidenceScore": 87.5
  },
  "metadata": {
    "processedBy": "AWS Bedrock AgentCore",
    "timestamp": "2024-01-01T12:00:00Z",
    "sessionId": "unique-session-id"
  }
}
```

## Monitoring

The agent includes comprehensive logging and health checks:

- **Health Endpoint**: `/ping` returns agent status
- **CloudWatch Logs**: Automatic logging integration
- **Metrics**: Built-in observability through AWS Bedrock AgentCore

## Troubleshooting

### Common Issues

1. **Container Build Fails**: Ensure you're building for ARM64 platform
2. **Deployment Timeout**: Check IAM permissions and network configuration
3. **Agent Not Responding**: Verify container is listening on port 8080
4. **Low Match Confidence**: Review matching rules and data quality

### Debug Mode

Enable detailed logging by setting log level in the container:

```bash
docker run -e LOG_LEVEL=DEBUG your-agent-image
```

## Security

- **Non-root User**: Container runs as non-privileged user
- **IAM Roles**: Uses AWS IAM for secure access
- **Network Isolation**: Configurable network modes
- **Input Validation**: Comprehensive request validation

## Performance

- **Optimized Matching**: Efficient algorithms for large datasets
- **Memory Management**: Streaming processing for large documents
- **Scalability**: Auto-scaling through AWS Bedrock AgentCore
- **Caching**: Session-based caching for repeated operations

## Support

For issues with the agent:
1. Check CloudWatch logs for detailed error messages
2. Verify AWS Bedrock AgentCore permissions
3. Test locally before deploying to AWS
4. Review the AWS Bedrock AgentCore documentation