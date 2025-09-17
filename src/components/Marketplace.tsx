import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import RegisterUser from '@/components/RegisterUser'
import RegisterItem from '@/components/RegisterItem'
import ItemsList from '@/components/ItemsList'
import VerifyItem from '@/components/VerifyItem'
import CertifyItem from '@/components/CertifyItem'

export default function Marketplace() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [activeTab, setActiveTab] = useState('marketplace')

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader>
            <CardTitle>Marketplace Connectée</CardTitle>
            <CardDescription>Connectez votre wallet pour continuer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full"
                size="lg"
              >
                Se connecter avec {connector.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketplace de Biens d'Occasion</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Connecté: {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <Button variant="outline" onClick={() => disconnect()}>
            Déconnexion
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsContent value="marketplace">
          <ItemsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}