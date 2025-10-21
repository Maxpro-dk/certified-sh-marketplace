import { useState, useEffect } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient
} from 'wagmi'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Loader2, Plus, Filter, ShoppingCart, ArrowRightLeft, Award, Eye, Gavel, CircleOff, User, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { contractAddress, config } from '../lib/wagmi'
import ABI from '@/lib/contract_abi'
import { Dialog } from './ui/dialog'
import { readContract } from '@wagmi/core'
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import AddItemInterface from './AddItem'
import ItemDetails from './ItemDetails'
import UserProfile from './UserProfile'

interface Item {
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

interface NewItem {
  name: string
  numSerie: string
  description: string
  image: string
}

interface TransferData {
  itemId: number
  toAddress: string
}

type FilterType = 'all' | 'my-items' | 'certified' | 'uncertified' | 'for-sale'

export default function MarketplaceInterface({typeItem, itemChanged}: {typeItem?: FilterType,  itemChanged?: boolean}) {
  const { address } = useAccount()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<FilterType>(typeItem ?? 'all')
  const [salePrices, setSalePrices] = useState<{ [key: number]: string }>({})
  const [showUserProfile, setShowUserProfile] = useState(false)

  
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<number | null>(null)

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)


  // Fonction pour ouvrir les détails
  const handleViewDetails = (itemId: number) => {
    setSelectedItemId(itemId)
    setIsDetailsOpen(true)
  }

