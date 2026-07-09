import { list, del } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Ensure the call is authorized by Vercel's Cron Secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { blobs } = await list();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const deletedList = [];

    for (const blob of blobs) {
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      // If the file was uploaded more than 24 hours ago, delete it
      if (now - uploadedAt > oneDay) {
        await del(blob.url);
        deletedList.push(blob.url);
      }
    }

    return new Response(JSON.stringify({ success: true, deleted: deletedList }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
