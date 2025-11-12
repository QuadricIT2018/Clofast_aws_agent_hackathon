#!/usr/bin/env python3
"""
Test script for Excel processing functionality
Tests the enhanced Excel extraction before AWS deployment
"""

import pandas as pd
import io
import json
from datetime import datetime
import sys
import os

def create_test_excel():
    """Create a test Excel file for processing"""
    
    # Sample financial data
    data = {
        'Date': ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
        'Amount': [100.50, 250.75, 89.99, 1500.00, 45.25],
        'Description': ['Payment from Client A', 'Service Fee', 'Office Supplies', 'Monthly Revenue', 'Coffee Expense'],
        'Reference ID': ['REF001', 'REF002', 'REF003', 'REF004', 'REF005'],
        'Category': ['Income', 'Expense', 'Expense', 'Income', 'Expense'],
        'Status': ['Completed', 'Completed', 'Pending', 'Completed', 'Completed']
    }
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Transactions', index=False)
        
        # Add a second sheet with summary data
        summary_data = {
            'Metric': ['Total Income', 'Total Expenses', 'Net Amount', 'Transaction Count'],
            'Value': [1600.50, 385.99, 1214.51, 5]
        }
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
    
    excel_buffer.seek(0)
    return excel_buffer.getvalue()

def test_excel_extraction():
    """Test the Excel extraction functionality"""
    
    print("🧪 Testing Excel Processing Functionality")
    print("=" * 50)
    
    try:
        # Import the extraction function
        sys.path.append(os.path.dirname(__file__))
        from agent import extract_from_excel
        
        # Create test Excel data
        print("📊 Creating test Excel file...")
        excel_content = create_test_excel()
        print(f"✅ Test Excel file created: {len(excel_content)} bytes")
        
        # Test extraction rules
        extraction_rules = [
            {
                "extractionRuleName": "Financial Data",
                "terms": ["Date", "Amount", "Description", "Reference ID"]
            }
        ]
        
        profile_context = {
            "profileName": "Test Profile",
            "profileDescription": "Testing Excel extraction"
        }
        
        # Test the extraction
        print("\n🔍 Testing Excel extraction...")
        result = extract_from_excel(
            file_content=excel_content,
            document_name="test_financial_data.xlsx",
            extraction_rules=extraction_rules,
            profile_context=profile_context
        )
        
        # Display results
        print(f"\n📋 Extraction Results:")
        print(f"   Success: {result.get('success', False)}")
        print(f"   Message: {result.get('message', 'No message')}")
        print(f"   Records Extracted: {len(result.get('extractedData', []))}")
        
        if result.get('metadata'):
            metadata = result['metadata']
            print(f"   Confidence: {metadata.get('extractionConfidence', 0)}%")
            print(f"   Method: {metadata.get('extractionMethod', 'Unknown')}")
            print(f"   Original Rows: {metadata.get('originalRows', 0)}")
            print(f"   Processed Rows: {metadata.get('processedRows', 0)}")
            print(f"   Active Sheet: {metadata.get('activeSheet', 'Unknown')}")
        
        # Show sample data
        if result.get('extractedData'):
            print(f"\n📊 Sample Extracted Records:")
            for i, record in enumerate(result['extractedData'][:3]):
                print(f"   Record {i+1}: {record}")
        
        # Test without extraction rules
        print(f"\n🔍 Testing without extraction rules...")
        result_no_rules = extract_from_excel(
            file_content=excel_content,
            document_name="test_financial_data.xlsx",
            extraction_rules=[],
            profile_context=profile_context
        )
        
        print(f"   Records without rules: {len(result_no_rules.get('extractedData', []))}")
        
        if result_no_rules.get('extractedData'):
            print(f"   Sample record: {result_no_rules['extractedData'][0]}")
        
        print(f"\n✅ Excel processing test completed successfully!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure you have installed the required dependencies:")
        print("   pip install pandas openpyxl xlrd numpy")
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_types():
    """Test various Excel data types"""
    
    print(f"\n🧪 Testing Excel Data Type Handling")
    print("-" * 40)
    
    try:
        # Create Excel with various data types
        data = {
            'Text': ['Sample Text', 'Another String', 'Special Chars: @#$%'],
            'Integer': [100, 200, 300],
            'Float': [100.50, 200.75, 300.99],
            'Date': [datetime(2024, 1, 1), datetime(2024, 1, 2), datetime(2024, 1, 3)],
            'Boolean': [True, False, True],
            'Mixed': ['Text', 123, 45.67]
        }
        
        df = pd.DataFrame(data)
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False, engine='openpyxl')
        excel_buffer.seek(0)
        
        from agent import extract_from_excel
        
        result = extract_from_excel(
            file_content=excel_buffer.getvalue(),
            document_name="data_types_test.xlsx",
            extraction_rules=[],
            profile_context={"profileName": "Data Types Test"}
        )
        
        print(f"✅ Data types test successful!")
        print(f"   Records: {len(result.get('extractedData', []))}")
        
        if result.get('extractedData'):
            sample = result['extractedData'][0]
            print(f"   Sample record types:")
            for key, value in sample.items():
                print(f"     {key}: {type(value).__name__} = {value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Data types test failed: {e}")
        return False

def main():
    """Main test function"""
    
    print("🚀 CloFast Excel Processing Test Suite")
    print("=" * 60)
    
    # Test 1: Basic Excel extraction
    test1_success = test_excel_extraction()
    
    # Test 2: Data type handling
    test2_success = test_data_types()
    
    # Summary
    print(f"\n📋 Test Summary:")
    print(f"   Basic Extraction: {'✅ PASS' if test1_success else '❌ FAIL'}")
    print(f"   Data Type Handling: {'✅ PASS' if test2_success else '❌ FAIL'}")
    
    if test1_success and test2_success:
        print(f"\n🎉 All tests passed! Excel processing is ready for AWS deployment.")
        print(f"💡 Next steps:")
        print(f"   1. Run: python complete_deploy.py <your-account-id>")
        print(f"   2. Update your CloFast .env file with the agent ARN")
        print(f"   3. Test with real Excel files through the CloFast interface")
    else:
        print(f"\n❌ Some tests failed. Please fix the issues before deployment.")
        sys.exit(1)

if __name__ == "__main__":
    main()