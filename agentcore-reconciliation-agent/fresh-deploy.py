#!/usr/bin/env python3
"""
Fresh deployment script for CloFast Reconciliation Agent
"""

import boto3
import json
import sys
import time
import uuid

def deploy_fresh_agent(account_id: str, region: str = "us-east-1"):
    """Deploy a fresh AgentCore runtime"""
    
    # Generate unique agent name to avoid conflicts
    unique_suffix = str(uuid.uuid4())[:8]
    agent_name = f"clofastAgent{unique_suffix}"
    repo_name = "clofast-reconciliation-agent"
    role_name = "CloFastAgentCoreRole"
    container_uri = f"{account_id}.dkr.ecr.{region}.amazonaws.com/{repo_name}:latest"
    role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"
    
    print(f"🚀 Deploying Fresh CloFast Reconciliation Agent")
    print(f"📍 Region: {region}")
    print(f"🏢 Account: {account_id}")
    print(f"🤖 Agent Name: {agent_name}")
    print(f"🐳 Container: {container_uri}")
    print(f"🔐 Role: {role_arn}")
    print("-" * 60)
    
    try:
        client = boto3.client('bedrock-agentcore-control', region_name=region)
        
        print("🚀 Creating fresh AgentCore Runtime...")
        response = client.create_agent_runtime(
            agentRuntimeName=agent_name,
            agentRuntimeArtifact={
                'containerConfiguration': {
                    'containerUri': container_uri
                }
            },
            networkConfiguration={"networkMode": "PUBLIC"},
            roleArn=role_arn,
            description=f'CloFast Financial Reconciliation Agent - {unique_suffix}'
        )
        
        print(f"✅ Agent Runtime created successfully!")
        print(f"🔗 Runtime ARN: {response['agentRuntimeArn']}")
        
        # Extract runtime ID from ARN
        agent_runtime_arn = response['agentRuntimeArn']
        agent_runtime_id = agent_runtime_arn.split('/')[-1]
        
        print(f"🆔 Runtime ID: {agent_runtime_id}")
        print("⏳ Waiting for agent to become active...")
        
        # Wait for deployment to be active
        for attempt in range(30):  # Wait up to 15 minutes
            try:
                status_response = client.get_agent_runtime(agentRuntimeId=agent_runtime_id)
                status = status_response.get('status', 'UNKNOWN')
                print(f"📊 Attempt {attempt + 1}/30 - Status: {status}")
                
                if status == 'ACTIVE':
                    runtime_url = status_response.get('agentRuntimeUrl', '')
                    print(f"\n🎉 Agent is now ACTIVE!")
                    print(f"🌐 Runtime URL: {runtime_url}")
                    print(f"\n📝 Update your CloFast server/.env file with:")
                    print(f"AWS_BEDROCK_AGENTCORE_RUNTIME_URL={runtime_url}")
                    print(f"AWS_BEDROCK_AGENT_ID={agent_name}")
                    print(f"AWS_BEDROCK_SESSION_ID=reconciliation-session")
                    
                    # Test the endpoint
                    print(f"\n🧪 Test your agent with:")
                    print(f"curl -X POST {runtime_url}/invocations \\")
                    print(f'  -H "Content-Type: application/json" \\')
                    print(f'  -d \'{{"prompt": "Test reconciliation", "data": {{"leftDocument": [], "rightDocument": []}}}}\'')
                    
                    return
                elif status in ['FAILED', 'STOPPED']:
                    print(f"❌ Agent deployment failed with status: {status}")
                    
                    # Get failure reason if available
                    failure_reason = status_response.get('failureReason', 'No failure reason provided')
                    print(f"💥 Failure reason: {failure_reason}")
                    return
                
                time.sleep(30)  # Wait 30 seconds between checks
                
            except Exception as e:
                print(f"⚠️ Error checking status (attempt {attempt + 1}): {str(e)}")
                time.sleep(30)
        
        print("⏰ Timeout waiting for agent to become active")
        print("🔍 Check the AWS Console for more details:")
        print(f"https://console.aws.amazon.com/bedrock/home?region={region}#/agentcore/runtimes")
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        
        # If it's a validation error, provide helpful info
        if 'ValidationException' in str(e):
            print("\n💡 Common issues:")
            print("1. Check that the ECR image exists and is accessible")
            print("2. Verify IAM role has correct permissions")
            print("3. Ensure agent name follows naming rules (letters, numbers, underscores only)")
        
        sys.exit(1)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python fresh-deploy.py <account-id> [region]")
        print("Example: python fresh-deploy.py 123456789012 us-east-1")
        sys.exit(1)
    
    account_id = sys.argv[1]
    region = sys.argv[2] if len(sys.argv) > 2 else "us-east-1"
    
    deploy_fresh_agent(account_id, region)

if __name__ == "__main__":
    main()