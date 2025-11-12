#!/usr/bin/env python3
"""
Deploy CloFast Reconciliation Agent using bedrock_agentcore_starter_toolkit
Following the example pattern from the GitHub repository
"""

from bedrock_agentcore_starter_toolkit import Runtime
from boto3.session import Session
import json
import sys

def deploy_agent(account_id: str, region: str = "us-east-1"):
    """Deploy the agent using the starter toolkit"""
    
    print(f"🚀 Deploying CloFast Reconciliation Agent using Starter Toolkit")
    print(f"📍 Region: {region}")
    print(f"🏢 Account: {account_id}")
    print("-" * 60)
    
    try:
        # Set up boto session
        boto_session = Session()
        
        # Create runtime instance
        agentcore_runtime = Runtime()
        
        # Configure the agent
        agent_name = "clofast_reconciliation_agent"
        
        print("⚙️ Configuring agent runtime...")
        response = agentcore_runtime.configure(
            entrypoint="agent.py",
            auto_create_execution_role=True,
            auto_create_ecr=True,
            requirements_file="requirements.txt",
            region=region,
            agent_name=agent_name
        )
        
        print("✅ Agent configured successfully!")
        print(f"📋 Configuration response: {response}")
        
        # Test the agent with a sample payload
        print("\n🧪 Testing the deployed agent...")
        test_payload = {
            "prompt": "Please reconcile these financial documents",
            "context": {
                "profile": {
                    "profileName": "Test Reconciliation",
                    "profileDescription": "Testing the CloFast agent"
                },
                "matching_rules": []
            },
            "data": {
                "leftDocument": [
                    {"Amount": 100.00, "Date": "2024-01-01", "Description": "Test Payment", "ReferenceId": "REF001"}
                ],
                "rightDocument": [
                    {"Amount": 100.00, "Date": "2024-01-01", "Description": "Test Payment", "ReferenceId": "REF001"}
                ]
            }
        }
        
        invoke_response = agentcore_runtime.invoke(test_payload)
        print("✅ Test invocation successful!")
        print(f"📝 Response: {invoke_response}")
        
        # Get the agent ARN for future use
        if hasattr(response, 'agent_arn'):
            agent_arn = response.agent_arn
            print(f"\n🔗 Agent ARN: {agent_arn}")
            
            # Provide configuration for CloFast
            print(f"\n📝 Update your CloFast server/.env file with:")
            print(f"AWS_BEDROCK_AGENTCORE_RUNTIME_URL=<runtime-url-from-response>")
            print(f"AWS_BEDROCK_AGENT_ID={agent_name}")
            print(f"AWS_BEDROCK_SESSION_ID=reconciliation-session")
        
        print(f"\n🎉 Deployment completed successfully!")
        print(f"🤖 Agent Name: {agent_name}")
        print(f"📍 Region: {region}")
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        
        # Provide troubleshooting info
        print("\n💡 Troubleshooting tips:")
        print("1. Ensure AWS credentials are configured correctly")
        print("2. Check that you have the required permissions for Bedrock AgentCore")
        print("3. Verify the region supports Bedrock AgentCore")
        print("4. Make sure all dependencies are installed:")
        print("   pip install bedrock-agentcore bedrock-agentcore-starter-toolkit strands-agents")
        
        sys.exit(1)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python deploy_with_toolkit.py <account-id> [region]")
        print("Example: python deploy_with_toolkit.py 123456789012 us-east-1")
        sys.exit(1)
    
    account_id = sys.argv[1]
    region = sys.argv[2] if len(sys.argv) > 2 else "us-east-1"
    
    deploy_agent(account_id, region)

if __name__ == "__main__":
    main()