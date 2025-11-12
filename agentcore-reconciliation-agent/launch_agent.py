#!/usr/bin/env python3
"""
Launch the configured CloFast Reconciliation Agent
"""

from bedrock_agentcore_starter_toolkit import Runtime
import json
import sys

def launch_agent():
    """Launch the configured agent"""
    
    print(f"🚀 Launching CloFast Reconciliation Agent")
    print("-" * 50)
    
    try:
        # Create runtime instance
        agentcore_runtime = Runtime()
        
        print("🚀 Launching agent to AWS Bedrock AgentCore...")
        launch_result = agentcore_runtime.launch()
        
        print("✅ Agent launched successfully!")
        print(f"📋 Launch result: {launch_result}")
        
        # Get the agent ARN
        if hasattr(launch_result, 'agent_arn'):
            agent_arn = launch_result.agent_arn
            print(f"\n🔗 Agent ARN: {agent_arn}")
            
            # Test the agent
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
            
            # Extract runtime URL if available
            if hasattr(launch_result, 'runtime_url'):
                runtime_url = launch_result.runtime_url
                print(f"\n📝 Update your CloFast server/.env file with:")
                print(f"AWS_BEDROCK_AGENTCORE_RUNTIME_URL={runtime_url}")
                print(f"AWS_BEDROCK_AGENT_ID=clofast_reconciliation_agent")
                print(f"AWS_BEDROCK_SESSION_ID=reconciliation-session")
            else:
                print(f"\n📝 Update your CloFast server/.env file with:")
                print(f"AWS_BEDROCK_AGENT_ARN={agent_arn}")
                print(f"AWS_BEDROCK_AGENT_ID=clofast_reconciliation_agent")
                print(f"AWS_BEDROCK_SESSION_ID=reconciliation-session")
        
        print(f"\n🎉 Deployment completed successfully!")
        
    except Exception as e:
        print(f"❌ Launch failed: {str(e)}")
        
        # Provide troubleshooting info
        print("\n💡 Troubleshooting tips:")
        print("1. Make sure you ran the configure step first")
        print("2. Check AWS credentials and permissions")
        print("3. Verify the region supports Bedrock AgentCore")
        print("4. Check the .bedrock_agentcore.yaml configuration file")
        
        sys.exit(1)

if __name__ == "__main__":
    launch_agent()