import fetch from 'node-fetch';

async function testGeneration() {
  const url = 'http://localhost:3000/api/documents/generate';
  const payload = {
    templateId: 'clx9u5g2g00003b6y8z9h4n9f', // This ID will likely need to be adjusted
    slug: 'attestation-residence',
    locale: 'ar-MA',
    payload: {
      declarant: {
        fullName: 'John Doe',
        nationalId: 'AB123456',
        birthDate: '1990-01-01',
        birthPlace: 'Casablanca',
        addressLine1: '123 Main St',
        city: 'Casablanca',
        phone: '0600000000',
      },
      hostedPerson: {
        fullName: 'Jane Doe',
        nationalId: 'CD789012',
        addressLine1: '123 Main St',
      },
      document: {
        issueCity: 'Casablanca',
        issueDate: '2025-11-05',
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You might need to add an Authorization header with a valid token
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testGeneration();
