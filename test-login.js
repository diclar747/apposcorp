
const usersToTest = [
    { email: 'admin@oscorp.com', password: 'admin123', role: 'Admin' },
    { email: 'vendedor1@oscorp.com', password: 'seller123', role: 'Vendedor 1' },
    { email: 'vendedor2@oscorp.com', password: 'seller123', role: 'Vendedor 2' },
    { email: 'tech@oscorp.com', password: 'seller123', role: 'Tech Hub' },
    { email: 'gourmet@oscorp.com', password: 'seller123', role: 'Gourmet' },
    { email: 'super@oscorp.com', password: 'seller123', role: 'Supermercado' },
    { email: 'cliente1@oscorp.com', password: 'client123', role: 'Cliente 1' },
    { email: 'cliente2@oscorp.com', password: 'client123', role: 'Cliente 2' }
];

async function testAllLogins() {
    console.log('=== TESTING ALL LOGINS ===');
    for (const user of usersToTest) {
        console.log(`\nTesting ${user.role} (${user.email})...`);
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, password: user.password })
            });

            console.log(`Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log('SUCCESS: Login successful');
                // console.log('Token:', data.token ? 'Present' : 'Missing');
            } else {
                const text = await response.text();
                console.log('FAILED:', text);
            }
        } catch (error) {
            console.error('ERROR:', error.message);
        }
    }
}

testAllLogins().then(() => testDebug());
