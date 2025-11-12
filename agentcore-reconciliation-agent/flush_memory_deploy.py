#!/usr/bin/env python3
"""
Flush agent memory and redeploy with fresh memory for real OCR extraction
"""
import boto3
import sys
from datetime import datetime

def delete_existing_memory():
    """Delete existing agent memory to start fresh"""
    try:
        # Initialize Bedrock AgentCore client
        client = boto3.client('bedrock-agentcore', region_name='us-west-2')
        
        # Try to delete existing memory
        memory_id = "clofast_reconciliation_agent_mem-tNnkrkEp4n"
        
        print(f"🗑️ Attempting to delete existing memory: {memory_id}")
        
        try:
            response = client.delete_memory(memoryId=memory_id)
            print(f"✅ Successfully deleted memory: {memory_id}")
        except Exception as e:
            if "NotFound" in str(e) or "ResourceNotFound" in str(e):
                print(f"ℹ️ Memory {memory_id} not found - already deleted or doesn't exist")
            else:
                print(f"⚠️ Error deleting memory: {e}")
                
    except Exception as e:
        print(f"❌ Error accessing Bedrock AgentCore: {e}")

def main():
    print("🧹 Flushing AgentCore Memory for Real OCR Extraction")
    print("=" * 60)
    
    # Step 1: Delete existing memory
    delete_existing_memory()
    
    print("\n🚀 Memory flushed! Now run the deployment:")
    print("python complete_deploy.py 222634382147 us-west-2")
    print("\nThis will create a fresh agent with:")
    print("- Clean memory (no learned patterns)")
    print("- Updated system prompt (no simulation)")
    print("- Real OCR focus")

if __name__ == "__main__":
    main()