// lib/ipfs-upload.ts
export interface UploadResult {
  ipfsUrl: string;
  cid: string;
  pinataUrl?: string;
}

export async function uploadToIPFS(file: File): Promise<UploadResult> {
  try {
    console.log("Uploading file to Pinata:", file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    // Optional: Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        'uploaded-at': new Date().toISOString(),
        'original-name': file.name,
        'file-type': file.type,
        'file-size': file.size.toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Optional: Pinning options
    const options = JSON.stringify({
      cidVersion: 1, // Use CIDv1 (recommended)
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Pinata API error: ${response.status} - ${errorData.error?.details || 'Unknown error'}`);
    }

    const result = await response.json();
    const cid = result.IpfsHash;
    const ipfsUrl = `ipfs://${cid}`;
    const pinataUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    console.log('Successfully uploaded to Pinata:', { cid, ipfsUrl });

    return { 
      ipfsUrl, 
      cid,
      pinataUrl 
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}