#!/usr/bin/env python3
"""
Check AWS Bedrock AgentCore agent logs
"""
import boto3
import json
from datetime import datetime, timedelta

def check_agent_logs():
    """Check CloudWatch logs for the AgentCore agent"""
    
    # Initialize CloudWatch Logs client
    logs_client = boto3.client('logs', region_name='us-west-2')
    
    # Agent name from deployment
    agent_name = "clofast_reconciliation_agent"
    
    # Look for log groups related to our agent
    try:
        log_groups = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/aws/bedrock/agentcore/{agent_name}'
        )
        
        print(f"🔍 Found {len(log_groups['logGroups'])} log groups:")
        for group in log_groups['logGroups']:
            print(f"  📁 {group['logGroupName']}")
            
            # Get recent log events
            try:
                # Get logs from the last hour
                start_time = int((datetime.now() - timedelta(hours=1)).timestamp() * 1000)
                
                streams = logs_client.describe_log_streams(
                    logGroupName=group['logGroupName'],
                    orderBy='LastEventTime',
                    descending=True,
                    limit=5
                )
                
                for stream in streams['logStreams']:
                    print(f"    📄 Stream: {stream['logStreamName']}")
                    
                    events = logs_client.get_log_events(
                        logGroupName=group['logGroupName'],
                        logStreamName=stream['logStreamName'],
                        startTime=start_time
                    )
                    
                    for event in events['events'][-10:]:  # Last 10 events
                        timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
                        print(f"      🕐 {timestamp}: {event['message']}")
                        
            except Exception as e:
                print(f"    ❌ Error reading stream: {e}")
                
    except Exception as e:
        print(f"❌ Error accessing logs: {e}")
        
    # Also check general AgentCore logs
    try:
        general_logs = logs_client.describe_log_groups(
            logGroupNamePrefix='/aws/bedrock/agentcore'
        )
        
        print(f"\n🔍 General AgentCore log groups ({len(general_logs['logGroups'])}):")
        for group in general_logs['logGroups']:
            print(f"  📁 {group['logGroupName']}")
            
    except Exception as e:
        print(f"❌ Error accessing general logs: {e}")

def check_agent_status():
    """Check the current status of our AgentCore agent"""
    
    # Initialize Bedrock AgentCore client
    agentcore_client = boto3.client('bedrock-agentcore', region_name='us-west-2')
    
    try:
        # List agent runtimes
        response = agentcore_client.list_agent_runtimes()
        
        print(f"\n🤖 Found {len(response.get('agentRuntimes', []))} agent runtimes:")
        
        for runtime in response.get('agentRuntimes', []):
            print(f"  🔧 Runtime ARN: {runtime.get('agentRuntimeArn')}")
            print(f"     Status: {runtime.get('status')}")
            print(f"     Created: {runtime.get('createdAt')}")
            print(f"     Updated: {runtime.get('updatedAt')}")
            
            # Get detailed info
            try:
                details = agentcore_client.get_agent_runtime(
                    agentRuntimeArn=runtime.get('agentRuntimeArn')
                )
                print(f"     Details: {json.dumps(details, indent=2, default=str)}")
            except Exception as e:
                print(f"     ❌ Error getting details: {e}")
                
    except Exception as e:
        print(f"❌ Error checking agent status: {e}")

if __name__ == "__main__":
    print("🔍 Checking AgentCore agent logs and status...")
    check_agent_logs()
    check_agent_status()