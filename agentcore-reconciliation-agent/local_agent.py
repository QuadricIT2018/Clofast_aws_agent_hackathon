#!/usr/bin/env python3
"""
Local Flask server version of the reconciliation agent for testing
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
import requests
import io
import re
from datetime import datetime
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def extract_from_pdf_text(pdf_content: bytes, document_url: str, document_name: str, extraction_rules: List[Dict], profile_context: Dict):
    """
    Extract financial data from PDF using REAL text extraction - NO SIMULATION
    """
    logger.info("📄 Extracting text from PDF document...")
    
    try:
        # Try to extract text from PDF using PyPDF2
        logger.info("🔍 Attempting PDF text extraction...")
        
        try:
            import PyPDF2
            
            # Create a PDF reader from the content
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            logger.info(f"📄 PDF has {len(pdf_reader.pages)} pages")
            
            # Extract text from all pages
            full_text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    full_text += page_text + "\n"
                    logger.info(f"📄 Extracted text from page {page_num + 1}: {len(page_text)} characters")
                except Exception as page_error:
                    logger.warning(f"⚠️ Could not extract text from page {page_num + 1}: {page_error}")
            
            logger.info(f"📄 Total extracted text: {len(full_text)} characters")
            logger.info(f"📄 Text sample (first 500 chars): {full_text[:500]}")
            
            if len(full_text.strip()) == 0:
                logger.error("❌ No text could be extracted from PDF")
                return {
                    "success": False,
                    "message": f"No text could be extracted from {document_name}. PDF might be image-based and require OCR.",
                    "extractedData": [],
                    "metadata": {
                        "documentUrl": document_url,
                        "documentName": document_name,
                        "extractionMethod": "PDF Text Extraction (No Text Found)",
                        "extractionConfidence": 0,
                        "recordsExtracted": 0,
                        "timestamp": datetime.utcnow().isoformat(),
                        "profileContext": profile_context,
                        "rulesApplied": len(extraction_rules),
                        "error": "No extractable text found - PDF may be image-based"
                    }
                }
            
            # Now try to find financial patterns in the text
            logger.info("🔍 Analyzing text for financial patterns...")
            extracted_data = extract_financial_patterns_from_text(full_text, document_name)
            
            # Apply extraction rules if provided
            if extraction_rules and extracted_data:
                logger.info(f"📋 Applying {len(extraction_rules)} extraction rules")
                rule_terms = set()
                for rule in extraction_rules:
                    rule_terms.update(rule.get('terms', []))
                
                if rule_terms:
                    filtered_data = []
                    for record in extracted_data:
                        filtered_record = {}
                        for term in rule_terms:
                            # Try exact match first, then case-insensitive
                            if term in record:
                                filtered_record[term] = record[term]
                            else:
                                for key in record.keys():
                                    if key.lower() == term.lower():
                                        filtered_record[term] = record[key]
                                        break
                        if filtered_record:
                            filtered_data.append(filtered_record)
                    extracted_data = filtered_data if filtered_data else extracted_data
            
            extraction_confidence = 75.0 if extracted_data else 0.0
            
            logger.info(f"✅ PDF text extraction completed: {len(extracted_data)} records with {extraction_confidence}% confidence")
            
            return {
                "success": True,
                "message": f"Successfully extracted {len(extracted_data)} records from PDF text analysis",
                "extractedData": extracted_data,
                "metadata": {
                    "documentUrl": document_url,
                    "documentName": document_name,
                    "extractionMethod": "PDF Text Extraction + Pattern Recognition",
                    "extractionConfidence": extraction_confidence,
                    "recordsExtracted": len(extracted_data),
                    "timestamp": datetime.utcnow().isoformat(),
                    "profileContext": profile_context,
                    "rulesApplied": len(extraction_rules),
                    "textLength": len(full_text),
                    "pagesProcessed": len(pdf_reader.pages)
                }
            }
            
        except ImportError:
            logger.error("❌ PyPDF2 not available - cannot extract PDF text")
            return {
                "success": False,
                "message": f"PDF text extraction requires PyPDF2 library. Cannot process {document_name}.",
                "extractedData": [],
                "metadata": {
                    "documentUrl": document_url,
                    "documentName": document_name,
                    "extractionMethod": "PDF Text Extraction (Library Missing)",
                    "extractionConfidence": 0,
                    "recordsExtracted": 0,
                    "timestamp": datetime.utcnow().isoformat(),
                    "profileContext": profile_context,
                    "rulesApplied": len(extraction_rules),
                    "error": "PyPDF2 library not installed"
                }
            }
        
    except Exception as e:
        logger.error(f"❌ Error in PDF text extraction: {str(e)}")
        return {
            "success": False,
            "message": f"PDF text extraction failed: {str(e)}",
            "extractedData": [],
            "metadata": {}
        }

def extract_financial_patterns_from_text(text: str, document_name: str) -> List[Dict]:
    """
    Extract financial transaction patterns from PDF text using regex
    """
    logger.info("🔍 Searching for financial patterns in extracted text...")
    
    extracted_data = []
    
    # Enhanced financial patterns for different document types
    # Date patterns: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
    date_patterns = [
        r'\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\b',
        r'\b(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})\b'
    ]
    
    # Amount patterns: $123.45, 123.45, (123.45)
    amount_patterns = [
        r'\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})',  # $1,234.56
        r'\$\s*(\d+\.\d{2})',                 # $123.45
        r'(\d{1,3}(?:,\d{3})*\.\d{2})',      # 1,234.56
        r'\(\s*\$?\s*(\d{1,3}(?:,\d{3})*\.\d{2})\s*\)'  # ($1,234.56)
    ]
    
    # Split text into lines for line-by-line analysis
    lines = text.split('\n')
    
    # Strategy 1: Look for traditional transaction lines (date + amount)
    for line_num, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Look for lines that contain both date and amount patterns
        dates_found = []
        amounts_found = []
        
        # Find dates
        for date_pattern in date_patterns:
            dates_found.extend(re.findall(date_pattern, line))
        
        # Find amounts
        for amount_pattern in amount_patterns:
            amounts_found.extend(re.findall(amount_pattern, line))
        
        # If we found both date and amount, this might be a transaction line
        if dates_found and amounts_found:
            try:
                # Take the first date and amount found
                date_str = dates_found[0]
                amount_str = amounts_found[0].replace(',', '').replace('$', '').strip()
                amount = float(amount_str)
                
                # Extract description (everything except date and amount)
                description = line
                for date in dates_found:
                    description = description.replace(date, '').strip()
                for amount in amounts_found:
                    description = description.replace(f'${amount}', '').replace(amount, '').strip()
                
                # Clean up description
                description = re.sub(r'\s+', ' ', description).strip()
                if not description:
                    description = f"Transaction from {document_name}"
                
                extracted_data.append({
                    "Date": date_str,
                    "Amount": float(amount_str),
                    "Description": description,
                    "LineNumber": line_num + 1,
                    "SourceLine": line
                })
                
                logger.info(f"📊 Found transaction: {date_str} - ${amount_str} - {description[:50]}...")
                
            except (ValueError, IndexError) as e:
                logger.warning(f"⚠️ Could not parse transaction from line {line_num + 1}: {e}")
                continue
    
    # Strategy 2: Look for summary/aggregate data (if no individual transactions found)
    if len(extracted_data) == 0:
        logger.info("🔍 No individual transactions found, looking for summary data...")
        
        # Look for summary patterns like "Total payments", "Restaurant sales", etc.
        summary_patterns = [
            (r'Total payments.*?\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})', "Total Payments"),
            (r'Restaurant sales.*?\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})', "Restaurant Sales"),
            (r'(\d+)\s*Marketplace orders\s+(\d{1,3}(?:,\d{3})*\.\d{2})', "Marketplace Orders"),
            (r'(\d+)\s*Partner orders\s+(\d{1,3}(?:,\d{3})*\.\d{2})', "Partner Orders"),
            (r'Balance.*?\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})', "Balance"),
            (r'(\d+)\s*orders.*?\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})', "Order Summary"),
            (r'Paid directly.*?(\d{1,3}(?:,\d{3})*\.\d{2})', "Direct Payment"),
            (r'taxes.*?(\d{1,3}(?:,\d{3})*\.\d{2})', "Tax Amount")
        ]
        
        for line_num, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            for pattern, description_prefix in summary_patterns:
                matches = re.findall(pattern, line, re.IGNORECASE)
                if matches:
                    try:
                        if description_prefix in ["Order Summary", "Marketplace Orders", "Partner Orders"] and len(matches[0]) == 2:
                            # Special case for count + amount patterns
                            count, amount_str = matches[0]
                            amount = float(amount_str.replace(',', ''))
                            description = f"{description_prefix}: {count} orders"
                        else:
                            amount_str = matches[0] if isinstance(matches[0], str) else matches[0][0]
                            amount = float(amount_str.replace(',', ''))
                            description = f"{description_prefix}"
                        
                        # Use current date as placeholder since summary docs don't have transaction dates
                        current_date = datetime.now().strftime("%m/%d/%Y")
                        
                        extracted_data.append({
                            "Date": current_date,
                            "Amount": amount,
                            "Description": description,
                            "LineNumber": line_num + 1,
                            "SourceLine": line,
                            "Type": "Summary"
                        })
                        
                        logger.info(f"📊 Found summary item: {description} - ${amount}")
                        
                    except (ValueError, IndexError) as e:
                        logger.warning(f"⚠️ Could not parse summary from line {line_num + 1}: {e}")
                        continue
    
    logger.info(f"✅ Pattern extraction completed: {len(extracted_data)} items found")
    return extracted_data

@app.route('/extract', methods=['POST'])
def extract_endpoint():
    """
    Extract financial data from documents
    """
    try:
        data = request.get_json()
        
        document_url = data.get('document_url')
        document_name = data.get('document_name', 'Unknown Document')
        extraction_rules = data.get('extraction_rules', [])
        profile_context = data.get('profile_context', {})
        
        logger.info(f"📄 Processing extraction request for: {document_name}")
        logger.info(f"🔗 Document URL: {document_url}")
        
        if not document_url:
            return jsonify({
                "success": False,
                "message": "No document URL provided",
                "extractedData": [],
                "metadata": {}
            }), 400
        
        # Download the document
        response = requests.get(document_url, timeout=30)
        response.raise_for_status()
        
        file_extension = document_name.lower().split('.')[-1] if '.' in document_name else 'unknown'
        logger.info(f"📄 Document type: {file_extension}")
        
        if file_extension == 'pdf':
            # Process PDF file
            result = extract_from_pdf_text(response.content, document_url, document_name, extraction_rules, profile_context)
        else:
            result = {
                "success": False,
                "message": f"Unsupported file type: {file_extension}. Only PDF is supported in this local version.",
                "extractedData": [],
                "metadata": {}
            }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in extraction endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Extraction failed: {str(e)}",
            "extractedData": [],
            "metadata": {}
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "healthy",
        "service": "Local Reconciliation Agent",
        "timestamp": datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Local Reconciliation Agent...")
    logger.info("📍 Server will be available at http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)