import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { readContract } from '@wagmi/core'
import { config } from '../lib/wagmi'
import { contractAddress } from '@/lib/wagmi'
import ABI from '@/lib/contract_abi'
import { Eye, Award, ShoppingCart, ArrowRightLeft, Loader2 } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'sonner'

interface Transaction {
  owner: string
  datetime: number
  salePrice: bigint
}

interface ItemDetails {
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
  owners: string[]
  datetimes: number[]
  salePrices: bigint[]
  proofImage?: string
}

interface ItemDetailsProps {
  itemId: number | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export default function ItemDetails({ itemId, isOpen, onClose, onUpdate }: ItemDetailsProps) {
  const { address } = useAccount()
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // Fonction pour récupérer les détails de l'item
  const fetchItemDetails = async (id: number) => {
    setIsLoading(true)
    try {
      // Récupérer les détails de base de l'item
      const itemData = await readContract(config, {
        address: contractAddress,
        abi: ABI,
        functionName: 'getItem',
        args: [id]
      }) as any[]

      // Récupérer l'historique des transactions
      const transactionsData = await readContract(config, {
        address: contractAddress,
        abi: ABI,
        functionName: 'getItemTransactions',
        args: [id]
      }) as [string[], number[], bigint[]]

      const [owners, datetimes, salePrices] = transactionsData

      const details: ItemDetails = {
        id: Number(itemData[0]),
        name: itemData[1],
        numSerie: itemData[2],
        description: itemData[3],
        image: itemData[4],
        owner: itemData[5],
        isCertified: itemData[6],
        certifiedBy: itemData[7] || '0x0000000000000000000000000000000000000000',
        forSale: itemData[8],
        price: itemData[9],
        transactionCount: Number(itemData[10]),
        owners,
        datetimes,
        salePrices,
        proofImage: itemData[10] || null
      }

      console.log('Détails de l\'item:', itemData, details)

      setItemDetails(details)
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error)
      toast.error('Erreur lors du chargement des détails')
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour formater la date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

 
  // Recharger les données quand l'item change
  useEffect(() => {
    if (itemId && isOpen) {
      fetchItemDetails(itemId)
    }
  }, [itemId, isOpen])

  // Gérer la confirmation des transactions
  useEffect(() => {
    if (isConfirmed && onUpdate) {
      toast.success('Transaction confirmée avec succès!')
      fetchItemDetails(itemId!)
      onUpdate()
    }
  }, [isConfirmed, itemId, onUpdate])

  const isOwner = itemDetails?.owner.toLowerCase() === address?.toLowerCase()

  
  return (
    <Dialog    open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du bien #{itemDetails?.id}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : itemDetails ? (
          

            <div className="space-y-6">

              <div className="flex flex-col justify-between gap-4 ">

              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {itemDetails.image ? (
                    <img
                      src={itemDetails.image}
                      alt={itemDetails.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Eye className="h-16 w-16" />
                    </div>
                  )}
                </div>

                {/* Informations */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{itemDetails.name}</h3>
                    <p className="text-muted-foreground">Série: {itemDetails.numSerie}</p>
                  </div>

                  <div className="space-y-2">
                    <p><strong>Description:</strong> {itemDetails.description}</p>
                    <p>
                      <strong>Propriétaire actuel:</strong> 
                      <span className={`${isOwner ? 'text-green-600 font-medium' : ''}`}>
                        {itemDetails.owner.slice(0, 8)}...{itemDetails.owner.slice(-6)}
                        {isOwner && ' (Vous)'}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <Badge variant={itemDetails.isCertified ? "secondary" : "outline"} 
                            className={itemDetails.isCertified ? "bg-green-100 text-green-800" : ""}>
                        {itemDetails.isCertified ? "Certifié" : "Non certifié"}
                      </Badge>
                      <Badge variant={itemDetails.forSale ? "secondary" : "outline"}
                            className={itemDetails.forSale ? "bg-orange-100 text-orange-800" : ""}>
                        {itemDetails.forSale ? "En vente" : "Non en vente"}
                      </Badge>
                    </div>
                    {itemDetails.forSale ? (
                      <p className="text-lg font-bold text-primary">
                        Prix: {(Number(itemDetails.price) / 1e18).toFixed(4)} ETH
                      </p>
                    ): null}
                  </div>

              
                </div>
              </div>


              {/* afficher la preuve */}
                 <div className="flex flex-col">
                <h5>Preuve de  propriété</h5>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                      {itemDetails.proofImage ? (
                        <img
                          src={itemDetails.proofImage}
                          alt={itemDetails.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Eye className="h-16 w-16" />
                        </div>
                      )}
                </div>
              </div>
              </div>
           

              {/* Historique des transactions */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold mb-4">Historique des transactions</h4>
                {itemDetails.owners.length > 0 ? (
                  <div className="space-y-3">
                    {itemDetails.owners.map((owner, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">
                              {owner.slice(0, 8)}...{owner.slice(-6)}
                              {owner.toLowerCase() === address?.toLowerCase() && ' (Vous)'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(itemDetails.datetimes[index])}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {Number(itemDetails.salePrices[index]) > 0 
                              ? `${(Number(itemDetails.salePrices[index]) / 1e18).toFixed(4)} ETH`
                              : 'Transfert'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {index === itemDetails.owners.length - 1 ? 'Propriétaire actuel' : 'Ancien propriétaire'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune transaction enregistrée pour ce bien.
                  </p>
                )}
              </div>
            </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Impossible de charger les détails du bien.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}