import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, Plus, Upload, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { contractAddress } from '../lib/wagmi';
import ABI from '@/lib/contract_abi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { uploadToIPFS } from '@/lib/ipfs-upload';

interface NewItem {
  name: string;
  numSerie: string;
  description: string;
  image: File | null;
  proofImage: File | null;
  imageUrl: string;
  proofImageUrl: string;
}

const validateForm = (item: NewItem): string | null => {
  if (!item.name.trim()) return 'Le nom du bien est obligatoire';
  if (!item.numSerie.trim()) return 'Le numéro de série est obligatoire';
  if (!item.description.trim()) return 'La description est obligatoire';
  if (item.description.length < 10) return 'La description doit contenir au moins 10 caractères';
  if (item.image && item.image.size > 10 * 1024 * 1024) return 'L\'image ne doit pas dépasser 10MB';
  if (item.proofImage && item.proofImage.size > 10 * 1024 * 1024) return 'L\'image de preuve ne doit pas dépasser 10MB';
  return null;
};

export default function AddItemInterface({ onItemAdded }: { onItemAdded?: () => void }) {
  const { address } = useAccount()
  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  
  const [newItem, setNewItem] = useState<NewItem>({
    name: '', 
    numSerie: '', 
    description: '', 
    image: null,
    proofImage: null,
    imageUrl: '',
    proofImageUrl: ''
  });

  const { data: userData } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'getUser',
    args: [address],
  });

  useEffect(() => {
    console.log('User data:', userData);
    if(Array.isArray(userData) && userData.length === 4 && userData[0]){
      setUser({ name: userData[0], email: userData[1], location : userData[2], status: userData[3] });
    }
  }, [userData]);[]

  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  const handleFileSelect = useCallback((field: 'image' | 'proofImage') => 
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide (JPEG, PNG, GIF)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 10MB');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      
      setNewItem(prev => ({
        ...prev,
        [field]: file,
        [`${field}Url`]: objectUrl
      }));
  }, []);

  useEffect(() => {
    return () => {
      if (newItem.imageUrl) URL.revokeObjectURL(newItem.imageUrl);
      if (newItem.proofImageUrl) URL.revokeObjectURL(newItem.proofImageUrl);
    };
  }, [newItem.imageUrl, newItem.proofImageUrl]);

  const handleRegisterItem = async (): Promise<void> => {
    // Vérifier si l'utilisateur est enregistré
    if (!user || !(user as any).status) {
      toast.error('Veuillez compléter votre profil avant d\'ajouter un bien');
      return;
    }

    const validationError = validateForm(newItem);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsUploading(true);
      
      let imageIpfsUrl = 'ipfs://';
      let proofImageIpfsUrl = 'ipfs://';
      
      // Upload main image to IPFS
      if (newItem.image) {
        toast.info('Téléversement de l\'image principale...');
        const uploadResult = await uploadToIPFS(newItem.image);
        imageIpfsUrl = uploadResult.pinataUrl as string;
      }

      // Upload proof image to IPFS
      if (newItem.proofImage) {
        toast.info('Téléversement de l\'image de preuve...');
        const uploadResult = await uploadToIPFS(newItem.proofImage);
        proofImageIpfsUrl = uploadResult.pinataUrl as string;
      }

      // Register item on blockchain with proof image
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: ABI,
        functionName: 'registerItem',
        args: [
          newItem.name, 
          newItem.numSerie, 
          newItem.description, 
          imageIpfsUrl,
          proofImageIpfsUrl
        ],
      });

    } catch (error) {
      console.error('Error during registration:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléversement');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!isAddItemOpen) {
      if (newItem.imageUrl) URL.revokeObjectURL(newItem.imageUrl);
      if (newItem.proofImageUrl) URL.revokeObjectURL(newItem.proofImageUrl);
      
      setNewItem({
        name: '', 
        numSerie: '', 
        description: '', 
        image: null,
        proofImage: null,
        imageUrl: '',
        proofImageUrl: ''
      });
    }
  }, [isAddItemOpen, newItem.imageUrl, newItem.proofImageUrl]);

  useEffect(() => {
    if (isSuccess) {
      toast.success('Bien enregistré avec succès!');
      if (typeof onItemAdded === 'function') {
        onItemAdded();
      }
      setIsAddItemOpen(false);
    }
    
    if (isError) {
      console.error('Contract error:', error);
      toast.error('Erreur lors de l\'enregistrement sur la blockchain');
    }
  }, [isSuccess, isError, error, onItemAdded]);

  const removeImage = (field: 'image' | 'proofImage'): void => {
    const urlField = `${field}Url` as 'imageUrl' | 'proofImageUrl';
    if (newItem[urlField]) {
      URL.revokeObjectURL(newItem[urlField]);
    }
    
    setNewItem(prev => ({
      ...prev,
      [field]: null,
      [urlField]: ''
    }));
  };

  const updateField = <K extends keyof NewItem>(
    field: K, 
    value: NewItem[K]
  ): void => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isLoading: boolean = isPending || isUploading;

  return (
    <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
      <DialogTrigger asChild>
        
        <Button disabled={!user }>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un bien 
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer un nouveau bien</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* User Status Check */}
          {!user  && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <User className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Profil requis</p>
                <p className="text-xs text-amber-700">
                  Complétez votre profil avant d'ajouter un bien
                </p>
              </div>
            </div>
          )}

          {/* Name Field */}
          <div>
            <Label htmlFor="name">Nom du bien *</Label>
            <Input
              id="name"
              value={newItem.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateField('name', e.target.value)
              }
              placeholder="Ex: iPhone 14 Pro"
              disabled={isLoading}
            />
          </div>
          
          {/* Serial Number Field */}
          <div>
            <Label htmlFor="numSerie">Numéro de série *</Label>
            <Input
              id="numSerie"
              value={newItem.numSerie}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateField('numSerie', e.target.value)
              }
              placeholder="Ex: SN123456789"
              disabled={isLoading}
            />
          </div>
          
          {/* Description Field */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={newItem.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                updateField('description', e.target.value)
              }
              placeholder="Description détaillée du bien..."
              rows={3}
              disabled={isLoading}
            />
            <div className="text-xs text-gray-500 mt-1">
              {newItem.description.length}/500 caractères (minimum 10)
            </div>
          </div>
          
          {/* Main Image Upload */}
          <div>
            <Label htmlFor="image">Image principale</Label>
            <div className="space-y-2">
              {newItem.imageUrl ? (
                <div className="relative group">
                  <img 
                    src={newItem.imageUrl} 
                    alt="Aperçu de l'image principale" 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage('image')}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect('image')}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor="image" 
                    className={`cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm font-medium">Image principale</div>
                    <div className="text-xs text-gray-500">JPEG, PNG, GIF (max. 10MB)</div>
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Proof Image Upload */}
          <div>
            <Label htmlFor="proofImage">Image de preuve</Label>
            <div className="space-y-2">
              {newItem.proofImageUrl ? (
                <div className="relative group">
                  <img 
                    src={newItem.proofImageUrl} 
                    alt="Aperçu de l'image de preuve" 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage('proofImage')}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                  <Input
                    id="proofImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect('proofImage')}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor="proofImage" 
                    className={`cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm font-medium">Image de preuve</div>
                    <div className="text-xs text-gray-500">Facture, certificat (max. 10MB)</div>
                  </Label>
                </div>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <Button 
            onClick={handleRegisterItem}
            disabled={isLoading || !user}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isUploading ? 'Téléversement...' : 'Enregistrement...'}
              </>
            ) : (
              'Enregistrer le bien'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}