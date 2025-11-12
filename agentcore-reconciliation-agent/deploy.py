#!/usr/bin/env python3
"""
Deploy script for CloFast Reconciliation Agent to AWS Bedrock AgentCore
"""

import boto3
import json
import sys
import time
from typing import Dict, Any

class AgentCoreDeployer:
    def __init__(self, region: str = "us-east-1"):
        self.region = region
        self.agentcore_client = boto3.client('bedrock-agentcore-control', region_name=region)
        self.ecr_client = boto3.client('ecr', region_name=region)
        self.iam_client = boto3.client('iam', region_name=region)
    
    def create_iam_role(self, role_name: str) -> str:
        """Create IAM role for AgentCore Runtime"""
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "bedrock-agentcore.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        try:
            response = self.iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description="IAM role for CloFast Reconciliation Agent in AWS Bedrock AgentCore"
            )
            
            # Attach necessary policies
            self.iam_client.attach_role_policy(
                RoleName=role_name,
                PolicyArn="arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
            )
            
            print(f"✅ Created IAM role: {response['Role']['Arn']}")
            return response['Role']['Arn']
            
        except self.iam_client.exceptions.EntityAlreadyExistsException:
            response = self.iam_client.get_role(RoleName=role_name)
            print(f"✅ Using existing IAM role: {response['Role']['Arn']}")
            return response['Role']['Arn']
    
    def create_ecr_repository(self, repo_name: str) -> str:
        """Create ECR repository for the agent image"""
        try:
            response = self.ecr_client.create_repository(
                repositoryName=repo_name,
                imageScanningConfiguration={'scanOnPush': True}
            )
            repo_uri = response['repository']['repositoryUri']
            print(f"✅ Created ECR repository: {repo_uri}")
            return repo_uri
            
        except self.ecr_client.exceptions.RepositoryAlreadyExistsException:
            response = self.ecr_client.describe_repositories(repositoryNames=[repo_name])
            repo_uri = response['repositories'][0]['repositoryUri']
            print(f"✅ Using existing ECR repository: {repo_uri}")
            return repo_uri
    
    def deploy_agent_runtime(self, agent_name: str, container_uri: str, role_arn: str) -> Dict[str, Any]:
        """Deploy the agent to AWS Bedrock AgentCore Runtime"""
        try:
            response = self.agentcore_client.create_agent_runtime(
                agentRuntimeName=agent_name,
                agentRuntimeArtifact={
                    'containerConfiguration': {
                        'containerUri': container_uri
                    }
                },
                networkConfiguration={"networkMode": "PUBLIC"},
                roleArn=role_arn,
                description="CloFast Financial Reconciliation Agent powered by AWS Bedrock AgentCore"
            )
            
            print(f"✅ Agent Runtime created: {response['agentRuntimeArn']}")
            print(f"📍 Runtime URL: {response.get('agentRuntimeUrl', 'Not available yet')}")
            
            return response
            
        except Exception as e:
            print(f"❌ Failed to create agent runtime: {str(e)}")
            raise
    
    def wait_for_deployment(self, agent_runtime_arn: str, timeout: int = 600) -> Dict[str, Any]:
        """Wait for agent deployment to complete"""
        print("⏳ Waiting for agent deployment to complete...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = self.agentcore_client.get_agent_runtime(
                    agentRuntimeArn=agent_runtime_arn
                )
                
                status = response.get('status', 'UNKNOWN')
                print(f"📊 Deployment status: {status}")
                
                if status == 'ACTIVE':
                    print("✅ Agent deployment completed successfully!")
                    return response
                elif status in ['FAILED', 'STOPPED']:
                    print(f"❌ Agent deployment failed with status: {status}")
                    return response
                
                time.sleep(30)  # Wait 30 seconds before checking again
                
            except Exception as e:
                print(f"⚠️ Error checking deployment status: {str(e)}")
                time.sleep(30)
        
        print(f"⏰ Deployment timeout after {timeout} seconds")
        return {}

def main():
    """Main deployment function"""
    if len(sys.argv) < 2:
        print("Usage: python deploy.py <account-id> [region]")
        print("Example: python deploy.py 123456789012 us-east-1")
        sys.exit(1)
    
    account_id = sys.argv[1]
    region = sys.argv[2] if len(sys.argv) > 2 else "us-east-1"
    
    # Configuration
    agent_name = "clofastReconciliationAgent"  # Fixed: no hyphens allowed
    repo_name = "clofast-reconciliation-agent"  # ECR allows hyphens
    role_name = "CloFastAgentCoreRole"
    
    print(f"🚀 Deploying CloFast Reconciliation Agent to AWS Bedrock AgentCore")
    print(f"📍 Region: {region}")
    print(f"🏢 Account: {account_id}")
    print("-" * 60)
    
    try:
        deployer = AgentCoreDeployer(region)
        
        # Step 1: Create IAM role
        print("1️⃣ Creating IAM role...")
        role_arn = deployer.create_iam_role(role_name)
        
        # Step 2: Create ECR repository
        print("2️⃣ Creating ECR repository...")
        repo_uri = deployer.create_ecr_repository(repo_name)
        
        # Step 3: Build and push Docker image
        print("3️⃣ Build and push Docker image manually:")
        print(f"   aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {account_id}.dkr.ecr.{region}.amazonaws.com")
        print(f"   docker buildx build --platform linux/arm64 -t {repo_uri}:latest --push .")
        print("   Press Enter when image is pushed...")
        input()
        
        # Step 4: Deploy agent runtime
        print("4️⃣ Deploying agent runtime...")
        container_uri = f"{repo_uri}:latest"
        deployment_response = deployer.deploy_agent_runtime(agent_name, container_uri, role_arn)
        
        # Step 5: Wait for deployment
        if 'agentRuntimeArn' in deployment_response:
            final_response = deployer.wait_for_deployment(deployment_response['agentRuntimeArn'])
            
            if final_response.get('status') == 'ACTIVE':
                print("\n🎉 Deployment completed successfully!")
                print(f"🔗 Agent Runtime ARN: {deployment_response['agentRuntimeArn']}")
                print(f"🌐 Runtime URL: {final_response.get('agentRuntimeUrl', 'Check AWS Console')}")
                print("\n📝 Update your .env file with:")
                print(f"AWS_BEDROCK_AGENTCORE_RUNTIME_URL={final_response.get('agentRuntimeUrl', 'https://your-runtime-url')}")
                print(f"AWS_BEDROCK_AGENT_ID={agent_name}")
            else:
                print("❌ Deployment failed. Check AWS Console for details.")
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()