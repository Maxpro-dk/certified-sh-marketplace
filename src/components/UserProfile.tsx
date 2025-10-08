import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Loader2, User, Mail, MapPin, CheckCircle, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { contractAddress } from '../lib/wagmi'
import ABI from '@/lib/contract_abi'

interface UserData {
  name: string
  email: string
  location: string
  status: boolean
}

export default function UserProfile({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address } = useAccount()
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    location: '',
    status: false
  })

  const { data: storedUserData, refetch: refetchUser } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'getUser',
    args: [address],
  })

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (storedUserData && Array.isArray(storedUserData) && storedUserData.length >= 4) {
      const [name, email, location, status] = storedUserData
      setUserData({
        name: name || '',
        email: email || '',
        location: location || '',
        status: status as boolean
      })
    }
  }, [storedUserData])

  useEffect(() => {
    if (isConfirmed) {
      toast.success('Profil mis à jour avec succès!')
      refetchUser()
      setIsEditing(false)
    }
  }, [isConfirmed, refetchUser])

  const handleRegisterUser = () => {
    if (!userData.name || !userData.email || !userData.location) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'registerUser',
      args: [userData.name, userData.email, userData.location],
    })
  }

  const handleUpdateUser = () => {
    if (!userData.name || !userData.email || !userData.location) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'registerUser',
      args: [userData.name, userData.email, userData.location],
    })
  }

  const isLoading = isPending || isConfirming

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Utilisateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {userData.status ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Profil enregistré</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Annuler' : 'Modifier'}
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      placeholder="Votre nom complet"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      placeholder="votre@email.com"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Localisation *</Label>
                    <Input
                      id="location"
                      value={userData.location}
                      onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                      placeholder="Ville, Pays"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    onClick={handleUpdateUser}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Mettre à jour le profil
                  </Button>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                        <p className="text-xs text-gray-500">Nom complet</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{userData.email}</p>
                        <p className="text-xs text-gray-500">Email</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{userData.location}</p>
                        <p className="text-xs text-gray-500">Localisation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-amber-800 text-sm">Completéz votre profil</CardTitle>
                  <CardDescription className="text-amber-700">
                    Vous devez compléter votre profil pour pouvoir ajouter des biens au marketplace.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    placeholder="Votre nom complet"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    placeholder="votre@email.com"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={userData.location}
                    onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                    placeholder="Ville, Pays"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleRegisterUser}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Enregistrer le profil
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            <p>Adresse wallet: {address?.slice(0, 8)}...{address?.slice(-6)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}