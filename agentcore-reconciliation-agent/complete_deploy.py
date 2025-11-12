#!/usr/bin/env python3
"""
Complete deployment script for CloFast Reconciliation Agent
Configures and launches the agent using bedrock_agentcore_starter_toolkit
"""

from bedrock_agentcore_starter_toolkit import Runtime
from boto3.session import Session
import json
import sys

def deploy_complete_agent(account_id: str, region: str = "us-west-2"):
    """Complete deployment: configure and launch the agent with enhanced Excel support"""
    
    print(f"🚀 Complete Deployment of CloFast Reconciliation Agent")
    print(f"📍 Region: {region}")
    print(f"🏢 Account: {account_id}")
    print(f"📊 Features: PDF Text Extraction, Excel Processing, AI Reconciliation")
    print("-" * 70)
    
    try:
        # Set up boto session
        boto_session = Session()
        
        # Create runtime instance
        agentcore_runtime = Runtime()
        
        # Step 1: Configure the agent
        agent_name = "clofast_reconciliation_agent"
        
        print("⚙️ Step 1: Configuring agent runtime...")
        config_response = agentcore_runtime.configure(
            entrypoint="agent.py",
            auto_create_execution_role=True,
            auto_create_ecr=True,
            requirements_file="requirements.txt",
            region=region,
            agent_name=agent_name
        )
        
        print("✅ Agent configured successfully!")
        print(f"📋 Configuration: {config_response}")
        
        # Step 2: Launch the agent
        print("\n🚀 Step 2: Launching agent to AWS Bedrock AgentCore...")
        launch_result = agentcore_runtime.launch()
        
        print("✅ Agent launched successfully!")
        print(f"📋 Launch result: {launch_result}")
        
        # Step 3: Test the agent with multiple scenarios
        print("\n🧪 Step 3: Testing the deployed agent...")
        
        # Test 1: Reconciliation test
        print("📋 Test 1: Reconciliation functionality...")
        reconciliation_payload = {
            "operation": "reconcile",
            "prompt": "Please reconcile these financial documents using AI analysis",
            "context": {
                "profile": {
                    "profileName": "Test Reconciliation",
                    "profileDescription": "Testing the CloFast AI reconciliation agent"
                },
                "matching_rules": [
                    {
                        "matchingRuleName": "Amount and Reference",
                        "rules": [
                            {"term1": "Amount", "term2": "Amount"},
                            {"term1": "ReferenceId", "term2": "ReferenceId"}
                        ]
                    }
                ]
            },
            "data": {
                "leftDocument": [
                    {
                        "Amount": 100.00, 
                        "Date": "2024-01-01", 
                        "Description": "Test Payment", 
                        "ReferenceId": "REF001"
                    },
                    {
                        "Amount": 250.50, 
                        "Date": "2024-01-02", 
                        "Description": "Service Fee", 
                        "ReferenceId": "REF002"
                    }
                ],
                "rightDocument": [
                    {
                        "Amount": 100.00, 
                        "Date": "2024-01-01", 
                        "Description": "Test Payment", 
                        "ReferenceId": "REF001"
                    },
                    {
                        "Amount": 250.50, 
                        "Date": "2024-01-03", 
                        "Description": "Service Charge", 
                        "ReferenceId": "REF002"
                    }
                ]
            }
        }
        
        reconciliation_response = agentcore_runtime.invoke(reconciliation_payload)
        print("✅ Reconciliation test successful!")
        print(f"📝 Response preview: {str(reconciliation_response)[:300]}...")
        
        # Test 2: Extraction test (simulated)
        print("\n📋 Test 2: Extraction functionality...")
        extraction_payload = {
            "operation": "extract",
            "context": {
                "profile": {
                    "profileName": "Test Extraction",
                    "profileDescription": "Testing document extraction"
                },
                "extraction_rules": [
                    {
                        "extractionRuleName": "Financial Data",
                        "terms": ["Date", "Amount", "Description"]
                    }
                ]
            },
            "data": {
                "documentUrl": "https://example.com/test-document.pdf",
                "documentName": "test-document.pdf",
                "hasImage": False
            }
        }
        
        try:
            extraction_response = agentcore_runtime.invoke(extraction_payload)
            print("✅ Extraction test completed!")
            print(f"📝 Response preview: {str(extraction_response)[:300]}...")
        except Exception as extraction_error:
            print(f"⚠️ Extraction test failed (expected for demo): {extraction_error}")
            print("   This is normal - the test URL doesn't exist")
        
        print("\n✅ All tests completed!")
        
        # Step 4: Provide configuration details
        print(f"\n🎉 Deployment completed successfully!")
        print(f"🤖 Agent Name: {agent_name}")
        print(f"📍 Region: {region}")
        print(f"📊 Capabilities: Excel (.xlsx, .xls), PDF, AI Reconciliation")
        
        # Get agent details for CloFast configuration
        if hasattr(launch_result, 'agent_arn'):
            agent_arn = launch_result.agent_arn
            print(f"🔗 Agent ARN: {agent_arn}")
            
            print(f"\n📝 Update your CloFast server/.env file with:")
            print(f"# AWS Bedrock AgentCore Configuration (Enhanced)")
            print(f"AWS_BEDROCK_AGENT_ARN={agent_arn}")
            print(f"AWS_BEDROCK_AGENT_ID={agent_name}")
            print(f"AWS_BEDROCK_SESSION_ID=reconciliation-session-{account_id}")
            print(f"AWS_REGION={region}")
        
        # Enhanced usage instructions
        print(f"\n📚 Enhanced Usage Instructions:")
        print(f"1. 🚀 The agent is deployed with full Excel and PDF support")
        print(f"2. 📝 Update your CloFast backend with the configuration above")
        print(f"3. 📊 Excel Processing Features:")
        print(f"   - Multi-sheet support with automatic sheet selection")
        print(f"   - Enhanced data type handling (dates, numbers, text)")
        print(f"   - Fuzzy column matching for extraction rules")
        print(f"   - Data quality scoring and confidence metrics")
        print(f"4. 📄 PDF Processing Features:")
        print(f"   - Text extraction with pattern recognition")
        print(f"   - Financial transaction identification")
        print(f"   - Summary data extraction")
        print(f"5. 🤖 AI Reconciliation Features:")
        print(f"   - Intelligent transaction matching")
        print(f"   - Confidence scoring with AI reasoning")
        print(f"   - Discrepancy analysis and reporting")
        print(f"6. 📡 API Operations:")
        print(f"   - extract: Process documents (Excel/PDF)")
        print(f"   - reconcile: Match transactions between documents")
        print(f"7. 🔧 Integration:")
        print(f"   - Works with CloFast frontend and backend")
        print(f"   - Supports extraction rules and matching rules")
        print(f"   - Returns structured JSON responses")
        
        return launch_result
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        
        # Provide detailed troubleshooting info
        print("\n💡 Troubleshooting tips:")
        print("1. Ensure AWS credentials are configured correctly:")
        print("   aws configure list")
        print("2. Check that you have the required permissions:")
        print("   - bedrock:*")
        print("   - iam:CreateRole, iam:AttachRolePolicy")
        print("   - ecr:CreateRepository, ecr:GetAuthorizationToken")
        print("   - logs:CreateLogGroup")
        print("3. Verify the region supports Bedrock AgentCore")
        print("4. Check if all dependencies are properly installed")
        print("5. Look for any .bedrock_agentcore.yaml configuration issues")
        
        sys.exit(1)

