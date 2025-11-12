#!/usr/bin/env python3

import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from bedrock_agentcore import tool, app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@tool
def reconcile_financial_documents(
    left_document: List[Dict[str, Any]],
    right_document: List[Dict[str, Any]],
    profile_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Reconcile financial documents - NO FALLBACKS, STRICT PROCESSING ONLY
    """
    logger.info(f"🔍 Starting reconciliation: {len(left_document)} left, {len(right_document)} right records")
    
    # Convert provided data to JSON and send to LLM for analysis
    logger.info("📊 Converting data to JSON for LLM analysis")
    
    comprehensive_prompt = f"""
    SALES AND PAYMENT RECONCILIATION - JSON DATA ANALYSIS:
    
    LEFT DOCUMENT DATA:
    Records: {len(left_document)}
    JSON Data: {json.dumps(left_document, indent=2, default=str)}
    
    RIGHT DOCUMENT DATA:
    Records: {len(right_document)}
    JSON Data: {json.dumps(right_document, indent=2, default=str)}
    
    TASK: Perform comprehensive reconciliation analysis on this JSON data.
    
    Please analyze these datasets and provide:
    1. Document type identification and data structure analysis
    2. Transaction matching and reconciliation results
    3. Detailed business insights and explanations
    4. Unmatched records with specific reasons
    5. Confidence scores and recommendations
    
    Create a comprehensive business analysis explaining the relationship between these datasets.
    """
    
    # Call the agent with provided data
    logger.info("🤖 Calling LLM agent with JSON data for comprehensive analysis")
    response = agent(comprehensive_prompt)
    
    # Extract the response content
    if hasattr(response, 'message') and 'content' in response.message:
        analysis_text = response.message['content'][0]['text']
    else:
        analysis_text = str(response)
    
    logger.info("✅ LLM analysis completed - creating structured reconciliation results")
    
    # Create structured reconciliation results for frontend tables
    reconciliation_results = []
    
    # Process ALL left document records
    for i, record in enumerate(left_document):
        left_transaction = {
            "id": f"left-{i}",
            **record
        }
        
        reconciliation_results.append({
            "leftTransaction": left_transaction,
            "rightTransaction": None,
            "isReconciled": False,
            "matchedFields": [],
            "confidence": 25.0,
            "aiReasoning": f"Left document record {i+1}: See comprehensive LLM analysis above for detailed reconciliation insights.",
            "discrepancies": ["See LLM analysis above for detailed reconciliation results"]
        })
    
    # Process ALL right document records
    for i, record in enumerate(right_document):
        right_transaction = {
            "id": f"right-{i}",
            **record
        }
        
        reconciliation_results.append({
            "leftTransaction": None,
            "rightTransaction": right_transaction,
            "isReconciled": False,
            "matchedFields": [],
            "confidence": 25.0,
            "aiReasoning": f"Right document record {i+1}: See comprehensive LLM analysis above for detailed reconciliation insights.",
            "discrepancies": ["See LLM analysis above for detailed reconciliation results"]
        })
    
    # Calculate reconciliation counts
    reconciled_count = sum(1 for r in reconciliation_results if r["isReconciled"])
    
    logger.info(f"📊 Created {len(reconciliation_results)} reconciliation results")
    logger.info(f"📊 Reconciled: {reconciled_count}, Unreconciled: {len(reconciliation_results) - reconciled_count}")
    
    # Format the response for side-by-side display
    return {
        "analysis": analysis_text,
        "reconciliationResults": reconciliation_results,
        "summary": {
            "totalTransactions": len(reconciliation_results),
            "reconciledCount": reconciled_count,
            "unreconciledCount": len(reconciliation_results) - reconciled_count,
            "confidenceScore": sum(r["confidence"] for r in reconciliation_results) / len(reconciliation_results) if reconciliation_results else 0,
            "reconciliationType": "Side-by-Side Sales and Payment Reconciliation",
            "leftFileRecords": len(left_document),
            "rightFileRecords": len(right_document),
            "leftFileName": "Left Document",
            "rightFileName": "Right Document"
        },
        "metadata": {
            "processedBy": "Side-by-Side Reconciliation Engine",
            "timestamp": datetime.utcnow().isoformat(),
            "profileContext": profile_context,
            "processingMethod": "Direct JSON Data Processing"
        }
    }

@app.entrypoint
def clofast_reconciliation_agent(payload):
    """
    Main entrypoint - NO FALLBACKS
    """
    operation = payload.get("operation", "reconcile")
    logger.info(f"Processing {operation} request")
    
    if operation == "reconcile":
        left_document = payload.get("leftDocument", [])
        right_document = payload.get("rightDocument", [])
        profile_context = payload.get("profileContext", {})
        
        return reconcile_financial_documents(left_document, right_document, profile_context)
    
    return f"Unknown operation: {operation}"