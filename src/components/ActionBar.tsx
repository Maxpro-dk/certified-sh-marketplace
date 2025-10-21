import { useState, useEffect } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient
} from 'wagmi'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { Loader2,  Award,  CircleOff } from 'lucide-react'
import { toast } from 'sonner'
import { contractAddress, config } from '../lib/wagmi'
import ABI from '@/lib/contract_abi'
import { Dialog } from './ui/dialog'
import { readContract } from '@wagmi/core'
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import AddItemInterface from './AddItem'


interface NewItem {
  name: string
  numSerie: string
  description: string
  image: string
}




export default function ActionBar({onChange}: {onChange?: Function}) {
  const { address } = useAccount()
  const [isNewItem, setIsNewItem] = useState(false)
  const [isAddCertifierOpen, setIsAddCertifierOpen] = useState(false)
  const [isVerifyCertificationOpen, setIsVerifyCertificationOpen] = useState(false)



  const [newCertifierAddress, setNewCertifierAddress] = useState('')
  const [checkItem, setCheckItem] = useState<{
    uid: number,
    certified: 'pending' | 'certified' | 'uncertified'
  }>({
    uid: 0,
    certified: "pending"
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

  // Handle certification check
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
      toast.error("Aucun bien ne porte ce numéro! Veuillez réessayer")
    }
  }

  const handleCheckCertificationToggle = (value: boolean) => {
    if (value) {
      setCheckItem({ uid: 0, certified: 'pending' })
    }
    setIsVerifyCertificationOpen(value)
  }



  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
       
      toast.success('Transaction confirmée avec succès!')
    
    }
  }, [isConfirmed,  publicClient, isNewItem])



  const isOwner = contractOwner && address &&
    (contractOwner as string).toLowerCase() === address.toLowerCase()

  

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
      

        <div className="flex flex-wrap gap-2">
         

          {/* Add Item Modal */}
          <AddItemInterface onItemAdded={() => {
            console.log("Item added, notify parent");
            setIsNewItem(!isNewItem);
            onChange();
          }} />
          
          {/* Verify goods Modal */}
          <Dialog open={isVerifyCertificationOpen} onOpenChange={handleCheckCertificationToggle}>
            <DialogTrigger asChild>
              <Button className='text-blue-900' variant="outline">
                <Award className="h-4 w-4 mr-2" />
                Vérifier un bien
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vérifier un bien</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-4' htmlFor="certifierAddress">UID du bien d'occasion</Label>
                  <Input
                    id="certifierAddress"
                    value={checkItem.uid}
                    onChange={(e) => setCheckItem({ certified: 'pending', uid: parseInt(e.target.value || '0') })}
                    placeholder="ex: 12"
                  />
                </div>
                {checkItem.uid && checkItem.certified == "certified" ?
                  <Badge variant="secondary" className="w-full flex flex-col justify-center align-center p-8 bg-green-100 text-green-800">
                    <Award className="h-8 w-8 mr-2" />
                    <span>Bien Certifié</span>
                  </Badge> : ""
                }

                {checkItem.uid && checkItem.certified == "uncertified" ?
                  <Badge variant="destructive" className="w-full flex flex-col justify-center align-center p-8 bg-red-100 text-red-800">
                    <CircleOff className="h-8 w-8 mr-2" />
                    <span>Bien Non Certifié</span>
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

        
        </div>
      </div>

     

      

   

     
    </div>
  )
}