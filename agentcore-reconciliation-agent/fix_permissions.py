#!/usr/bin/env python3
"""
Fix IAM permissions for AWS Bedrock AgentCore access
"""
import boto3
import json
import sys
from botocore.exceptions import ClientError

def create_agentcore_policy():
    """Create IAM policy for Bedrock AgentCore access"""
    
    # Initialize IAM client
    iam = boto3.client('iam')
    
    # Policy document
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "bedrock-agentcore:InvokeAgentRuntime",
                    "bedrock-agentcore:GetAgentRuntime",
                    "bedrock-agentcore:ListAgentRuntimes"
                ],
                "Resource": "*"
            }
        ]
    }
    
    policy_name = "BedrockAgentCoreAccess"
    
    try:
        # Create the policy
        response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description="Allows access to AWS Bedrock AgentCore runtime operations"
        )
        
        policy_arn = response['Policy']['Arn']
        print(f"✅ Created policy: {policy_arn}")
        return policy_arn
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'EntityAlreadyExists':
            # Policy already exists, get its ARN
            account_id = boto3.client('sts').get_caller_identity()['Account']
            policy_arn = f"arn:aws:iam::{account_id}:policy/{policy_name}"
            print(f"ℹ️  Policy already exists: {policy_arn}")
            return policy_arn
        else:
            print(f"❌ Error creating policy: {e}")
            return None

def attach_policy_to_user(policy_arn, username):
    """Attach policy to IAM user"""
    
    iam = boto3.client('iam')
    
    try:
        iam.attach_user_policy(
            UserName=username,
            PolicyArn=policy_arn
        )
        print(f"✅ Attached policy to user: {username}")
        return True
        
    except ClientError as e:
        print(f"❌ Error attaching policy to user: {e}")
        return False

def main():
    print("🔧 Fixing IAM permissions for Bedrock AgentCore...")
    
    # Create the policy
    policy_arn = create_agentcore_policy()
    if not policy_arn:
        sys.exit(1)
    
    # Attach to s3-uploader user
    username = "s3-uploader"
    success = attach_policy_to_user(policy_arn, username)
    
    if success:
        print(f"\n✅ Successfully granted Bedrock AgentCore permissions to user: {username}")
        print("🚀 You can now test the AgentCore integration!")
    else:
        print(f"\n❌ Failed to attach policy to user: {username}")
        sys.exit(1)

if __name__ == "__main__":
    main()