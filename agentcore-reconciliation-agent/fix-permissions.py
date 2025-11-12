#!/usr/bin/env python3
"""
Fix IAM permissions for the AgentCore role
"""

import boto3
import json
import sys

def fix_agentcore_permissions(account_id: str, region: str = "us-east-1"):
    """Add ECR permissions to the AgentCore role"""
    
    role_name = "CloFastAgentCoreRole"
    
    print(f"🔧 Fixing permissions for {role_name}")
    
    iam_client = boto3.client('iam', region_name=region)
    
    # ECR permissions policy
    ecr_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": f"arn:aws:logs:{region}:{account_id}:*"
            }
        ]
    }
    
    try:
        # Add the ECR policy to the role
        iam_client.put_role_policy(
            RoleName=role_name,
            PolicyName="AgentCoreECRPolicy",
            PolicyDocument=json.dumps(ecr_policy)
        )
        
        print(f"✅ Added ECR permissions to {role_name}")
        print("🚀 Now you can run the deployment again!")
        
    except Exception as e:
        print(f"❌ Failed to update permissions: {str(e)}")
        sys.exit(1)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python fix-permissions.py <account-id> [region]")
        print("Example: python fix-permissions.py 123456789012 us-east-1")
        sys.exit(1)
    
    account_id = sys.argv[1]
    region = sys.argv[2] if len(sys.argv) > 2 else "us-east-1"
    
    fix_agentcore_permissions(account_id, region)

if __name__ == "__main__":
    main()