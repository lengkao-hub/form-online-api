
export interface FolderPriceItem {
    amount: number;
    price: {
      id: number;
      name: string;
      price: string;
      type: string;
    };
    multiple: number | null;
    total?: string;
  }
  
export interface FolderItem {
    no: number;
    id: number;
    code: string;
    name: string;
    officeId: number;
    status: string;
    createdAt: string;
    number: any[];
    folderPrice: FolderPriceItem[];
    totalAmount?: string;
    totalPrice?: string;
  }
  
export interface FolderServiceResponse {
    result: FolderItem[];
    totalCount: number;
    page: number;
    limit: number;
  }