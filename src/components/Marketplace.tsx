import { useState } from 'react'
import { useAccount, useConnect, useDisconnect ,   useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient} from 'wagmi'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import ItemsList from '@/components/ItemsList'
import UserProfile from '@/components/UserProfile'
import ActionBar from './ActionBar'
import { Badge } from './ui/badge'
import { Award } from 'lucide-react'
import { contractAddress } from '@/lib/wagmi'
import ABI from '@/lib/contract_abi'


export default function Marketplace() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [activeTab, setActiveTab] = useState('marketplace')
  const [showUserProfile, setShowUserProfile] = useState(false)


  const { data: isCertifier } = useReadContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'certifiers',
      args: [address],
    })

  
    // Check if user is owner/certifier
    const { data: contractOwner } = useReadContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'owner',
    })

    const isOwner = contractOwner && address &&
    (contractOwner as string).toLowerCase() === address.toLowerCase()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
            
            <CardHeader className="text-center pt-8 pb-6 relative">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
              </div>
              
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                Marketplace Connectée
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2 text-base">
                Sécurisez votre accès avec votre wallet
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pb-8 px-6 relative">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Connexion 100% sécurisée</span>
              </div>

              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-blue-300 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                  variant="outline"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                  
                  <div className="flex items-center justify-center w-6 h-6 mr-3 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {isPending ? 'Connexion...' : `Se connecter avec ${connector.name}`}
                  </span>
                  
                  {isPending && (
                    <div className="absolute right-4">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </Button>
              ))}

              <div className="text-center mt-6 pt-4 border-t border-gray-200/50">
                <p className="text-xs text-gray-500">
                  En vous connectant, vous acceptez nos{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors">
                    conditions d'utilisation
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Sécurisé</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Crypté</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Rapide</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header amélioré avec navigation */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo et Titre */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                    Marketplace Occasion
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Des biens de qualité à portée de main</p>
                </div>
              </div>
            </div>

            {/* Navigation et Compte utilisateur */}
            <div className="flex items-center gap-6">
              
              {/* Indicateur de connexion */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-green-50 rounded-full border border-green-200/60">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-800">Connecté</span>
                  <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded-md">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                          {isCertifier && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              <Award className="h-3 w-3 mr-1" />
                              Certificateur
                              </Badge>
                          )}
                          {isOwner && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                              Propriétaire du contrat
                              </Badge>
                          )}
                          </div>
                      </div>

              {/* Bouton Profil */}
              <Button 
                onClick={() => setShowUserProfile(true)}
                className="group relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
                variant="outline"
              >
                <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Profil</span>
              </Button>

              {/* Bouton Déconnexion */}
              <Button 
                onClick={() => disconnect()}
                className="group relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md"
                variant="outline"
              >
                <svg className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal avec navigation par onglets */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200/60 p-1 rounded-2xl shadow-sm">
              <TabsTrigger 
                value="marketplace" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Marketplace
              </TabsTrigger>

              <TabsTrigger 
                value="mes-achats" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Mes Achats
              </TabsTrigger>

              <TabsTrigger 
                value="for-sale" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                En vente
              </TabsTrigger>

              <TabsTrigger 
                value="certified" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Certifiés
              </TabsTrigger>

              <TabsTrigger 
                value="uncertified" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Non Certifiés
              </TabsTrigger>
            </TabsList>
            <ActionBar  />
            </div>
          
        

            <TabsContent value="marketplace" className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 shadow-sm">
                <ItemsList />
              </div>
            </TabsContent>

            <TabsContent value="mes-achats" className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 shadow-sm text-center">
                 <ItemsList typeItem='my-items' />
              </div>
            </TabsContent>

            <TabsContent value="for-sale" className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 shadow-sm text-center">
                  <ItemsList typeItem='for-sale' />
              </div>
            </TabsContent>
            <TabsContent value="certified" className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 shadow-sm text-center">
                  <ItemsList typeItem='certified' />
              </div>
            </TabsContent>
             <TabsContent value="uncertified" className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 shadow-sm text-center">
                  <ItemsList typeItem='uncertified' />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modal Profil Utilisateur */}
      <UserProfile 
        isOpen={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
      />
    </div>
  )
}