import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from "@aws-sdk/client-bedrock-agentcore";
import dotenv from "dotenv";

dotenv.config();

interface ReconciliationRequest {
    leftDocument: any[];
    rightDocument: any[];
    extractionRules: any[];
    matchingRules: any[];
    profileContext: {
        profileName: string;
        profileDescription: string;
    };
}

interface AgentCoreResponse {
    reconciliationResults: Array<{
        leftTransaction: any;
        rightTransaction: any | null;
        isReconciled: boolean;
        matchedFields?: string[];
        confidence?: number;
        aiReasoning?: string;
        discrepancies?: string[];
    }>;
    summary: {
        totalTransactions: number;
        reconciledCount: number;
        unreconciledCount: number;
        confidenceScore: number;
    };
}

export class AgentCoreService {
    private readonly agentArn: string;
    private readonly agentId: string;
    private readonly sessionId: string;
    private readonly region: string;
    private readonly bedrockAgentCoreClient: BedrockAgentCoreClient;

    constructor() {
        // AWS Bedrock AgentCore configuration
        this.agentArn = process.env.AWS_BEDROCK_AGENT_ARN || "";
        this.agentId = process.env.AWS_BEDROCK_AGENT_ID || "";
        this.sessionId = process.env.AWS_BEDROCK_SESSION_ID || `reconciliation-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        this.region = process.env.AWS_REGION || "us-west-2";

        // Initialize AWS Bedrock AgentCore client
        this.bedrockAgentCoreClient = new BedrockAgentCoreClient({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            }
        });
    }

    async performExtraction(documentUrl: string, documentName: string, extractionRules: any[], profileContext: any, base64Image?: string | null): Promise<any> {
        try {
            // Determine file type - ONLY Excel files supported
            const fileExtension = documentName.toLowerCase().split('.').pop() || '';
            const isExcelFile = ['xlsx', 'xls'].includes(fileExtension);

            console.log(`📊 Direct Excel-to-JSON extraction for ${fileExtension.toUpperCase()} file...`);
            console.log(`🚫 NO LLM INVOLVEMENT - Direct Excel conversion to JSON`);

            // Only process Excel files - NO LLM calls
            if (isExcelFile) {
                console.log(`📊 Excel file detected - performing direct Excel-to-JSON conversion...`);
                try {
                    const directResult = await this.convertExcelToJson(documentUrl, documentName, extractionRules, profileContext);
                    if (directResult && directResult.success) {
                        console.log("✅ Direct Excel-to-JSON conversion successful");
                        return directResult;
                    }
                } catch (conversionError) {
                    console.log("⚠️ Direct Excel-to-JSON conversion failed:", conversionError);
                }
            } else {
                console.log(`❌ Unsupported file type: ${fileExtension}. Only Excel files (.xlsx, .xls) are supported.`);
                return {
                    success: false,
                    message: `Unsupported file type: ${fileExtension}. Only Excel files (.xlsx, .xls) are supported.`,
                    extractedData: [],
                    metadata: {
                        documentName: documentName,
                        extractionMethod: "Direct Excel-to-JSON",
                        error: `Unsupported file type: ${fileExtension}`,
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // If Excel conversion failed, return error
            console.log("❌ Excel-to-JSON conversion failed - NO FAKE DATA GENERATION");
            return {
                success: false,
                message: "Excel-to-JSON conversion failed. Please check the document URL and format.",
                extractedData: [],
                metadata: {
                    documentName: documentName,
                    extractionMethod: "Direct Excel-to-JSON Failed",
                    error: "Excel conversion failed - no fake data generation",
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error: any) {
            console.error("❌ Excel extraction failed:", error.message);

            // Return error instead of generating fake data
            console.log("🚫 NO FAKE DATA GENERATION - Returning error");
            return {
                success: false,
                message: `Excel extraction failed: ${error.message}. Only Excel files with valid URLs are supported.`,
                extractedData: [],
                metadata: {
                    documentName: documentName,
                    extractionMethod: "Direct Excel-to-JSON Error",
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    async performReconciliation(request: ReconciliationRequest): Promise<AgentCoreResponse> {
        try {
            console.log("🤖 Sending Excel files directly to agent for sales/payment reconciliation...");

            if (!this.agentArn || !this.agentId) {
                console.log("❌ AWS Bedrock AgentCore not configured");
                return {
                    reconciliationResults: [],
                    summary: {
                        totalTransactions: 0,
                        reconciledCount: 0,
                        unreconciledCount: 0,
                        confidenceScore: 0
                    }
                };
            }

            // Send complete Excel data directly to agent - let agent handle everything
            console.log("📊 DIRECT FILE RECONCILIATION - Agent will handle extraction and reconciliation");
            console.log(`📄 Left Document: ${request.leftDocument.length} records`);
            console.log(`📄 Right Document: ${request.rightDocument.length} records`);

            const payload = {
                operation: "reconcile",
                leftDocument: request.leftDocument, // Complete Excel data
                rightDocument: request.rightDocument, // Complete Excel data
                profileContext: {
                    profileName: request.profileContext.profileName,
                    profileDescription: request.profileContext.profileDescription,
                },
                sessionId: this.sessionId,
            };

            console.log(`📦 Sending complete Excel data to agent for direct processing`)

            // Call AWS Bedrock AgentCore using the proper AWS SDK v3
            console.log("🚀 Calling AWS Bedrock AgentCore agent...");
            console.log(`📍 Agent ARN: ${this.agentArn}`);
            console.log(`🔑 Session ID: ${this.sessionId}`);

            const command = new InvokeAgentRuntimeCommand({
                agentRuntimeArn: this.agentArn,
                runtimeSessionId: this.sessionId,
                payload: JSON.stringify(payload)
            });

            const response = await this.bedrockAgentCoreClient.send(command);
            console.log("✅ AWS Bedrock AgentCore response received");

            // Parse and transform the AgentCore response
            return await this.transformAgentCoreResponse(response, request);

        } catch (error: any) {
            console.error("❌ AWS Bedrock AgentCore reconciliation failed:", error.message);
            
            // NO FALLBACKS - Return error
            return {
                reconciliationResults: [],
                summary: {
                    totalTransactions: 0,
                    reconciledCount: 0,
                    unreconciledCount: 0,
                    confidenceScore: 0
                }
            };
        }
    }

    private async transformExtractionResponse(agentResponse: any, documentName: string): Promise<any> {
        // Transform AWS Bedrock AgentCore extraction response
        try {
            console.log("🔍 Processing AgentCore extraction response...");

            let responseText = "";

            // Handle AWS SDK v3 response format (similar to reconciliation)
            if (agentResponse.response) {
                console.log("📡 Processing streaming extraction response...");
                const chunks: string[] = [];

                if (agentResponse.response[Symbol.asyncIterator]) {
                    console.log("🔄 Processing async iterator for extraction...");
                    try {
                        for await (const chunk of agentResponse.response) {
                            console.log("📦 Extraction chunk type:", typeof chunk);

                            // Handle different chunk formats (same as reconciliation)
                            if (chunk.bytes) {
                                const chunkText = Buffer.from(chunk.bytes).toString();
                                console.log("📝 Direct bytes chunk:", chunkText.substring(0, 50));
                                chunks.push(chunkText);
                            } else if (chunk.chunk && chunk.chunk.bytes) {
                                const chunkText = Buffer.from(chunk.chunk.bytes).toString();
                                console.log("📝 Nested bytes chunk:", chunkText.substring(0, 50));
                                chunks.push(chunkText);
                            } else if (typeof chunk === 'object') {
                                // This is likely a Buffer object serialized as JSON
                                // Convert it back to actual text
                                if (chunk.type === 'Buffer' && Array.isArray(chunk.data)) {
                                    const chunkText = Buffer.from(chunk.data).toString();
                                    console.log("📝 Buffer object chunk:", chunkText.substring(0, 50));
                                    chunks.push(chunkText);
                                } else if (Array.isArray(chunk)) {
                                    // Direct array of bytes
                                    const chunkText = Buffer.from(chunk).toString();
                                    console.log("📝 Array chunk:", chunkText.substring(0, 50));
                                    chunks.push(chunkText);
                                } else {
                                    // This might be a JSON string representation of a Buffer
                                    const chunkStr = JSON.stringify(chunk);
                                    if (chunkStr.includes('"type":"Buffer"') && chunkStr.includes('"data":')) {
                                        try {
                                            const bufferObj = JSON.parse(chunkStr);
                                            if (bufferObj.type === 'Buffer' && bufferObj.data) {
                                                const chunkText = Buffer.from(bufferObj.data).toString();
                                                console.log("📝 JSON Buffer chunk:", chunkText.substring(0, 50));
                                                chunks.push(chunkText);
                                            } else {
                                                console.log("📝 Object chunk:", chunkStr.substring(0, 50));
                                                chunks.push(chunkStr);
                                            }
                                        } catch (e) {
                                            console.log("📝 Object chunk (parse failed):", chunkStr.substring(0, 50));
                                            chunks.push(chunkStr);
                                        }
                                    } else {
                                        console.log("📝 Object chunk:", chunkStr.substring(0, 50));
                                        chunks.push(chunkStr);
                                    }
                                }
                            } else {
                                // String or other primitive
                                console.log("📝 Primitive chunk:", String(chunk).substring(0, 50));
                                chunks.push(String(chunk));
                            }
                        }

                        // Join all chunks - they should now be properly decoded text
                        responseText = chunks.join('');
                        console.log("📝 Combined extraction response length:", responseText.length);
                        console.log("📝 Combined extraction response start:", responseText.substring(0, 300));
                        console.log("📝 Combined extraction response end:", responseText.substring(responseText.length - 300));

                    } catch (iterError) {
                        console.error("❌ Error processing extraction async iterator:", iterError);
                    }
                }
            }

            // Try to parse as JSON
            if (responseText && responseText.trim()) {
                try {
                    // Find the first complete JSON object
                    let jsonText = responseText.trim();
                    let braceCount = 0;
                    let jsonStart = -1;
                    let jsonEnd = -1;

                    for (let i = 0; i < jsonText.length; i++) {
                        if (jsonText[i] === '{') {
                            if (jsonStart === -1) jsonStart = i;
                            braceCount++;
                        } else if (jsonText[i] === '}') {
                            braceCount--;
                            if (braceCount === 0 && jsonStart !== -1) {
                                jsonEnd = i + 1;
                                break;
                            }
                        }
                    }

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        jsonText = responseText.substring(jsonStart, jsonEnd);
                        console.log("📝 Extracted extraction JSON length:", jsonText.length);
                    }

                    const parsed = JSON.parse(jsonText);
                    console.log("✅ Successfully parsed AgentCore extraction response");
                    console.log("📊 Extraction keys:", Object.keys(parsed));

                    // Handle extraction response format
                    if (parsed.extractedData || parsed.success) {
                        console.log("🎯 Found extraction data in response");
                        return {
                            success: parsed.success || true,
                            message: parsed.message || "Data extracted successfully",
                            extractedData: parsed.extractedData || [],
                            metadata: parsed.metadata || {}
                        };
                    } else {
                        console.log("⚠️ No extraction data found in parsed response");
                    }

                } catch (parseError) {
                    console.log("⚠️ Could not parse AgentCore extraction response as JSON:", parseError);
                    console.log("📄 Extraction response sample:", responseText.substring(0, 500));
                }
            }

            console.log("❌ Response parsing failed - NO FAKE DATA GENERATION");
            return {
                success: false,
                message: "Failed to parse agent response. No fake data will be generated.",
                extractedData: [],
                metadata: {
                    documentName: documentName,
                    extractionMethod: "Response Parse Failed",
                    error: "Agent response parsing failed",
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error("❌ Error transforming AgentCore extraction response:", error);
            return {
                success: false,
                message: "Failed to transform agent response. No fake data will be generated.",
                extractedData: [],
                metadata: {
                    documentName: documentName,
                    extractionMethod: "Transform Failed",
                    error: "Response transformation failed",
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    private async transformAgentCoreResponse(agentResponse: any, request: ReconciliationRequest): Promise<AgentCoreResponse> {
        // Transform AWS Bedrock AgentCore response to our expected format
        try {
            console.log("🔍 Processing AgentCore response...");
            console.log("📦 Response type:", typeof agentResponse);
            console.log("📦 Response keys:", Object.keys(agentResponse));

            let responseText = "";

            // Handle AWS SDK v3 response format
            if (agentResponse.response) {
                console.log("📡 Processing streaming response...");
                const chunks: string[] = [];

                // Handle async iterator for streaming response
                if (agentResponse.response[Symbol.asyncIterator]) {
                    console.log("🔄 Processing async iterator...");
                    try {
                        for await (const chunk of agentResponse.response) {
                            console.log("📦 Chunk type:", typeof chunk);

                            // Handle different chunk formats
                            if (chunk.bytes) {
                                const chunkText = Buffer.from(chunk.bytes).toString();
                                console.log("📝 Direct bytes chunk:", chunkText.substring(0, 100));
                                chunks.push(chunkText);
                            } else if (chunk.chunk && chunk.chunk.bytes) {
                                const chunkText = Buffer.from(chunk.chunk.bytes).toString();
                                console.log("📝 Nested bytes chunk:", chunkText.substring(0, 100));
                                chunks.push(chunkText);
                            } else if (typeof chunk === 'object') {
                                // This is likely a Buffer object serialized as JSON
                                // Convert it back to actual text
                                if (chunk.type === 'Buffer' && Array.isArray(chunk.data)) {
                                    const chunkText = Buffer.from(chunk.data).toString();
                                    console.log("📝 Buffer object chunk:", chunkText.substring(0, 50));
                                    chunks.push(chunkText);
                                } else if (Array.isArray(chunk)) {
                                    // Direct array of bytes
                                    const chunkText = Buffer.from(chunk).toString();
                                    console.log("📝 Array chunk:", chunkText.substring(0, 50));
                                    chunks.push(chunkText);
                                } else {
                                    // This might be a JSON string representation of a Buffer
                                    const chunkStr = JSON.stringify(chunk);
                                    if (chunkStr.includes('"type":"Buffer"') && chunkStr.includes('"data":')) {
                                        try {
                                            const bufferObj = JSON.parse(chunkStr);
                                            if (bufferObj.type === 'Buffer' && bufferObj.data) {
                                                const chunkText = Buffer.from(bufferObj.data).toString();
                                                console.log("📝 JSON Buffer chunk:", chunkText.substring(0, 50));
                                                chunks.push(chunkText);
                                            } else {
                                                console.log("📝 Object chunk:", chunkStr.substring(0, 50));
                                                chunks.push(chunkStr);
                                            }
                                        } catch (e) {
                                            console.log("📝 Object chunk (parse failed):", chunkStr.substring(0, 50));
                                            chunks.push(chunkStr);
                                        }
                                    } else {
                                        console.log("📝 Object chunk:", chunkStr.substring(0, 50));
                                        chunks.push(chunkStr);
                                    }
                                }
                            } else {
                                // String or other primitive
                                console.log("📝 Primitive chunk:", String(chunk).substring(0, 50));
                                chunks.push(String(chunk));
                            }
                        }

                        // Join all chunks - they should now be properly decoded text
                        responseText = chunks.join('');
                        console.log("📝 Combined response length:", responseText.length);
                        console.log("📝 Combined response start:", responseText.substring(0, 300));
                        console.log("📝 Combined response end:", responseText.substring(responseText.length - 300));

                    } catch (iterError) {
                        console.error("❌ Error processing async iterator:", iterError);
                    }
                } else if (Array.isArray(agentResponse.response)) {
                    // Handle array of chunks
                    console.log("📋 Processing array response...");
                    for (const chunk of agentResponse.response) {
                        if (chunk.bytes) {
                            chunks.push(Buffer.from(chunk.bytes).toString());
                        }
                    }
                    responseText = chunks.join('');
                }
            } else if (agentResponse.payload) {
                // Handle direct payload
                console.log("📦 Processing direct payload...");
                if (typeof agentResponse.payload === 'string') {
                    responseText = agentResponse.payload;
                } else if (agentResponse.payload.bytes) {
                    responseText = Buffer.from(agentResponse.payload.bytes).toString();
                } else {
                    responseText = JSON.stringify(agentResponse.payload);
                }
            } else if (typeof agentResponse === 'string') {
                responseText = agentResponse;
            }

            console.log("📝 Response text length:", responseText.length);
            console.log("📄 Response preview:", responseText.substring(0, 500));

            // Try to parse as JSON
            if (responseText && responseText.trim()) {
                try {
                    // Try to find the first complete JSON object
                    let jsonText = responseText.trim();

                    // Look for the first complete JSON object
                    let braceCount = 0;
                    let jsonStart = -1;
                    let jsonEnd = -1;

                    for (let i = 0; i < jsonText.length; i++) {
                        if (jsonText[i] === '{') {
                            if (jsonStart === -1) jsonStart = i;
                            braceCount++;
                        } else if (jsonText[i] === '}') {
                            braceCount--;
                            if (braceCount === 0 && jsonStart !== -1) {
                                jsonEnd = i + 1;
                                break;
                            }
                        }
                    }

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        jsonText = responseText.substring(jsonStart, jsonEnd);
                        console.log("📝 Extracted JSON object length:", jsonText.length);
                        console.log("📄 JSON preview:", jsonText.substring(0, 300));
                    }

                    // Now try to parse the JSON
                    const parsed = JSON.parse(jsonText);
                    console.log("✅ Successfully parsed AgentCore JSON response");
                    console.log("📊 Parsed keys:", Object.keys(parsed));

                    // Handle our agent's structured response
                    if (parsed.reconciliationResults || parsed.analysis) {
                        console.log("🎯 Found reconciliation results in response");
                        console.log(`📊 Analysis insights: ${parsed.summary?.insights?.length || 0} insights generated`);
                        console.log(`🔍 Discrepancy analysis: ${JSON.stringify(parsed.summary?.discrepancyAnalysis || {})}`);
                        
                        // DEBUG: Check what reconciliationResults actually contains
                        console.log(`🔍 DEBUG: reconciliationResults type: ${typeof parsed.reconciliationResults}`);
                        console.log(`🔍 DEBUG: reconciliationResults length: ${parsed.reconciliationResults?.length || 'undefined'}`);
                        if (parsed.reconciliationResults && parsed.reconciliationResults.length > 0) {
                            console.log(`🔍 DEBUG: First result sample: ${JSON.stringify(parsed.reconciliationResults[0]).substring(0, 400)}`);
                            console.log(`🔍 DEBUG: First result keys: ${Object.keys(parsed.reconciliationResults[0]).join(', ')}`);
                            
                            // Count Rest ID matches in agent response
                            let agentRestIdMatches = 0;
                            let agentExactAmountMatches = 0;
                            
                            try {
                                parsed.reconciliationResults.forEach((result: any, idx: number) => {
                                    const leftRestId = result.leftTransaction?.['Rest ID'];
                                    const rightDesc = result.rightTransaction?.Description || '';
                                    const leftAmt = parseFloat(result.leftTransaction?.Amount || 0);
                                    const rightAmt = parseFloat(result.rightTransaction?.Amount || 0);
                                    
                                    // Check Rest ID match
                                    const storeMatch = rightDesc.match(/#(\d+)/);
                                    if (storeMatch && leftRestId == storeMatch[1]) {
                                        agentRestIdMatches++;
                                        console.log(`🎯 AGENT REST ID MATCH ${agentRestIdMatches}: ${leftRestId} = #${storeMatch[1]} (confidence: ${result.confidence}%)`);
                                    }
                                    
