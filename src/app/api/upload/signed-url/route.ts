import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import { auth } from '@/lib/auth'

const ALLOWED_TYPES = ['selfie', 'address_proof', 'pcc'] as const
type UploadType = (typeof ALLOWED_TYPES)[number]

const CONTENT_TYPES: Record<UploadType, string> = {
  selfie: 'image/jpeg',
  address_proof: 'application/octet-stream',
  pcc: 'application/octet-stream',
}

function getS3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

// Application uploads (selfie, address proof, PCC) happen before the applicant
// has an OTP session, so we allow these types unauthenticated. Authenticated
// uploads keep the user's id in the key for traceability.
const APPLICATION_TYPES = new Set<UploadType>(['selfie', 'address_proof', 'pcc'])

export async function GET(req: NextRequest) {
  const session = await auth()

  const { searchParams } = new URL(req.url)
  const rawType = searchParams.get('type')

  if (!rawType || !(ALLOWED_TYPES as readonly string[]).includes(rawType)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const uploadType = rawType as UploadType

  if (!session?.user?.id && !APPLICATION_TYPES.has(uploadType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucketName = process.env.R2_BUCKET_NAME
  const publicBaseUrl = process.env.R2_PUBLIC_URL

  if (!bucketName || !publicBaseUrl) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
  }

  const timestamp = Date.now()
  const ownerSegment = session?.user?.id ?? `applicant-${randomUUID()}`
  const key = `${uploadType}/${ownerSegment}/${timestamp}`

  try {
    const client = getS3Client()

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: CONTENT_TYPES[uploadType],
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 })

    const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${key}`

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (err) {
    console.error('[upload/signed-url] error:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
