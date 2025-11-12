#!/usr/bin/env python3

import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from strands import tool
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = BedrockAgentCoreApp()

@tool
def reconcile_financial_documents(
    left_document: List[Dict[str, Any]],
    right_document: List[Dict[str, Any]],
    profile_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Reconcile financial documents with varied confidence scores for demonstration
    """
    logger.info(f"🔍 Starting reconciliation: {len(left_document)} left, {len(right_document)} right records")
    
    # Handle empty data case
    if len(left_document) == 0 and len(right_document) == 0:
        logger.warning("⚠️ No data received - returning empty results")
        return {
            "analysis": "No data received for reconciliation",
            "reconciliationResults": [],
            "summary": {
                "totalTransactions": 0,
                "reconciledCount": 0,
                "unreconciledCount": 0,
                "confidenceScore": 0,
                "reconciliationType": "Empty Data",
                "leftFileRecords": 0,
                "rightFileRecords": 0,
                "leftFileName": "Left Document",
                "rightFileName": "Right Document"
            },
            "metadata": {
                "processedBy": "Empty Data Handler",
                "timestamp": datetime.utcnow().isoformat(),
                "profileContext": profile_context,
                "processingMethod": "No Data Processing"
            }
        }
    
    # Create simple analysis text
    analysis_text = f"""
    # Financial Reconciliation Analysis
    
    ## Data Overview
    - Left Document: {len(left_document)} records
    - Right Document: {len(right_document)} records
    
    ## Analysis Results
    The system has processed both documents and created side-by-side reconciliation results.
    Confidence scores vary to demonstrate the new 70% threshold for high confidence (green badges).
    
    ## Recommendations
    - Review unmatched transactions for potential data entry errors
    - Check for timing differences in transaction posting dates
    - Verify reference IDs and amounts for discrepancies
    """
    
    logger.info("✅ Analysis completed - creating structured reconciliation results")
    
    # Create structured reconciliation results by actually matching transactions
    reconciliation_results = []
    matched_right_indices = set()
    
    logger.info("🔍 Starting transaction matching between left and right documents")
    
    # First pass: Try to match left transactions with right transactions
    for left_idx, left_record in enumerate(left_document):
        left_transaction = {
            "id": f"left-{left_idx}",
            **left_record
        }
        
        left_amount = float(left_record.get('Amount', 0)) if left_record.get('Amount') else 0
        left_month = left_record.get('Month', '')
        left_rest_id = str(left_record.get('Rest ID', '')).strip()
        
        best_match = None
        best_confidence = 0.0
        best_match_idx = -1
        
        # Try to find matching right transaction
        for right_idx, right_record in enumerate(right_document):
            # Allow multiple matches - don't skip already matched transactions
            # This enables many-to-many matching for complex reconciliation scenarios
            
            right_amount = float(right_record.get('Amount', 0)) if right_record.get('Amount') else 0
            right_description = right_record.get('Description', '')
            right_date = right_record.get('Date', '')
            
            # Calculate match confidence based on multiple factors
            match_confidence = 0.0
            match_factors = []
            discrepancies = []
            
            # PERFECT MATCH: Amount + Rest ID (100% confidence)
            # Check if Rest ID matches - handle both direct field comparison and description parsing
            rest_id_in_description = False
            right_rest_id = str(right_record.get('Rest ID', '')).strip()
            
            if left_rest_id and right_rest_id:
                # Direct Rest ID field comparison (for data like test20)
                rest_id_in_description = str(left_rest_id) == str(right_rest_id)
                logger.info(f"🎯 REST ID comparison: '{left_rest_id}' vs '{right_rest_id}', match: {rest_id_in_description}")
                if rest_id_in_description:
                    logger.info(f"🎯 DIRECT REST ID MATCH: {left_rest_id} = {right_rest_id}")
            elif left_rest_id and right_description:
                # Extract store number from description (for data like test16)
                import re
                store_match = re.search(r'#(\d+)', right_description)
                if store_match:
                    store_number = store_match.group(1)
                    rest_id_in_description = str(left_rest_id) == store_number
                    if rest_id_in_description:
                        logger.info(f"🎯 DESCRIPTION REST ID MATCH: {left_rest_id} matches store #{store_number} in '{right_description}'")
                else:
                    # Fallback: check if Rest ID appears directly in description
                    rest_id_in_description = str(left_rest_id) in right_description
            
            # Calculate match confidence based on multiple factors
            match_confidence = 0.0
            
            # Check for exact amount match
            amount_exact_match = False
            if left_amount > 0 and right_amount > 0:
                amount_diff = abs(float(left_amount) - float(right_amount))
                amount_exact_match = amount_diff <= 0.01
            
            # Check for Rest ID match (direct field comparison)
            rest_id_exact_match = False
            if left_rest_id and right_rest_id:
                rest_id_exact_match = str(left_rest_id).strip() == str(right_rest_id).strip()
            
            # PERFECT MATCH: Exact amount + Exact Rest ID = 100% confidence
            if amount_exact_match and rest_id_exact_match:
                match_confidence = 100.0
                match_factors.append(f"PERFECT MATCH: Exact amount ${left_amount} + Rest ID {left_rest_id} = {right_rest_id}")
                logger.info(f"🎯 PERFECT MATCH FOUND: Left {left_idx} with Right {right_idx} - Amount: ${left_amount}, Rest ID: {left_rest_id}")
            
            # HIGH CONFIDENCE: Exact Rest ID + close amount = 90% confidence  
            elif rest_id_exact_match and left_amount > 0 and right_amount > 0:
                amount_diff = abs(float(left_amount) - float(right_amount))
                amount_ratio = amount_diff / max(float(left_amount), float(right_amount))
                if amount_ratio <= 0.05:  # Within 5%
                    match_confidence = 90.0
                    match_factors.append(f"HIGH CONFIDENCE: Rest ID {left_rest_id} = {right_rest_id} + close amount ${left_amount} ≈ ${right_amount}")
                else:
                    match_confidence = 75.0
                    match_factors.append(f"GOOD MATCH: Rest ID {left_rest_id} = {right_rest_id} + different amount ${left_amount} vs ${right_amount}")
                    discrepancies.append(f"Amount difference: ${amount_diff:.2f} ({amount_ratio:.1%})")
            
            # GOOD CONFIDENCE: Exact amount only = 70% confidence
            elif amount_exact_match:
                match_confidence = 70.0
                match_factors.append(f"GOOD MATCH: Exact amount ${left_amount}")
            
            else:
                # Regular amount matching for non-perfect matches
                if left_amount > 0 and right_amount > 0:
                    amount_diff = abs(float(left_amount) - float(right_amount))
                    amount_ratio = amount_diff / max(float(left_amount), float(right_amount))
                    
                    if amount_ratio <= 0.05:  # Within 5%
                        match_confidence += 30.0
                        match_factors.append(f"Close amount match: ${left_amount} ≈ ${right_amount}")
                    elif amount_ratio <= 0.15:  # Within 15%
                        match_confidence += 15.0
                        match_factors.append(f"Similar amounts: ${left_amount} vs ${right_amount}")
                        discrepancies.append(f"Amount difference: ${amount_diff:.2f}")
                    else:
                        discrepancies.append(f"Significant amount difference: ${amount_diff:.2f}")
                
                # Rest ID matching for description-based data (like test16)
                if rest_id_in_description and not rest_id_exact_match:
                    # Rest IDs are unique identifiers, so give significant confidence boost
                    if left_amount > 0 and right_amount > 0:
                        amount_diff = abs(left_amount - right_amount)
                        amount_ratio = amount_diff / max(left_amount, right_amount)
                        
                        if amount_ratio <= 0.15:  # Within 15% - very high confidence
                            match_confidence += 50.0  # Very high boost for Rest ID + close amount
                            import re
                            store_match = re.search(r'#(\d+)', right_description)
                            if store_match:
                                store_number = store_match.group(1)
                                match_factors.append(f"🎯 STRONG MATCH: Rest ID {left_rest_id} = Store #{store_number} + similar amount")
                            else:
                                match_factors.append(f"🎯 STRONG MATCH: Rest ID {left_rest_id} found + similar amount")
                        elif amount_ratio <= 0.50:  # Within 50% - still good confidence for unique ID
                            match_confidence += 35.0  # Good boost for Rest ID even with amount difference
                            import re
                            store_match = re.search(r'#(\d+)', right_description)
                            if store_match:
                                store_number = store_match.group(1)
                                match_factors.append(f"🎯 Rest ID {left_rest_id} matches Store #{store_number} (unique identifier)")
                                discrepancies.append(f"Amount difference: ${amount_diff:.2f} ({amount_ratio:.1%})")
                            else:
                                match_factors.append(f"🎯 Rest ID {left_rest_id} found (unique identifier)")
                                discrepancies.append(f"Amount difference: ${amount_diff:.2f}")
                        else:
                            match_confidence += 25.0  # Standard boost for Rest ID match
                            import re
                            store_match = re.search(r'#(\d+)', right_description)
                            if store_match:
                                store_number = store_match.group(1)
                                match_factors.append(f"Rest ID {left_rest_id} matches Store #{store_number}")
                                discrepancies.append(f"Large amount difference: ${amount_diff:.2f} ({amount_ratio:.1%})")
                            else:
                                match_factors.append(f"Rest ID {left_rest_id} found in payment description")
                    else:
                        match_confidence += 25.0
                        match_factors.append(f"Rest ID {left_rest_id} found in payment description")
            
            # Date/temporal matching
            if left_month and right_date:
                if left_month.lower() in right_date.lower():
                    match_confidence += 20.0
                    match_factors.append(f"Month match: {left_month} found in {right_date}")
                else:
                    discrepancies.append(f"Date mismatch: {left_month} vs {right_date}")
            
            # Description analysis for delivery indicators
            if right_description:
                delivery_keywords = ['uber', 'doordash', 'grubhub', 'delivery', 'eats', 'restaurant']
                if any(keyword in right_description.lower() for keyword in delivery_keywords):
                    match_confidence += 15.0
                    match_factors.append("Delivery transaction identified")
                
                # Check for restaurant names
                restaurant_keywords = ['starbucks', 'mcdonald', 'pizza', 'cafe', 'restaurant']
                if any(keyword in right_description.lower() for keyword in restaurant_keywords):
                    match_confidence += 10.0
                    match_factors.append("Restaurant transaction identified")
            
            # Transaction type bonus
            if right_record.get('Type', '').lower() == '3rd party delivery':
                match_confidence += 10.0
                match_factors.append("3rd party delivery type match")
            
            if match_confidence > best_confidence:
                best_confidence = match_confidence
                best_match = {
                    'right_record': right_record,
                    'right_idx': right_idx,
                    'factors': match_factors,
                    'discrepancies': discrepancies
                }
                best_match_idx = right_idx
        
        # Create reconciliation result
        if best_match and best_confidence >= 30.0:  # Minimum threshold for matching
            # Don't add to matched_right_indices to allow many-to-many matching
            right_transaction = {
                "id": f"right-{best_match_idx}",
                **best_match['right_record']
            }
            
            is_reconciled = best_confidence >= 50.0
            
            if best_confidence >= 100.0:
                reasoning = f"🎯 PERFECT MATCH (100%): Sales record {left_idx+1} PERFECTLY matched with payment record {best_match_idx+1}. EXACT amount match + Rest ID found in payment description: {', '.join(best_match['factors'])}. This is a confirmed transaction pair with absolute certainty."
            elif best_confidence >= 70.0:
                reasoning = f"🟢 HIGH CONFIDENCE MATCH ({best_confidence:.0f}%): Sales record {left_idx+1} successfully matched with payment record {best_match_idx+1}. Strong correlation found: {', '.join(best_match['factors'])}. This appears to be a confirmed transaction pair with reliable matching indicators."
            elif best_confidence >= 50.0:
                reasoning = f"🟡 MODERATE CONFIDENCE MATCH ({best_confidence:.0f}%): Sales record {left_idx+1} shows potential match with payment record {best_match_idx+1}. Matching factors: {', '.join(best_match['factors'])}. Some discrepancies noted: {', '.join(best_match['discrepancies'])}. Recommend manual verification."
            else:
                reasoning = f"🔴 LOW CONFIDENCE MATCH ({best_confidence:.0f}%): Sales record {left_idx+1} has weak correlation with payment record {best_match_idx+1}. Limited matching factors: {', '.join(best_match['factors'])}. Significant issues: {', '.join(best_match['discrepancies'])}. Manual investigation required."
            
            reconciliation_results.append({
                "leftTransaction": left_transaction,
                "rightTransaction": right_transaction,
                "isReconciled": is_reconciled,
                "matchedFields": best_match['factors'],
                "confidence": best_confidence,
                "aiReasoning": reasoning,
                "discrepancies": best_match['discrepancies']
            })
        else:
            # No match found for this left transaction
            reasoning = f"🔴 NO MATCH FOUND (0%): Sales record {left_idx+1} (${left_amount}, {left_month}) could not be matched with any payment records. This transaction may be missing from the bank statement, processed in a different period, or require manual investigation to locate the corresponding payment."
            
            reconciliation_results.append({
                "leftTransaction": left_transaction,
                "rightTransaction": None,
                "isReconciled": False,
                "matchedFields": [],
                "confidence": 0.0,
                "aiReasoning": reasoning,
                "discrepancies": ["No matching payment record found"]
            })
    
    # Second pass: Add unmatched right transactions
    for right_idx, right_record in enumerate(right_document):
        if right_idx not in matched_right_indices:
            right_transaction = {
                "id": f"right-{right_idx}",
                **right_record
            }
            
            right_amount = right_record.get('Amount', 0)
            right_description = right_record.get('Description', '')
            
            reasoning = f"🔴 UNMATCHED PAYMENT (0%): Payment record {right_idx+1} (${right_amount}) could not be matched with any sales records. Description: '{right_description}'. This payment may correspond to sales from a different period, different restaurant, or require manual investigation to locate the corresponding sales transaction."
            
            reconciliation_results.append({
                "leftTransaction": None,
                "rightTransaction": right_transaction,
                "isReconciled": False,
                "matchedFields": [],
                "confidence": 0.0,
                "aiReasoning": reasoning,
                "discrepancies": ["No matching sales record found"]
            })
    
    # Calculate reconciliation counts
    reconciled_count = sum(1 for r in reconciliation_results if r["isReconciled"])
    total_count = len(reconciliation_results)
    
    logger.info(f"📊 Created {total_count} reconciliation results")
    logger.info(f"📊 Reconciled: {reconciled_count}, Unreconciled: {total_count - reconciled_count}")
    
    # Format the response for side-by-side display
    return {
        "analysis": analysis_text,
        "reconciliationResults": reconciliation_results,
        "summary": {
            "totalTransactions": total_count,
            "reconciledCount": reconciled_count,
            "unreconciledCount": total_count - reconciled_count,
            "confidenceScore": sum(r["confidence"] for r in reconciliation_results) / total_count if total_count > 0 else 0,
            "reconciliationType": "Side-by-Side with Varied Confidence",
            "leftFileRecords": len(left_document),
            "rightFileRecords": len(right_document),
            "leftFileName": "Left Document",
            "rightFileName": "Right Document"
        },
        "metadata": {
            "processedBy": "Confidence Demo Engine",
            "timestamp": datetime.utcnow().isoformat(),
            "profileContext": profile_context,
            "processingMethod": "Direct JSON Data Processing with Confidence Variation"
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
        
        logger.info(f"📊 Received data: {len(left_document)} left, {len(right_document)} right records")
        
        result = reconcile_financial_documents(left_document, right_document, profile_context)
        return result
    
    return f"Unknown operation: {operation}"

if __name__ == "__main__":
    app.run()