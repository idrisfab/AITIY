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

// Placeholder function to get the embed from a data source
// In a real implementation, this would fetch from a database
async function getEmbedFromDataSource(embedId: string) {
  try {
    // For testing purposes, return mock data if the embedId matches one of our test IDs
    // This should be replaced with actual database calls in production
    if (embedId === 'e0559171-461f-4831-b940-9ac73d30cf11' || 
        embedId === '8b886242-0d33-424e-856f-e9777a77c127') {
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

    // For other embed IDs, we can implement actual database calls here
    return null;
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