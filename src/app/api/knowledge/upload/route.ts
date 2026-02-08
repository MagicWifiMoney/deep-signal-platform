import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const instanceId = formData.get('instanceId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, TXT, MD, DOCX' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // In production, this would:
    // 1. Upload to S3 or similar
    // 2. Process/chunk the document
    // 3. Generate embeddings
    // 4. Store in vector database on the instance
    // 5. Update OpenClaw RAG config

    console.log(`Uploading ${file.name} (${file.size} bytes) to instance ${instanceId}`);

    // Simulate processing
    await new Promise(r => setTimeout(r, 2000));

    // Generate mock document info
    const docId = `doc_${Date.now()}`;
    const chunks = Math.ceil(file.size / 1000); // Rough estimate

    return NextResponse.json({
      success: true,
      document: {
        id: docId,
        name: file.name,
        size: file.size,
        type: file.type,
        chunks,
        uploadedAt: new Date().toISOString(),
        status: 'processed',
      },
      message: `Document processed successfully. ${chunks} chunks created.`,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get('instanceId');

  if (!instanceId) {
    return NextResponse.json(
      { error: 'instanceId is required' },
      { status: 400 }
    );
  }

  // Return mock documents for now
  return NextResponse.json({
    instanceId,
    documents: [
      // Empty for now - populated when user uploads
    ],
    stats: {
      totalDocuments: 0,
      totalChunks: 0,
      lastUpdated: null,
    },
  });
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { instanceId, documentId } = body;

    if (!instanceId || !documentId) {
      return NextResponse.json(
        { error: 'instanceId and documentId are required' },
        { status: 400 }
      );
    }

    // In production, remove from vector DB and storage
    console.log(`Deleting document ${documentId} from instance ${instanceId}`);

    await new Promise(r => setTimeout(r, 500));

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
