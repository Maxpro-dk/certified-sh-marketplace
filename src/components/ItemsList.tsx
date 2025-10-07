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
import { Loader2, Plus, Filter, ShoppingCart, ArrowRightLeft, Award, Eye, Gavel, CircleOff } from 'lucide-react'
import { toast } from 'sonner'
import { contractAddress, config } from '../lib/wagmi'
import ABI from '@/lib/contract_abi'
import { Dialog } from './ui/dialog'
import { readContract } from '@wagmi/core'
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import AddItemInterface from './AddItem'
import ItemDetails from './ItemDetails'

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

export default function MarketplaceInterface({typeItem}: {typeItem?: FilterType}) {
  const { address } = useAccount()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<FilterType>(typeItem ?? 'all')
  const [salePrices, setSalePrices] = useState<{ [key: number]: string }>({})
  const [isNewItem, setIsNewItem] = useState(false)

  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddCertifierOpen, setIsAddCertifierOpen] = useState(false)
  const [isVerifyCertificationOpen, setIsVerifyCertificationOpen] = useState(false)
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

  // Form states
  const [newItem, setNewItem] = useState<NewItem>({
    name: '', numSerie: '', description: '', image: ''
  })
  const [newCertifierAddress, setNewCertifierAddress] = useState('')
  const [checkItem, setCheckItem] = useState<{
    uid: number,
    certified: 'pending' | 'certified' | 'uncertified'
  }>({
    uid: 0,
    certified: "pending"
  })
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
      const [ids, names, numSeries, images, descriptions, owners, isCertifieds, forSales, prices, transactionCounts] = allItemsData

      const itemsData: Item[] = []
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] && owners[i] !== '0x0000000000000000000000000000000000000000') {
          itemsData.push({
            id: Number(ids[i]),
            name: names[i],
            numSerie: numSeries[i],
            description: descriptions[i], // We'll need to fetch individual items for full details
            image: images[i], // We'll need to fetch individual items for full details
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
  const handleAddCertifier = async () => {
    if (!newCertifierAddress || !/^0x[a-fA-F0-9]{40}$/.test(newCertifierAddress)) {
      toast.error('Veuillez entrer une adresse Ethereum valide')
      return
    }

    let isCertified = await writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'addCertifier',
      args: [newCertifierAddress],
    })

    setNewCertifierAddress('')
    setIsAddCertifierOpen(false)
  }


  // Handle adding certifier
  const handleCheckCertification = async () => {
    if (!checkItem.uid || !/^[0-9]{1,30}$/.test(`${checkItem.uid}`)) {
      toast.error('Veuillez entrer un identifiant IUD valide')
      return
    }

    try {
      let isCertifiedItem = await readContract(config, {
        address: contractAddress,
        abi: ABI,
        functionName: 'isItemCertified',
        args: [checkItem.uid]
      });

      setCheckItem({ ...checkItem, certified: isCertifiedItem ? 'certified' : 'uncertified' });
    } catch (error) {
      setCheckItem({ ...checkItem, certified: 'pending' });
      toast.error("Aucun  bien ne  porte  ce  numero!  Veuillez  réessayer")
    }
  }

  const handleCheckCertificationToggle = (value: boolean) => {
    if (value) {
      setCheckItem({ uid: 0, certified: 'pending' })
    }

    setIsVerifyCertificationOpen(value)


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
  }, [isConfirmed, refetchItems, publicClient])

  useEffect(() => {

    refetchItems()
    toast.success('Rechargement des biens!')
    console.log("isNewItem", isNewItem)

  }, [isNewItem])

  const isOwner = contractOwner && address &&
    (contractOwner as string).toLowerCase() === address.toLowerCase()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-bold">Liste des biens</h1>

        <div className="flex flex-wrap gap-2">
          {/* Add Item Modal */}
          <AddItemInterface onItemAdded={() => setIsNewItem(!isNewItem)} />
          {/* verify goods Modal - Only for owner */}
          <Dialog open={isVerifyCertificationOpen} onOpenChange={handleCheckCertificationToggle}>
            <DialogTrigger asChild>
              <Button className='text-blue-900' variant="outline">
                <Award className="h-4 w-4 mr-2" />
                Vérifier un  bien
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vérifier un  bien</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-4' htmlFor="certifierAddress">UID du bien d'ocassion</Label>
                  <Input
                    id="certifierAddress"
                    value={checkItem.uid}
                    onChange={(e) => setCheckItem({ certified: 'pending', uid: parseInt(e.target.value || '0') })}
                    placeholder="ex: 12"
                  />
                </div>
                {checkItem.uid && checkItem.certified == "certified" ?
                  <Badge variant="secondary" className="w-full flex flex-col justify-center align-center  p-8 bg-green-100 text-green-800">
                    <Award className="h-8 w-8 mr-2" />
                    <span >
                      Bien  Certifié
                    </span>
                  </Badge> : ""
                }

                {checkItem.uid && checkItem.certified == "uncertified" ?
                  <Badge variant="destructive" className="w-full flex flex-col justify-center align-center  p-8 bg-red-100 text-red-800">
                    <CircleOff className="h-8 w-8 mr-2" />
                    <span >
                      Bien Non Certifié
                    </span>
                  </Badge> : ""
                }

                <Button
                  onClick={handleCheckCertification}
                  disabled={isPending || isConfirming}
                  className="w-full"
                >
                  {isPending || isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Vérifier
                </Button>
              </div>
            </DialogContent>
          </Dialog>


          {/* Add Certifier Modal - Only for owner */}
          {isOwner && (
            <Dialog open={isAddCertifierOpen} onOpenChange={setIsAddCertifierOpen}>
              <DialogTrigger asChild>
                <Button className='text-green-900' variant="outline">
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
       

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
              <Card key={item.id} className="gap-4 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                {/* Container image avec taille fixe responsive */}
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden mx-4 rounded-2xl">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Eye className="h-12 w-12 mb-2 opacity-60" />
                      <span className="text-xs text-gray-500">Aucune image</span>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-0 flex-shrink-0">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[2.5rem] flex items-center">
                      {item.name}
                    </CardTitle>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {item.isCertified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1">
                          <Award className="h-3 w-3 mr-1" />
                          Certifié
                        </Badge>
                      )}
                      {item.forSale && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
                          En vente
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="flex flex-col gap-1 mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">Série: {item.numSerie}</span>
                      <span className="text-muted-foreground">UID: {item.id}</span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-1 flex-grow flex flex-col">
                  <div className="text-sm space-y-1 flex-shrink-0">
                    <p className="truncate">
                      <span className="font-medium">Propriétaire:</span> {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                    </p>
                    <p>
                      <span className="font-medium">Transactions:</span> {item.transactionCount}
                    </p>
                    {item.forSale && (
                      <p className="font-semibold text-primary text-base">
                        Prix: {(Number(item.price) / 1e18).toFixed(4)} ETH
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
                              min="0"
                              className="text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleListForSale(item.id)}
                              disabled={isPending || isConfirming || !salePrices[item.id]}
                              className="flex-shrink-0"
                            >
                              <Gavel className="h-3 w-3" />
                              Mettre  en vente
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-center text-muted-foreground py-1">
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
                        className="w-full bg-primary hover:bg-primary/90"
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
                      <p className="text-xs text-center text-muted-foreground py-2 border rounded">
                        Non disponible à la vente
                      </p>
                    )}
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

      <ItemDetails
        itemId={selectedItemId}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onUpdate={handleDetailsUpdate}
      />
    </div>
  )
}