// Test AgentCore reconciliation integration
const axios = require('axios');

async function testReconciliation() {
    console.log('🧪 Testing AgentCore reconciliation...');
    
    const testData = {
        bankTransactions: [
            {
                id: 'bank_001',
                date: '2024-01-15',
                amount: 1500.00,
                description: 'Payment from ABC Corp',
                type: 'credit'
            },
            {
                id: 'bank_002', 
                date: '2024-01-16',
                amount: -250.75,
                description: 'Office supplies purchase',
                type: 'debit'
            }
        ],
        systemTransactions: [
            {
                id: 'sys_001',
                date: '2024-01-15',
                amount: 1500.00,
                description: 'ABC Corp invoice payment',
                category: 'revenue'
            },
            {
                id: 'sys_002',
                date: '2024-01-16', 
                amount: 250.75,
                description: 'Stationery and supplies',
                category: 'expenses'
            }
        ]
    };

    try {
        const response = await axios.post('http://localhost:3001/api/profiles/reconcile', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ AgentCore reconciliation successful!');
        console.log('📊 Results:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ AgentCore reconciliation failed:', error.response?.data || error.message);
        console.log('🔄 Check if fallback was used...');
    }
}

testReconciliation();