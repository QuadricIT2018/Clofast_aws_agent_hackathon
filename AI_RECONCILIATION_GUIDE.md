# 🤖 AI-Powered Reconciliation with AWS Bedrock AgentCore

## Overview

CloFast now integrates with **AWS Bedrock AgentCore** to provide intelligent, AI-powered document reconciliation. This enhancement leverages AWS's managed AI infrastructure to add advanced pattern recognition, semantic matching, and confidence scoring to the existing reconciliation system.

## How It Works

### 1. AWS Bedrock AgentCore Integration
- **Primary**: Connects to AWS Bedrock AgentCore via the `/invocations` endpoint
- **Protocol**: HTTP-based communication following AWS AgentCore service contract
- **Fallback**: Enhanced AI-like reconciliation logic when AgentCore is unavailable
- **Backup**: Basic rule-based matching as final fallback

### 2. AI-Enhanced Matching
The AI system performs sophisticated matching using:
- **Exact Field Matching**: Direct comparison based on user-defined rules
- **Fuzzy Amount Matching**: Handles rounding differences and currency variations
- **Date Proximity Matching**: Matches transactions within configurable time windows
- **Semantic Description Analysis**: Uses NLP to match similar transaction descriptions
- **Confidence Scoring**: Provides 0-100% confidence for each match

### 3. Enhanced User Experience
- **Real-time AI Processing**: Visual feedback during AI analysis
- **Confidence Indicators**: Color-coded confidence scores for each match
- **AI Reasoning**: Detailed explanations for match decisions
- **Discrepancy Detection**: AI-identified issues with unmatched transactions

## Configuration

### Environment Variables
```env
# AWS Bedrock AgentCore Configuration
AWS_BEDROCK_AGENTCORE_RUNTIME_URL=https://your-agentcore-runtime.amazonaws.com
AWS_BEDROCK_AGENT_ID=your_agent_id_here
AWS_BEDROCK_SESSION_ID=reconciliation-session

# AWS Credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Fallback Gemini Configuration
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent
GEMINI_API_KEY=your_gemini_api_key_here
```

### AWS Bedrock AgentCore Setup
1. Deploy your reconciliation agent to AWS Bedrock AgentCore
2. Configure the agent with the required service contract:
   - Container listening on port 8080
   - `/invocations` endpoint for processing requests
   - `/ping` endpoint for health checks
3. Set up IAM permissions for AgentCore Runtime
4. Configure the runtime URL and agent ID in environment variables

## Usage Flow

### 1. Profile Setup
- Create a profile with documents and matching rules
- Upload financial documents (POS data, bank statements, etc.)
- Define extraction rules for data parsing
- Set up matching rules for field correlation

### 2. AI Reconciliation
- Click "Run" button to start AI reconciliation
- AWS Bedrock AgentCore analyzes documents using:
  - Profile context and description
  - Extraction rules for data understanding
  - Matching rules for field correlation
  - Advanced AI algorithms powered by AWS Bedrock models
  - Managed infrastructure for scalable processing

### 3. Results Analysis
- View reconciled/unreconciled transactions
- Check confidence scores for each match
- Review AI reasoning for decisions
- Investigate discrepancies for unmatched items

## API Integration

### Request Format
```typescript
interface ReconciliationRequest {
  leftDocument: any[];
  rightDocument: any[];
  extractionRules: any[];
  matchingRules: any[];
  profileContext: {
    profileName: string;
    profileDescription: string;
  };
}
```

### Response Format
```typescript
interface AgentCoreResponse {
  reconciliationResults: Array<{
    leftTransaction: any;
    rightTransaction: any | null;
    isReconciled: boolean;
    matchedFields?: string[];
    confidence?: number;
    aiReasoning?: string;
    discrepancies?: string[];
  }>;
  summary: {
    totalTransactions: number;
    reconciledCount: number;
    unreconciledCount: number;
    confidenceScore: number;
  };
}
```

## Development & Testing

### Enhanced Fallback Service
For development and when AWS Bedrock AgentCore is unavailable, the system includes an enhanced AI-like fallback service:
- Sophisticated confidence scoring algorithms
- Multi-criteria matching logic (amount, date, description, reference)
- Semantic similarity analysis
- Detailed reasoning generation
- Graceful degradation from AWS services

### Testing the Integration
1. Start the server: `npm run dev`
2. Create a profile with sample documents
3. Set up matching rules
4. Click "Run" to test AI reconciliation
5. Review results with confidence scores and AI reasoning

## Benefits

### For Users
- **Higher Accuracy**: AI reduces false positives and negatives
- **Faster Processing**: Automated analysis of complex patterns
- **Better Insights**: Detailed explanations for each decision
- **Confidence Metrics**: Know which matches to trust

### For Developers
- **Modular Design**: Easy to swap AI backends
- **Graceful Fallbacks**: System works even if AI services fail
- **Rich Metadata**: Comprehensive reconciliation analytics
- **Extensible**: Easy to add new AI capabilities

## Future Enhancements

- **Learning from Feedback**: Train AI on user corrections
- **Custom Confidence Thresholds**: User-configurable matching criteria
- **Batch Processing**: Handle large document sets efficiently
- **Advanced Analytics**: Trend analysis and anomaly detection
- **Multi-language Support**: Handle international documents

## Agent Deployment

### Deploy the Reconciliation Agent

1. **Navigate to the agent directory**:
   ```bash
   cd agentcore-reconciliation-agent
   ```

2. **Test locally**:
   ```bash
   python agent.py
   curl http://localhost:8080/ping
   ```

3. **Deploy to AWS**:
   ```bash
   python deploy.py YOUR_AWS_ACCOUNT_ID us-east-1
   ```

4. **Update CloFast configuration** with the runtime URL from deployment

## Troubleshooting

### Common Issues
1. **AgentCore Connection Failed**: Check runtime URL and agent ID configuration
2. **Low Confidence Scores**: Review matching rules and data quality
3. **Slow Processing**: Consider document size and complexity
4. **Deployment Issues**: Verify IAM permissions and ARM64 container build

### Debug Mode
Enable detailed logging in the agent container:
```bash
docker run -e LOG_LEVEL=DEBUG your-agent-image
```

## Support

For issues with:
- **AWS Bedrock AgentCore**: Check AWS documentation and CloudWatch logs
- **CloFast Application**: Review application logs and configuration
- **Agent Deployment**: See `agentcore-reconciliation-agent/README.md` for detailed troubleshooting