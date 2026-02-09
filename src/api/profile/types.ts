import { FolderRejectStatus } from "@prisma/client";

export interface IGetAllProfilesServiceProps {
  page: number,
  limit: number,
  paginate: boolean
  search?: any
  gender?: any
  year?: string,
  date?: Date,
  deletedAt?: any,
  status?: any
}
export interface UpdateStatusParams {
  folderId: number;
  status: FolderRejectStatus;
  content?: string;
}
export interface CreateNewCardServiceParams {
  companyId: number;
  userId: number; 
  groupedByPrice: Record<number, any[]>;
  status: FolderRejectStatus;
}
export interface IGetOneProfileProp {
  id: number,
  page: number,
  limit: number,
  paginate: boolean
}