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
import { Loader2, Plus, Filter, ShoppingCart, ArrowRightLeft, Award, Eye, Gavel } from 'lucide-react'
import { toast } from 'sonner'
import { contractAddress } from '../lib/wagmi'
import ABI from '@/lib/contract_abi'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

interface Item {
  id: number
  name: string
  numSerie: string
  description: string
  image: string
  owner: string
  isCertified: boolean
  certifiedBy: string
  forSale: boolean
  price: bigint
  transactionCount: number
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

export default function MarketplaceInterface() {
  const { address } = useAccount()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [salePrices, setSalePrices] = useState<{[key: number]: string}>({})
  
  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddCertifierOpen, setIsAddCertifierOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<number | null>(null)
  
  // Form states
  const [newItem, setNewItem] = useState<NewItem>({
    name: '', numSerie: '', description: '', image: ''
  })
  const [newCertifierAddress, setNewCertifierAddress] = useState('')
  const [transferData, setTransferData] = useState<TransferData>({
    itemId: 0, toAddress: ''
  })

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })
  const publicClient = usePublicClient()

  // Check if user is owner/certifier
  const { data: contractOwner } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'owner',
  })

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
    if (allItemsData && Array.isArray(allItemsData) && allItemsData.length >= 8) {
      const [ids, names, numSeries, owners, isCertifieds, forSales, prices, transactionCounts] = allItemsData
      
      const itemsData: Item[] = []
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] && owners[i] !== '0x0000000000000000000000000000000000000000') {
          itemsData.push({
            id: Number(ids[i]),
            name: names[i],
            numSerie: numSeries[i],
            description: '', // We'll need to fetch individual items for full details
            image: '', // We'll need to fetch individual items for full details
            owner: owners[i],
            isCertified: isCertifieds[i],
            certifiedBy: '0x0000000000000000000000000000000000000000',
            forSale: forSales[i],
            price: prices[i],
            transactionCount: Number(transactionCounts[i])
          })
        }
      }
      setItems(itemsData)
    }
  }, [allItemsData])

  // Fetch detailed item information
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (items.length > 0 && publicClient) {
        const updatedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const itemDetails = await publicClient.readContract({
                address: contractAddress,
                abi: ABI,
                functionName: 'getItem',
                args: [item.id],
              }) as any[]
              
              return {
                ...item,
                description: itemDetails[3] || '',
                image: itemDetails[4] || '',
                certifiedBy: itemDetails[7] || '0x0000000000000000000000000000000000000000'
              }
            } catch (error) {
              console.error(`Error fetching details for item ${item.id}:`, error)
              return item
            }
          })
        )
        setItems(updatedItems)
      }
    }

    fetchItemDetails()
  }, [allItemsData, publicClient])

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

  // Handle item registration
  const handleRegisterItem = () => {
    if (!newItem.name || !newItem.numSerie || !newItem.description) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'registerItem',
      args: [newItem.name, newItem.numSerie, newItem.description, newItem.image || 'ipfs://'],
    })

    setNewItem({ name: '', numSerie: '', description: '', image: '' })
    setIsAddItemOpen(false)
  }

  // Handle adding certifier
  const handleAddCertifier = () => {
    if (!newCertifierAddress || !/^0x[a-fA-F0-9]{40}$/.test(newCertifierAddress)) {
      toast.error('Veuillez entrer une adresse Ethereum valide')
      return
    }

    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'addCertifier',
      args: [newCertifierAddress],
    })

    setNewCertifierAddress('')
    setIsAddCertifierOpen(false)
  }

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
  }, [isConfirmed, refetchItems])

  const isOwner = contractOwner && address && 
    contractOwner.toLowerCase() === address.toLowerCase()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Marketplace Certifié</h1>
        
        <div className="flex flex-wrap gap-2">
          {/* Add Item Modal */}
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bien
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enregistrer un nouveau bien</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du bien *</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Ex: iPhone 14 Pro"
                  />
                </div>
                <div>
                  <Label htmlFor="numSerie">Numéro de série *</Label>
                  <Input
                    id="numSerie"
                    value={newItem.numSerie}
                    onChange={(e) => setNewItem({...newItem, numSerie: e.target.value})}
                    placeholder="Ex: SN123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Description détaillée du bien"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="image">Image (URL IPFS)</Label>
                  <Input
                    id="image"
                    value={newItem.image}
                    onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                    placeholder="ipfs://..."
                  />
                </div>
                <Button 
                  onClick={handleRegisterItem}
                  disabled={isPending || isConfirming}
                  className="w-full"
                >
                  {isPending || isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Enregistrer le bien
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Certifier Modal - Only for owner */}
          {isOwner && (
            <Dialog open={isAddCertifierOpen} onOpenChange={setIsAddCertifierOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Award className="h-4 w-4 mr-2" />
                  Ajouter certificateur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un certificateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="certifierAddress">Adresse Ethereum du certificateur</Label>
                    <Input
                      id="certifierAddress"
                      value={newCertifierAddress}
                      onChange={(e) => setNewCertifierAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <Button 
                    onClick={handleAddCertifier}
                    disabled={isPending || isConfirming}
                    className="w-full"
                  >
                    {isPending || isConfirming ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Ajouter certificateur
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Transfer Modal */}
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
                    onChange={(e) => setTransferData({...transferData, toAddress: e.target.value})}
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtrer:</span>
        </div>
        <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les biens</SelectItem>
            <SelectItem value="my-items">Mes biens</SelectItem>
            <SelectItem value="certified">Biens certifiés</SelectItem>
            <SelectItem value="uncertified">Biens non certifiés</SelectItem>
            <SelectItem value="for-sale">En vente</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="text-sm text-muted-foreground">
          {filteredItems.length} bien(s) trouvé(s)
        </div>

        {isCertifier && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Award className="h-3 w-3 mr-1" />
            Certificateur
          </Badge>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              Aucun bien trouvé avec les filtres sélectionnés.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOwner = item.owner.toLowerCase() === address?.toLowerCase()
            const canCertify = isCertifier && !item.isCertified
            
            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {item.image && item.image !== 'ipfs://' ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      <Eye className="h-8 w-8" />
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                    <div className="flex gap-1">
                      {item.isCertified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1" />
                          Certifié
                        </Badge>
                      )}
                      {item.forSale && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          En vente
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    Série: {item.numSerie}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p>Propriétaire: {item.owner.slice(0, 6)}...{item.owner.slice(-4)}</p>
                    <p>Transactions: {item.transactionCount}</p>
                    {item.forSale && (
                      <p className="font-semibold text-primary">
                        Prix: {(Number(item.price) / 1e18).toFixed(4)} ETH
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {/* Certify button - for certifiers only */}
                    {canCertify && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCertifyItem(item.id)}
                        disabled={isPending || isConfirming}
                        className="w-full"
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
                              className="text-xs"
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleListForSale(item.id)}
                              disabled={isPending || isConfirming}
                            >
                              <Gavel className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-center text-muted-foreground">
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
                        className="w-full"
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
                      <p className="text-xs text-center text-muted-foreground">
                        Non disponible à la vente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}