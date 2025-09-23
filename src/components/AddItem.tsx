import { useState, useEffect, useCallback } from 'react';
import { useWriteContract } from 'wagmi';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { contractAddress } from '../lib/wagmi';
import ABI from '@/lib/contract_abi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { uploadToIPFS } from '@/lib/ipfs-upload';
import type { NewItem } from '@/types/item';

// Validation function
const validateForm = (item: NewItem): string | null => {
  if (!item.name.trim()) return 'Le nom du bien est obligatoire';
  if (!item.numSerie.trim()) return 'Le numéro de série est obligatoire';
  if (!item.description.trim()) return 'La description est obligatoire';
  if (item.description.length < 10) return 'La description doit contenir au moins 10 caractères';
  if (item.image && item.image.size > 10 * 1024 * 1024) return 'L\'image ne doit pas dépasser 10MB';
  return null;
};

export default function AddItemInterface() {
  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const [newItem, setNewItem] = useState<NewItem>({
    name: '', 
    numSerie: '', 
    description: '', 
    image: null,
    imageUrl: ''
  });

  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  // Handle file selection with proper typing
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10MB');
      return;
    }

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    
    setNewItem(prev => ({
      ...prev,
      image: file,
      imageUrl: objectUrl
    }));
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (newItem.imageUrl) {
        URL.revokeObjectURL(newItem.imageUrl);
      }
    };
  }, [newItem.imageUrl]);

  // Upload image to IPFS and register item
  const handleRegisterItem = async (): Promise<void> => {
    // Validate form
    const validationError = validateForm(newItem);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsUploading(true);
      
      let imageIpfsUrl = 'ipfs://';
      
      // Upload image to IPFS if selected
      if (newItem.image) {
        toast.info('Téléversement de l\'image vers IPFS...');
        const uploadResult = await uploadToIPFS(newItem.image);
        imageIpfsUrl = uploadResult.pinataUrl as string;
        console.log(imageIpfsUrl, 'url  image');
        toast.success('Image téléversée avec succès!');
      }

      // Register item on blockchain
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: ABI,
        functionName: 'registerItem',
        args: [newItem.name, newItem.numSerie, newItem.description, imageIpfsUrl],
      });

    } catch (error) {
      console.error('Error during registration:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléversement');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddItemOpen) {
      // Clean up any object URLs
      if (newItem.imageUrl) {
        URL.revokeObjectURL(newItem.imageUrl);
      }
      
      setNewItem({
        name: '', 
        numSerie: '', 
        description: '', 
        image: null,
        imageUrl: ''
      });
    }
  }, [isAddItemOpen, newItem.imageUrl]);

  // Handle transaction results
  useEffect(() => {
    if (isSuccess) {
      toast.success('Bien enregistré avec succès!');
      setIsAddItemOpen(false);
    }
    
    if (isError) {
      console.error('Contract error:', error);
      toast.error('Erreur lors de l\'enregistrement sur la blockchain');
    }
  }, [isSuccess, isError, error]);

  // Remove selected image
  const removeImage = (): void => {
    if (newItem.imageUrl) {
      URL.revokeObjectURL(newItem.imageUrl);
    }
    
    setNewItem(prev => ({
      ...prev,
      image: null,
      imageUrl: ''
    }));
  };

  // Update form fields with proper typing
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un bien
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer un nouveau bien</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
              placeholder="Description détaillée du bien"
              rows={3}
              disabled={isLoading}
            />
            <div className="text-xs text-gray-500 mt-1">
              {newItem.description.length}/500 caractères
            </div>
          </div>
          
          {/* Image Upload Field */}
          <div>
            <Label htmlFor="image">Image</Label>
            <div className="space-y-2">
              {newItem.imageUrl ? (
                <div className="relative group">
                  <img 
                    src={newItem.imageUrl} 
                    alt="Aperçu de l'image" 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={removeImage}
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
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor="image" 
                    className={`cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm font-medium">Cliquer pour téléverser une image</div>
                    <div className="text-xs text-gray-500">JPEG, PNG, GIF (max. 10MB)</div>
                  </Label>
                </div>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <Button 
            onClick={handleRegisterItem}
            disabled={isLoading}
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