const  ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint16",
          "name": "id",
          "type": "uint16"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "certifier",
          "type": "address"
        }
      ],
      "name": "ItemCertified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint16",
          "name": "id",
          "type": "uint16"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ItemRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint16",
          "name": "id",
          "type": "uint16"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "ItemSold",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint16",
          "name": "id",
          "type": "uint16"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "ItemTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "userAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "email",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "location",
          "type": "string"
        }
      ],
      "name": "userRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_certifier",
          "type": "address"
        }
      ],
      "name": "addCertifier",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "_itemId",
          "type": "uint16"
        }
      ],
      "name": "buyItem",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "certifiers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "_itemId",
          "type": "uint16"
        }
      ],
      "name": "certifyItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllItems",
      "outputs": [
        {
          "internalType": "uint16[]",
          "name": "ids",
          "type": "uint16[]"
        },
        {
          "internalType": "string[]",
          "name": "names",
          "type": "string[]"
        },
        {
          "internalType": "string[]",
          "name": "numSeries",
          "type": "string[]"
        },
        {
          "internalType": "string[]",
          "name": "images",
          "type": "string[]"
        },
        {
          "internalType": "string[]",
          "name": "descriptions",
          "type": "string[]"
        },
        {
          "internalType": "address[]",
          "name": "owners",
          "type": "address[]"
        },
        {
          "internalType": "bool[]",
          "name": "isCertifieds",
          "type": "bool[]"
        },
        {
          "internalType": "bool[]",
          "name": "forSales",
          "type": "bool[]"
        },
        {
          "internalType": "uint256[]",
          "name": "prices",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "transactionCounts",
          "type": "uint256[]"
        },
        {
          "internalType": "string[]",
          "name": "proofImages",
          "type": "string[]"
        },
        {
          "internalType": "string[]",
          "name": "ownerNames",
          "type": "string[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "_itemId",
          "type": "uint16"
        }
      ],
      "name": "getItem",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "id",
          "type": "uint16"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "numSerie",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "image",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "itemOwner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isCertified",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "forSale",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "transactionCount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "proofImage",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "_itemId",
          "type": "uint16"
        }
      ],
      "name": "getItemTransactions",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "owners",
          "type": "address[]"
        },
        {
          "internalType": "uint32[]",
          "name": "datetimes",
          "type": "uint32[]"
        },
        {
          "internalType": "uint256[]",
          "name": "salePrices",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_userAddress",
          "type": "address"
        }
      ],
      "name": "getUser",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "location",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "status",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getUserItems",
      "outputs": [
        {
          "internalType": "uint16[]",
          "name": "",
          "type": "uint16[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "_itemId",
          "type": "uint16"
        }
      ],
      "name": "isItemCertified",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "name": "items",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "id",
          "type": "uint16"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "numSerie",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "image",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isCertified",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "certifiedBy",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "forSale",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "proofImage",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "_itemId",
          "type": "uint16"
        },
        {
          "internalType": "uint256",
          "name": "_price",
          "type": "uint256"
        }
      ],
      "name": "listForSale",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_numSerie",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_image",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_proofImage",
          "type": "string"
        }
      ],
      "name": "registerItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_email",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_location",
          "type": "string"
        }
      ],
      "name": "registerUser",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "_itemId",
          "type": "uint16"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        }
      ],
      "name": "transferItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "userItems",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "users",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "location",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "status",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

export default ABI