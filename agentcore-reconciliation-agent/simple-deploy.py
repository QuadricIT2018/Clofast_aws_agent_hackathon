#!/usr/bin/env python3
"""
Simple deployment script for CloFast Reconciliation Agent to AWS Bedrock AgentCore
Uses the existing Docker image that was already pushed to ECR
"""

import boto3
import json
import sys
import time

def deploy_agent_runtime(account_id: str, region: str = "us-east-1"):
    """Deploy the agent to AWS Bedrock AgentCore Runtime using existing image"""
    
    # Configuration
    agent_name = "clofastReconciliationAgent"
    repo_name = "clofast-reconciliation-agent"
    role_name = "CloFastAgentCoreRole"
    container_uri = f"{account_id}.dkr.ecr.{region}.amazonaws.com/{repo_name}:latest"
    role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"
    
    print(f"🚀 Deploying CloFast Reconciliation Agent to AWS Bedrock AgentCore")
    print(f"📍 Region: {region}")
    print(f"🏢 Account: {account_id}")
    print(f"🐳 Container: {container_uri}")
    print(f"🔐 Role: {role_arn}")
    print("-" * 60)
    
    try:
        client = boto3.client('bedrock-agentcore-control', region_name=region)
        
        # Try to create the agent runtime
        try:
            print("🚀 Creating AgentCore Runtime...")
            response = client.create_agent_runtime(
                agentRuntimeName=agent_name,
                agentRuntimeArtifact={
                    'containerConfiguration': {
                        'containerUri': container_uri
                    }
                },
                networkConfiguration={"networkMode": "PUBLIC"},
                roleArn=role_arn,
                description='CloFast Financial Reconciliation Agent powered by AWS Bedrock AgentCore'
            )
            
            print(f"✅ Agent Runtime created successfully!")
            print(f"🔗 Runtime ARN: {response['agentRuntimeArn']}")
            
            # Wait for deployment to be active
            print("⏳ Waiting for agent to become active...")
            agent_runtime_arn = response['agentRuntimeArn']
            # Extract the runtime ID from the ARN (last part after the last /)
            agent_runtime_id = agent_runtime_arn.split('/')[-1]
            
            for i in range(20):  # Wait up to 10 minutes
                try:
                    status_response = client.get_agent_runtime(agentRuntimeId=agent_runtime_id)
                    status = status_response.get('status', 'UNKNOWN')
                    print(f"📊 Status: {status}")
                    
                    if status == 'ACTIVE':
                        runtime_url = status_response.get('agentRuntimeUrl', '')
                        print(f"\n🎉 Agent is now ACTIVE!")
                        print(f"🌐 Runtime URL: {runtime_url}")
                        print(f"\n📝 Update your CloFast server/.env file:")
                        print(f"AWS_BEDROCK_AGENTCORE_RUNTIME_URL={runtime_url}")
                        print(f"AWS_BEDROCK_AGENT_ID={agent_name}")
                        print(f"AWS_BEDROCK_SESSION_ID=reconciliation-session")
                        return
                    elif status in ['FAILED', 'STOPPED']:
                        print(f"❌ Agent deployment failed with status: {status}")
                        return
                    
                    time.sleep(30)  # Wait 30 seconds
                except Exception as e:
                    print(f"⚠️ Error checking status: {str(e)}")
                    time.sleep(30)
            
            print("⏰ Timeout waiting for agent to become active. Check AWS Console.")
            
        except Exception as e:
            if 'already exists' in str(e).lower():
                print("✅ Agent runtime already exists, getting runtime info...")
                try:
                    # List runtimes to find the existing one
                    list_response = client.list_agent_runtimes()
                    existing_runtime = None
                    for runtime in list_response.get('agentRuntimeSummaries', []):
                        if runtime.get('agentRuntimeName') == agent_name:
                            existing_runtime = runtime
                            break
                    
                    if existing_runtime:
                        runtime_id = existing_runtime.get('agentRuntimeId')
                        response = client.update_agent_runtime(
                            agentRuntimeId=runtime_id,
                            agentRuntimeArtifact={
                                'containerConfiguration': {
                                    'containerUri': container_uri
                                }
                            },
                            roleArn=role_arn,
                            networkConfiguration={"networkMode": "PUBLIC"}
                        )
                    else:
                        raise Exception("Could not find existing runtime to update")
                    print(f"✅ Agent Runtime updated successfully!")
                    print(f"🔗 Runtime ARN: {response['agentRuntimeArn']}")
                    
                    # Get the runtime URL using the agent name
                    list_response = client.list_agent_runtimes()
                    status_response = None
                    for runtime in list_response.get('agentRuntimeSummaries', []):
                        if runtime.get('agentRuntimeName') == agent_name:
                            runtime_id = runtime.get('agentRuntimeId')
                            status_response = client.get_agent_runtime(agentRuntimeId=runtime_id)
                            break
                    if status_response:
                        runtime_url = status_response.get('agentRuntimeUrl', '')
                        print(f"🌐 Runtime URL: {runtime_url}")
                        print(f"\n📝 Update your CloFast server/.env file:")
                        print(f"AWS_BEDROCK_AGENTCORE_RUNTIME_URL={runtime_url}")
                        print(f"AWS_BEDROCK_AGENT_ID={agent_name}")
                        print(f"AWS_BEDROCK_SESSION_ID=reconciliation-session")
                    else:
                        print("⚠️ Could not retrieve runtime URL")
                    
                except Exception as update_error:
                    print(f"❌ Failed to update agent runtime: {str(update_error)}")
                    raise
            else:
                print(f"❌ Failed to create agent runtime: {str(e)}")
                raise
                
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        sys.exit(1)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python simple-deploy.py <account-id> [region]")
        print("Example: python simple-deploy.py 123456789012 us-east-1")
        sys.exit(1)
    
    account_id = sys.argv[1]
    region = sys.argv[2] if len(sys.argv) > 2 else "us-west-2"
    
    deploy_agent_runtime(account_id, region)

if __name__ == "__main__":
    main()