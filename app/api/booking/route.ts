import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Honeypot check: reject bots immediately
    const botcheck = formData.get('botcheck');
    if (botcheck) {
      return NextResponse.json(
        { success: false, message: 'Bot verification triggered.' },
        { status: 400 }
      );
    }

    // Fetch the access key securely from environment variables
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      console.error('WEB3FORMS_ACCESS_KEY is not defined in environment variables.');
      return NextResponse.json(
        { success: false, message: 'Configuration error: API key missing.' },
        { status: 500 }
      );
    }

    // Prepare outgoing request to Web3Forms
    const outgoingFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      outgoingFormData.append(key, value);
    }
    outgoingFormData.append('access_key', accessKey);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: outgoingFormData,
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error occurred during transmission.' },
      { status: 500 }
    );
  }
}
