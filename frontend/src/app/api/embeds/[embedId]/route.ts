import { NextResponse } from 'next/server';

// This function is required for static site generation with output: 'export'
// It pre-generates all possible paths for this dynamic route
export function generateStaticParams() {
  // Return an array of objects with the embedId values that should be pre-rendered
  // These should match the IDs used in your mock data or actual database
  return [
    { embedId: 'e0559171-461f-4831-b940-9ac73d30cf11' },
    { embedId: '8b886242-0d33-424e-856f-e9777a77c127' }
  ];
}

// Function to get the embed from a data source
// Uses live API in production and mock data in development if configured
async function getEmbedFromDataSource(embedId: string) {
  try {
    // Check if we should use mock data (for development/testing)
    // In Next.js, we need to explicitly check for the string 'true' since env vars are always strings
    const useMockData = process.env.USE_MOCK_DATA === 'true';
    
    console.log('USE_MOCK_DATA env var:', process.env.USE_MOCK_DATA);
    console.log('Using mock data?', useMockData);
    
    // Only use mock data if explicitly enabled via environment variable
    if (useMockData && (embedId === 'e0559171-461f-4831-b940-9ac73d30cf11' || 
        embedId === '8b886242-0d33-424e-856f-e9777a77c127')) {
      console.log('Using mock data for embed:', embedId);
      return {
        id: embedId,
        name: 'Test Embed',
        apiKeyId: 'test-api-key',
        modelName: 'gpt-4',
        modelVendor: 'openai',
        systemPrompt: 'You are a helpful assistant for our website visitors.',
        responsive: true,
        width: 400,
        height: 500,
        theme: 'light',
        position: 'bottom-right',
        primaryColor: '#000000',
        welcomeMessage: '👋 Hi! How can I help you today?',
        settings: {
          customHeaderText: 'Chat with us',
          customPlaceholderText: 'Type your message...',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // For all other cases, fetch from the actual API
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';
    console.log('Fetching embed data from API for:', embedId);
    console.log('API URL:', apiUrl);
    
    // Use the public embeds endpoint as seen in the logs
    const response = await fetch(`${apiUrl}/public/embeds/${embedId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching embed data:', error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { embedId: string } }
) {
  const embedId = params.embedId;
  
  try {
    // Fetch the embed data from our data source
    const embedData = await getEmbedFromDataSource(embedId);
    
    // If embed not found, return 404
    if (!embedData) {
      return new NextResponse(JSON.stringify({ error: 'Embed not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Return the embed data
    return NextResponse.json(embedData);
  } catch (error) {
    console.error('Error in embed API route:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch embed configuration' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 