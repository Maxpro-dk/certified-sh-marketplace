// types/item.ts
export interface NewItem {
  name: string;
  numSerie: string;
  description: string;
  image: File | null;
  imageUrl: string;
}

export interface Item extends Omit<NewItem, 'image'> {
  id: string;
  tokenId?: bigint;
  owner: string;
  registrationDate: Date;
  imageIpfsUrl: string;
}

export interface ContractABI {
  // Define your contract ABI types here based on your actual ABI
  registerItem: {
    name: string;
    type: 'function';
    inputs: Array<{
      name: string;
      type: string;
      internalType: string;
    }>;
  };
}