def main():
    """Main function with enhanced argument handling"""
    if len(sys.argv) < 2:
        print("🚀 CloFast Reconciliation Agent - AWS Bedrock Deployment")
        print("=" * 60)
        print("Usage: python complete_deploy.py <account-id> [region]")
        print("\nExamples:")
        print("  python complete_deploy.py 123456789012")
        print("  python complete_deploy.py 123456789012 us-west-2")
        print("  python complete_deploy.py 123456789012 ap-southeast-1")
        print("\nSupported Regions:")
        print("  - us-west-2 (Oregon) - Recommended")
        print("  - us-east-1 (N. Virginia)")
        print("  - ap-southeast-1 (Singapore)")
        print("  - eu-west-1 (Ireland)")
        print("\nFeatures:")
        print("  ✅ Excel file processing (.xlsx, .xls)")
        print("  ✅ PDF text extraction and analysis")
        print("  ✅ AI-powered transaction reconciliation")
        print("  ✅ Confidence scoring and reasoning")
        print("  ✅ Integration with CloFast platform")
        sys.exit(1)
    
    account_id = sys.argv[1]
    region = sys.argv[2] if len(sys.argv) > 2 else "us-west-2"
    
    # Validate region
    supported_regions = ["us-west-2", "us-east-1", "ap-southeast-1", "eu-west-1"]
    if region not in supported_regions:
        print(f"⚠️ Warning: Region '{region}' may not support all Bedrock features")
        print(f"Recommended regions: {', '.join(supported_regions)}")
        
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Deployment cancelled")
            sys.exit(1)
    
    deploy_complete_agent(account_id, region)

if __name__ == "__main__":
    main()