  // Fonction pour fermer les détails
  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedItemId(null)
  }

  // Fonction pour rafraîchir après une action
  const handleDetailsUpdate = () => {
    refetchItems()
  }

  
  const [transferData, setTransferData] = useState<TransferData>({
    itemId: 0, toAddress: ''
  })

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash })
  const publicClient = usePublicClient()



  const { data: isCertifier } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'certifiers',
    args: [address],
  })

  // Get all items
  const { data: allItemsData, refetch: refetchItems } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'getAllItems',
  })

  // Convert contract data to Item objects
  useEffect(() => {
    if (allItemsData && Array.isArray(allItemsData) && allItemsData.length >= 12) {
      const [ids, names, numSeries, images, descriptions, owners, isCertifieds, forSales, prices, transactionCounts, proofImages, ownerNames] = allItemsData

      const itemsData: Item[] = []
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] && owners[i] !== '0x0000000000000000000000000000000000000000') {
          itemsData.push({
            id: Number(ids[i]),
            name: names[i],
            numSerie: numSeries[i],
            description: descriptions[i],
            image: images[i],
            owner: owners[i],
            ownerName: ownerNames[i] || 'Non enregistré',
            isCertified: isCertifieds[i],
            certifiedBy: '0x0000000000000000000000000000000000000000',
            forSale: forSales[i],
            price: prices[i],
            transactionCount: Number(transactionCounts[i]),
            proofImage: proofImages[i]
          })
        }
      }
      setItems(itemsData)
    }
  }, [allItemsData])

  // Apply filters
  useEffect(() => {
    let filtered = items

    switch (filter) {
      case 'my-items':
        filtered = items.filter(item =>
          item.owner.toLowerCase() === address?.toLowerCase()
        )
        break
      case 'certified':
        filtered = items.filter(item => item.isCertified)
        break
      case 'uncertified':
        filtered = items.filter(item => !item.isCertified)
        break
      case 'for-sale':
        filtered = items.filter(item => item.forSale)
        break
      default:
        filtered = items
    }

    setFilteredItems(filtered)
  }, [items, filter, address])




  // Handle item certification
  const handleCertifyItem = (itemId: number) => {
    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'certifyItem',
      args: [itemId],
    })
  }

  // Handle listing for sale
  const handleListForSale = (itemId: number) => {
    const price = salePrices[itemId]
    if (!price || isNaN(parseFloat(price))) {
      toast.error('Veuillez entrer un prix valide')
      return
    }

    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'listForSale',
      args: [itemId, BigInt(parseFloat(price) * 1e18)],
    })
  }

  // Handle purchase
  const handlePurchase = (itemId: number, price: bigint) => {
    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'buyItem',
      args: [itemId],
      value: price,
    })
  }

  // Handle transfer
  const handleTransfer = () => {
    if (!transferData.toAddress || !/^0x[a-fA-F0-9]{40}$/.test(transferData.toAddress)) {
      toast.error('Veuillez entrer une adresse Ethereum valide')
      return
    }

    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'transferItem',
      args: [transferData.itemId, transferData.toAddress],
    })

    setTransferData({ itemId: 0, toAddress: '' })
    setIsTransferOpen(false)
  }

  const openTransferModal = (itemId: number) => {
    setSelectedItemForTransfer(itemId)
    setTransferData({ ...transferData, itemId })
    setIsTransferOpen(true)
  }

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      refetchItems()
      toast.success('Transaction confirmée avec succès!')
    }
  }, [isConfirmed, publicClient, address,])

 // Handle transaction success
  useEffect(() => {
      console.log("Item changed, refetch items listed");
      refetchItems()
      toast.success('Rafraîchissement des biens effectué!');
    
  }, [itemChanged])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Transférer un bien</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transferAddress">Adresse du destinataire</Label>
                  <Input
                    id="transferAddress"
                    value={transferData.toAddress}
                    onChange={(e) => setTransferData({ ...transferData, toAddress: e.target.value })}
                    placeholder="0x..."
                  />
                </div>
                <Button
                  onClick={handleTransfer}
                  disabled={isPending || isConfirming}
                  className="w-full"
                >
                  {isPending || isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Transférer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

    

      {/* Stats and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {filteredItems.length} bien(s) trouvé(s)
          </div>
      </div>

      {/* Items Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Eye className="h-16 w-16 mx-auto opacity-50" />
            </div>
            <p className="text-muted-foreground text-lg">
              Aucun bien trouvé avec les filtres sélectionnés.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Essayez de modifier vos critères de recherche ou ajoutez un nouveau bien.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOwner = item.owner.toLowerCase() === address?.toLowerCase()
            const canCertify = isCertifier && !item.isCertified

            return (
              <Card key={item.id} className="gap-4 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full border border-gray-200/60">
                {/* Container image avec taille fixe responsive */}
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  {item.image && item.image !== 'ipfs://' ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center p-4">
                      <Eye className="h-12 w-12 mb-2 opacity-60" />
                      <span className="text-xs text-gray-500 text-center">Aucune image disponible</span>
                    </div>
                  )}
                  
                  {/* Badges overlay */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {item.isCertified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1 shadow-sm">
                        <Award className="h-3 w-3 mr-1" />
                        Certifié
                      </Badge>
                    )}
                    {item.forSale && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2 py-1 shadow-sm">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        En vente
                      </Badge>
                    )}
                    {item.proofImage && item.proofImage !== 'ipfs://' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-1 shadow-sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Preuve
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="pb-0 flex-shrink-0">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[2.5rem] flex items-center">
                      {item.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="flex flex-col gap-1 mt-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Série: {item.numSerie}</span>
                      <span className="text-muted-foreground bg-gray-100 px-2 py-1 rounded">UID: {item.id}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      <span className="truncate">{item.ownerName}</span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 flex-grow flex flex-col">
                  <div className="text-sm space-y-2 flex-shrink-0">
                    <p className="truncate text-xs">
                      <span className="font-medium">Propriétaire:</span> {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Transactions:</span>
                      <Badge variant="outline" className="text-xs">
                        {item.transactionCount}
                      </Badge>
                    </div>
                    {item.forSale && (
                      <p className="font-semibold text-primary text-lg text-center py-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                        {(Number(item.price) / 1e18).toFixed(4)} ETH
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 mt-auto pt-2">
                    {/* Certify button - for certifiers only */}
                    {canCertify && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCertifyItem(item.id)}
                        disabled={isPending || isConfirming}
                        className="w-full border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        Certifier
                      </Button>
                    )}

                    {/* Owner actions */}
                    {isOwner && (
                      <div className="space-y-2">
                        {!item.forSale ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Prix (ETH)"
                              value={salePrices[item.id] || ''}
                              onChange={(e) => setSalePrices({
                                ...salePrices,
                                [item.id]: e.target.value
                              })}
                              type="number"
                              step="0.0001"
                              min="0"
                              className="text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleListForSale(item.id)}
                              disabled={isPending || isConfirming || !salePrices[item.id]}
                              className="flex-shrink-0 bg-orange-600 hover:bg-orange-700"
                            >
                              <Gavel className="h-3 w-3" />
                              Vente
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-center text-muted-foreground py-1 bg-orange-50 rounded">
                            Votre bien est en vente
                          </p>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTransferModal(item.id)}
                          disabled={isPending || isConfirming}
                          className="w-full"
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Transférer
                        </Button>
                      </div>
                    )}

                    {/* Purchase button - for non-owners when item is for sale */}
                    {!isOwner && item.forSale && (
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(item.id, item.price)}
                        disabled={isPending || isConfirming}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isPending || isConfirming ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <ShoppingCart className="h-3 w-3 mr-1" />
                        )}
                        Acheter
                      </Button>
                    )}

                    {/* Not for sale indicator */}
                    {!isOwner && !item.forSale && (
                      <p className="text-xs text-center text-muted-foreground py-2 border rounded bg-gray-50">
                        Non disponible à la vente
                      </p>
                    )}
                    
                    {/* View Details Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(item.id)}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir détail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Item Details Modal */}
      <ItemDetails
        itemId={selectedItemId}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onUpdate={handleDetailsUpdate}
      />

      {/* User Profile Modal */}
      <UserProfile 
        isOpen={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
      />
    </div>
  )
}