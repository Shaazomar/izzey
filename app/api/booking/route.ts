import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    // Extract booking data from request
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const services = formData.get('services') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;

    if (!name || !email || !phone || !address || !services || !date || !time) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Save enquiry to database
    const enquiry = await prisma.enquiry.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        address,
        service: services,
        date,
        time,
        status: 'PENDING',
      },
    });

    // Fetch the access key securely from environment variables
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY;
    
    // Optionally notify via Web3Forms if a valid key is set up
    if (accessKey && accessKey !== 'YOUR_WEB3FORMS_KEY_HERE') {
      try {
        const outgoingFormData = new FormData();
        outgoingFormData.append('access_key', accessKey);
        outgoingFormData.append('subject', `New Izzey Booking: ${services} from ${name}`);
        outgoingFormData.append('from_name', 'Izzey CRM');
        outgoingFormData.append('name', name);
        outgoingFormData.append('email', email);
        outgoingFormData.append('phone', phone);
        outgoingFormData.append('address', address);
        outgoingFormData.append('service', services);
        outgoingFormData.append('date', date);
        outgoingFormData.append('time', time);

        // Fetch asynchronously in the background so client doesn't wait
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: outgoingFormData,
        }).catch((err) => console.error('Web3Forms background submit failed:', err));
      } catch (err) {
        console.error('Error triggering Web3Forms notification:', err);
      }
    }

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error: any) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error occurred during transmission.' },
      { status: 500 }
    );
  }
}