                                    // Check exact amount match
                                    if (Math.abs(leftAmt - rightAmt) <= 0.01) {
                                        agentExactAmountMatches++;
                                        console.log(`💰 AGENT EXACT AMOUNT MATCH ${agentExactAmountMatches}: ${leftAmt} = ${rightAmt} (confidence: ${result.confidence}%)`);
                                    }
                                });
                                
                                console.log(`🔍 DEBUG: Agent found ${agentRestIdMatches} Rest ID matches, ${agentExactAmountMatches} exact amount matches`);
                            } catch (debugError) {
                                console.log(`⚠️ DEBUG ERROR: ${debugError}`);
                            }
                        }

                        return {
                            reconciliationResults: parsed.reconciliationResults || [],
                            summary: parsed.summary || {
                                totalTransactions: 0,
                                reconciledCount: 0,
                                unreconciledCount: 0,
                                confidenceScore: 0,
                                reconciliationRate: 0,
                                insights: [],
                                recommendations: []
                            }
                        };
                    } else {
                        console.log("⚠️ No reconciliation results found in parsed response");
                    }

                } catch (parseError) {
                    console.log("⚠️ Could not parse AgentCore response as JSON:", parseError);
                    console.log("📄 Response sample:", responseText.substring(0, 500));
                }
            } else {
                console.log("⚠️ Empty or invalid response text");
            }

            console.log("❌ Response parsing failed - NO FALLBACK");
            return {
                reconciliationResults: [],
                summary: {
                    totalTransactions: 0,
                    reconciledCount: 0,
                    unreconciledCount: 0,
                    confidenceScore: 0
                }
            };
        } catch (error) {
            console.error("❌ Error transforming AgentCore response:", error);
            return {
                reconciliationResults: [],
                summary: {
                    totalTransactions: 0,
                    reconciledCount: 0,
                    unreconciledCount: 0,
                    confidenceScore: 0
                }
            };
        }
    }

    private async convertExcelToJson(documentUrl: string, documentName: string, extractionRules: any[], profileContext: any): Promise<any> {
        console.log("📊 Starting direct Excel-to-JSON conversion...");
        console.log(`🔗 Document URL: ${documentUrl}`);
        console.log(`📄 Document Name: ${documentName}`);

        try {
            // Download the Excel file
            console.log("📥 Downloading Excel file...");
            const response = await fetch(documentUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to download Excel file: ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Use a library to parse Excel (you'll need to install xlsx)
            // For now, I'll create a placeholder that simulates the structure
            console.log("📊 Converting Excel to JSON format...");
            
            // Detect document type based on filename and structure
            const documentType = this.detectPosDocumentType(documentName);
            console.log(`🎯 Detected document type: ${documentType.type} (confidence: ${documentType.confidence}%)`);

            // Create structured JSON data from Excel
            const extractedData = await this.parseExcelToStructuredJson(buffer, documentName, documentType);

            console.log(`✅ Excel-to-JSON conversion completed: ${extractedData.length} records`);

            return {
                success: true,
                message: `Successfully converted Excel to JSON: ${extractedData.length} records extracted`,
                extractedData: extractedData,
                metadata: {
                    documentUrl: documentUrl,
                    documentName: documentName,
                    extractionMethod: "Direct Excel-to-JSON Conversion",
                    documentType: documentType,
                    extractionConfidence: 95.0, // High confidence for direct Excel parsing
                    recordsExtracted: extractedData.length,
                    timestamp: new Date().toISOString(),
                    profileContext: profileContext,
                    rulesApplied: extractionRules.length,
                    processingOrder: this.getProcessingPriority(documentType.type),
                    note: "Direct Excel-to-JSON conversion - no LLM processing"
                }
            };

        } catch (error: any) {
            console.error("❌ Excel-to-JSON conversion failed:", error.message);
            throw error;
        }
    }

    private detectPosDocumentType(documentName: string): { type: string, confidence: number, priority: number } {
        const nameLower = documentName.toLowerCase();
        
        // Monthly POS Statement indicators
        if (nameLower.includes('monthly') || nameLower.includes('month') || nameLower.includes('summary')) {
            return { type: 'monthly_pos_statement', confidence: 90, priority: 1 };
        }
        
        // Store POS Statement indicators  
        if (nameLower.includes('store') || nameLower.includes('location') || nameLower.includes('branch')) {
            return { type: 'store_pos_statement', confidence: 85, priority: 2 };
        }
        
        // Line Items indicators
        if (nameLower.includes('line') || nameLower.includes('item') || nameLower.includes('transaction') || nameLower.includes('detail')) {
            return { type: 'line_items', confidence: 80, priority: 3 };
        }
        
        // Default to line items if unclear
        return { type: 'line_items', confidence: 60, priority: 3 };
    }

    private getProcessingPriority(documentType: string): number {
        const priorityMap: { [key: string]: number } = {
            'monthly_pos_statement': 1,  // Process first
            'store_pos_statement': 2,   // Process second  
            'line_items': 3,            // Process last
            'unknown_pos_document': 4   // Process after known types
        };
        return priorityMap[documentType] || 5;
    }

    private async parseExcelToStructuredJson(buffer: Buffer, documentName: string, documentType: any): Promise<any[]> {
        console.log("📊 Parsing Excel buffer to structured JSON using xlsx library...");
        
        try {
            // Import xlsx library using ES modules
            const XLSX = await import('xlsx');
            
            // Parse Excel file from buffer
            console.log("📖 Reading Excel workbook from buffer...");
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            
            // Get sheet names
            const sheetNames = workbook.SheetNames;
            console.log(`📋 Excel file has ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);
            
            // Select the best sheet (first sheet or one with POS keywords)
            let selectedSheet = sheetNames[0];
            const posKeywords = ['pos', 'statement', 'monthly', 'store', 'transaction', 'line', 'item'];
            
            for (const sheetName of sheetNames) {
                const sheetLower = sheetName.toLowerCase();
                if (posKeywords.some(keyword => sheetLower.includes(keyword))) {
                    selectedSheet = sheetName;
                    break;
                }
            }
            
            console.log(`📋 Selected sheet: ${selectedSheet}`);
            
            // Get worksheet
            const worksheet = workbook.Sheets[selectedSheet];
            
            // Convert to JSON
            console.log("🔄 Converting Excel sheet to JSON...");
            const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, // Use first row as header
                defval: null // Use null for empty cells
            });
            
            if (rawJsonData.length === 0) {
                console.log("⚠️ No data found in Excel sheet");
                return [];
            }
            
            // Process the data to create structured JSON
            const headers = rawJsonData[0] as string[];
            const dataRows = rawJsonData.slice(1);
            
            console.log(`📊 Processing ${dataRows.length} data rows with ${headers.length} columns`);
            console.log(`📋 Headers: ${headers.join(', ')}`);
            
            const extractedData: any[] = [];
            
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i] as any[];
                const record: any = {};
                
                // Convert row array to object using headers
                for (let j = 0; j < headers.length; j++) {
                    const header = headers[j];
                    const value = row[j];
                    
                    if (header && value !== null && value !== undefined && value !== '') {
                        // Clean header name
                        const cleanHeader = String(header).trim().replace(/\n/g, ' ').replace(/\r/g, '');
                        
                        // Process value based on type
                        if (typeof value === 'number') {
                            record[cleanHeader] = value;
                        } else if (value instanceof Date) {
                            record[cleanHeader] = value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                        } else {
                            const stringValue = String(value).trim();
                            if (stringValue && stringValue.toLowerCase() !== 'null') {
                                record[cleanHeader] = stringValue;
                            }
                        }
                    }
                }
                
                // Only add non-empty records
                if (Object.keys(record).length > 0) {
                    // Add metadata
                    record._row_number = i + 2; // +2 because we skip header and arrays are 0-indexed
                    record._document_type = documentType.type;
                    record._processing_priority = documentType.priority;
                    record._source = 'Direct Excel Parsing';
                    record._sheet_name = selectedSheet;
                    
                    extractedData.push(record);
                }
            }
            
            console.log(`✅ Excel parsing completed: ${extractedData.length} valid records extracted`);
            
            return extractedData;

        } catch (error) {
            console.error("❌ Error parsing Excel buffer:", error);
            throw new Error(`Excel parsing failed: ${error}`);
        }
    }

    private fallbackExtraction(documentUrl: string, documentName: string): any {
        console.log("❌ FALLBACK EXTRACTION DISABLED - NO FAKE DATA GENERATION");
        console.log("🚫 All extraction methods failed - returning error instead of generating fake data");

        // Determine file type for error message
        const fileExtension = documentName.toLowerCase().split('.').pop() || '';
        const isExcelFile = ['xlsx', 'xls'].includes(fileExtension);

        return {
            success: false,
            message: `Extraction failed for ${documentName}. ${isExcelFile ? 'Excel files require valid document URL for processing.' : 'Only Excel files (.xlsx, .xls) are supported.'}`,
            extractedData: [],
            metadata: {
                documentUrl: documentUrl,
                documentName: documentName,
                extractionMethod: "Fallback Disabled",
                extractionConfidence: 0,
                recordsExtracted: 0,
                timestamp: new Date().toISOString(),
                rulesApplied: 0,
                fileType: fileExtension.toUpperCase(),
                error: "Fallback extraction disabled - no fake data generation",
                note: isExcelFile ? "Excel files require valid document URL and direct Excel-to-JSON conversion" : "Only Excel files are supported for extraction"
            }
        };
    }

    private enhancedFallbackReconciliation(request: ReconciliationRequest): AgentCoreResponse {
        console.log("🔧 Performing enhanced AI-like reconciliation fallback...");

        const results: any[] = [];
        const matchedRightIndices = new Set<number>();

        // Enhanced AI-like matching logic
        for (const leftTx of request.leftDocument) {
            let bestMatch: any = null;
            let bestConfidence = 0;
            let bestMatchIndex = -1;
            let matchedFields: string[] = [];
            let aiReasoning = "";
            let discrepancies: string[] = [];

            for (let i = 0; i < request.rightDocument.length; i++) {
                if (matchedRightIndices.has(i)) continue;

                const rightTx = request.rightDocument[i];
                let confidence = 0;
                let currentMatchedFields: string[] = [];
                let currentDiscrepancies: string[] = [];

                // 1. Apply custom matching rules (highest priority)
                for (const rule of request.matchingRules) {
                    for (const pair of rule.rules) {
                        const leftValue = leftTx[pair.term1];
                        const rightValue = rightTx[pair.term2];

                        if (leftValue && rightValue) {
                            const leftStr = String(leftValue).trim().toLowerCase();
                            const rightStr = String(rightValue).trim().toLowerCase();

                            if (leftStr === rightStr) {
                                confidence += 25;
                                currentMatchedFields.push(`${pair.term1}↔${pair.term2} (Exact)`);
                            } else if (this.calculateSimilarity(leftStr, rightStr) > 0.8) {
                                confidence += 15;
                                currentMatchedFields.push(`${pair.term1}↔${pair.term2} (Similar)`);
                                currentDiscrepancies.push(`${pair.term1}: "${leftValue}" vs "${rightValue}"`);
                            }
                        }
                    }
                }

                // 2. Amount matching with tolerance
                if (leftTx.Amount !== undefined && rightTx.Amount !== undefined) {
                    const leftAmount = Number(leftTx.Amount);
                    const rightAmount = Number(rightTx.Amount);
                    const difference = Math.abs(leftAmount - rightAmount);

                    if (difference < 0.01) {
                        confidence += 30;
                        currentMatchedFields.push("Amount (Exact)");
                    } else if (difference / Math.max(leftAmount, rightAmount) < 0.01) {
                        confidence += 20;
                        currentMatchedFields.push("Amount (Close)");
                        currentDiscrepancies.push(`Amount difference: $${difference.toFixed(2)}`);
                    }
                }

                // 3. Date proximity matching
                if (leftTx.Date && rightTx.Date) {
                    const leftDate = new Date(leftTx.Date);
                    const rightDate = new Date(rightTx.Date);
                    const daysDiff = Math.abs((leftDate.getTime() - rightDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysDiff === 0) {
                        confidence += 20;
                        currentMatchedFields.push("Date (Same Day)");
                    } else if (daysDiff <= 1) {
                        confidence += 15;
                        currentMatchedFields.push("Date (Next Day)");
                    } else if (daysDiff <= 3) {
                        confidence += 10;
                        currentMatchedFields.push("Date (Within 3 Days)");
                        currentDiscrepancies.push(`Date difference: ${daysDiff} days`);
                    }
                }

                // 4. Description/Reference similarity
                if (leftTx.Description && rightTx.Description) {
                    const similarity = this.calculateSimilarity(
                        String(leftTx.Description).toLowerCase(),
                        String(rightTx.Description).toLowerCase()
                    );

                    if (similarity > 0.9) {
                        confidence += 15;
                        currentMatchedFields.push("Description (Very Similar)");
                    } else if (similarity > 0.7) {
                        confidence += 10;
                        currentMatchedFields.push("Description (Similar)");
                    }
                }

                // 5. Reference ID matching
                if (leftTx.ReferenceId && rightTx.ReferenceId) {
                    if (leftTx.ReferenceId === rightTx.ReferenceId) {
                        confidence += 25;
                        currentMatchedFields.push("Reference ID (Exact)");
                    }
                }

                // Update best match if this is better
                if (confidence > bestConfidence && confidence > 50) { // Minimum 50% confidence
                    bestMatch = rightTx;
                    bestConfidence = confidence;
                    bestMatchIndex = i;
                    matchedFields = currentMatchedFields;
                    discrepancies = currentDiscrepancies;
                    aiReasoning = this.generateAIReasoning(confidence, currentMatchedFields, currentDiscrepancies);
                }
            }

            // Record the result
            const isReconciled = bestMatch !== null && bestConfidence >= 80;
            if (isReconciled && bestMatchIndex >= 0) {
                matchedRightIndices.add(bestMatchIndex);
            }

            results.push({
                leftTransaction: leftTx,
                rightTransaction: bestMatch,
                isReconciled,
                matchedFields,
                confidence: Math.min(bestConfidence, 100),
                aiReasoning: aiReasoning || (bestMatch ? "Partial match found but below confidence threshold" : "No suitable match found in right document"),
                discrepancies: discrepancies,
            });
        }

        // Add unmatched right transactions
        request.rightDocument.forEach((rightTx, idx) => {
            if (!matchedRightIndices.has(idx)) {
                results.push({
                    leftTransaction: {},
                    rightTransaction: rightTx,
                    isReconciled: false,
                    matchedFields: [],
                    confidence: 0,
                    aiReasoning: "Unmatched transaction from right document - no corresponding entry found in left document",
                    discrepancies: ["No corresponding transaction in left document"],
                });
            }
        });

        const reconciledCount = results.filter(r => r.isReconciled).length;
        const avgConfidence = results.length > 0
            ? results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length
            : 0;

        console.log(`✅ Enhanced AI fallback completed: ${reconciledCount}/${results.length} reconciled (${avgConfidence.toFixed(1)}% avg confidence)`);

        return {
            reconciliationResults: results,
            summary: {
                totalTransactions: results.length,
                reconciledCount,
                unreconciledCount: results.length - reconciledCount,
                confidenceScore: avgConfidence,
            },
        };
    }

    private calculateSimilarity(str1: string, str2: string): number {
        // Enhanced Jaccard similarity with word-level analysis
        const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2));

        if (words1.size === 0 && words2.size === 0) return 1;
        if (words1.size === 0 || words2.size === 0) return 0;

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    private async callAWSBedrockAgentCore(documentUrl: string, documentName: string, extractionRules: any[], profileContext: any, base64Image?: string | null): Promise<any> {
        try {
            console.log("🚀 Calling AWS Bedrock AgentCore for extraction...");

            // Build the extraction payload for AgentCore
            const payload = {
                operation: "extract",
                prompt: base64Image
                    ? "Please analyze this document image and extract all financial transaction data. Look for dates, amounts, descriptions, reference numbers, and any other transaction details."
                    : "Please extract financial transaction data from this document using advanced AI analysis with enhanced Excel processing",
                context: {
                    profile: profileContext,
                    extraction_rules: extractionRules,
                },
                data: {
                    documentUrl: documentUrl,
                    documentName: documentName,
                    documentImage: base64Image,
                    hasImage: !!base64Image
                },
                sessionId: this.sessionId,
            };

            // Call AWS Bedrock AgentCore using the proper AWS SDK v3
            console.log(`📍 Agent ARN: ${this.agentArn}`);
            console.log(`📄 Document: ${documentName}`);
            console.log(`📊 Extraction Rules: ${extractionRules.length}`);

            const command = new InvokeAgentRuntimeCommand({
                agentRuntimeArn: this.agentArn,
                runtimeSessionId: this.sessionId,
                payload: JSON.stringify(payload)
            });

            const response = await this.bedrockAgentCoreClient.send(command);
            console.log("✅ AWS Bedrock AgentCore extraction response received");

            // Parse and transform the AgentCore response
            return await this.transformExtractionResponse(response, documentName);

        } catch (error: any) {
            console.error("❌ AWS Bedrock AgentCore call failed:", error.message);
            throw error;
        }
    }

    private async callLocalPythonAgent(documentUrl: string, documentName: string, extractionRules: any[], profileContext: any, base64Image?: string | null): Promise<any> {
        try {
            console.log("🐍 Calling local Python agent for extraction...");

            const payload = {
                operation: "extract",
                document_url: documentUrl,
                document_name: documentName,
                document_image: base64Image,
                extraction_rules: extractionRules,
                profile_context: profileContext
            };

            const response = await fetch('http://localhost:8000/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Local agent responded with status: ${response.status}`);
            }

            const result = await response.json();
            console.log("✅ Local Python agent extraction completed");
            console.log(`📊 Extracted ${result.extractedData?.length || 0} records`);

            return {
                success: result.success || true,
                message: result.message || "Extraction completed",
                extractedData: result.extractedData || [],
                metadata: result.metadata || {}
            };

        } catch (error: any) {
            console.error("❌ Local Python agent call failed:", error.message);
            throw error;
        }
    }

    private generateAIReasoning(confidence: number, matchedFields: string[], discrepancies: string[]): string {
        if (confidence >= 95) {
            return `Excellent match (${confidence.toFixed(1)}%) with strong alignment across ${matchedFields.join(', ')}. ${discrepancies.length === 0 ? 'Perfect field alignment.' : 'Minor discrepancies within acceptable tolerance.'}`;
        } else if (confidence >= 85) {
            return `High confidence match (${confidence.toFixed(1)}%) based on ${matchedFields.join(', ')}. ${discrepancies.length > 0 ? `Note: ${discrepancies.join(', ')}.` : 'Strong field correlation detected.'}`;
        } else if (confidence >= 70) {
            return `Good match (${confidence.toFixed(1)}%) with correlation in ${matchedFields.join(', ')}. ${discrepancies.length > 0 ? `Discrepancies: ${discrepancies.join(', ')}.` : ''} Recommended for review.`;
        } else if (confidence >= 50) {
            return `Moderate match (${confidence.toFixed(1)}%) based on ${matchedFields.join(', ')}. Requires manual review due to ${discrepancies.length > 0 ? discrepancies.join(', ') : 'insufficient matching criteria'}.`;
        } else {
            return `Low confidence (${confidence.toFixed(1)}%). Significant differences detected. Manual intervention recommended.`;
        }
    }
}

export const agentCoreService = new AgentCoreService();