import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CarePlanNewForm from '@/components/CarePlanNewForm'

interface PageProps {
  searchParams: Promise<{
    companionId?: string
    serviceId?: string
    elderProfileId?: string
    sessionId?: string
  }>
}

export const metadata = { title: 'New Care Plan — NearDear' }

export default async function CarePlanNewPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { companionId, serviceId, elderProfileId } = await searchParams

  let companionName: string | undefined
  let serviceName: string | undefined
  let serviceFee: number | undefined
  let elderName: string | undefined

  if (companionId) {
    const companion = await prisma.providerProfile.findUnique({
      where: { id: companionId },
      select: { legalName: true },
    })
    companionName = companion?.legalName
  }

  if (serviceId) {
    const service = await prisma.serviceCategory.findUnique({
      where: { id: serviceId },
      select: { name: true, suggestedFeeMin: true },
    })
    serviceName = service?.name
    serviceFee = service?.suggestedFeeMin
  }

  if (elderProfileId) {
    const elder = await prisma.elderProfile.findUnique({
      where: { id: elderProfileId },
      select: { name: true },
    })
    elderName = elder?.name
  }

  return (
    <CarePlanNewForm
      prefill={{
        companionId,
        companionName,
        serviceId,
        serviceName,
        serviceFee,
        elderProfileId,
        elderName,
      }}
    />
  )
}
