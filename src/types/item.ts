export interface Item {
  id: number
  name: string
  numSerie: string
  description: string
  image: string
  owner: string
  ownerName: string
  isCertified: boolean
  certifiedBy: string
  forSale: boolean
  price: bigint
  transactionCount: number
  proofImage: string
}

export interface NewItem {
  name: string
  numSerie: string
  description: string
  image: File | null
  proofImage: File | null
  imageUrl: string
  proofImageUrl: string
}

export interface UserData {
  name: string
  email: string
  location: string
  status: boolean
}