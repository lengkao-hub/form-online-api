
import { FolderRejectStatus, Prisma, profile } from "@prisma/client";
import { Request } from "express";
import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma/index";
import { addIndexToResults } from "../../utils/addIndexToResults";
import { getImagePath, resolveImageUrls } from "../../utils/fileUrl";
import { PaginateCalucations } from "../../utils/pagination";
import { buildWhereClause, formatDate, processRecordItems } from "./lib";
import { CreateNewCardServiceParams, IGetAllProfilesServiceProps, IGetOneProfileProp, UpdateStatusParams } from "./types";

export const getAllProfilesService = async ({
  page, limit, paginate, search, gender, year, date, companyId, req, userId,
}: IGetAllProfilesServiceProps & { req: Request, companyId?: number, userId?: number }) => {
  try { 
    const whereClause = buildWhereClause({ search, gender, year, date, companyId, userId });
    const queryFn = async (skip: number, take: number) => {
      const data = await prisma.profile.findMany({
        skip,
        take,
        where: {
          ...whereClause, 
        },
        include: {
          folder: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      const totalCount = await prisma.profile.count({
        where: whereClause,
      });
      console.log("data :", data);
      return [data, totalCount];
    };
    const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
    const dataWithIndex = addIndexToResults(paginationResult.result, page, limit);
    const result = resolveImageUrls({ records: dataWithIndex, fields: ["image"], request: req, nestedKey: "profileGallery", nestedImageField: "gallery.image" });
    const formattedDate = formatDate(result);
    return {
      ...paginationResult,
      result: formattedDate,
    };
  } catch (error) {
    logger.error(error);
  } finally {
    await prisma.$disconnect();
  }
};
export const getCompopoxService = async ({
  search, companyId, userId, 
}: { req: Request, search?: string, companyId?: number, userId?: number }) => {
  try {  
    const whereClause = buildWhereClause({ search, companyId, userId }); 
    const result = await prisma.profile.findMany({ 
      where: { 
        ...whereClause, 
        folderId: null,
      }, 
      orderBy: { createdAt: "desc" },
    }); 
    return result; 
  } catch (error) {
    logger.error(error);
  } finally {
    await prisma.$disconnect();
  }
};
export const getApprovedService = async ({
  page, limit, paginate, search, gender, year, date, status, req, userId, companyId,
}: IGetAllProfilesServiceProps & { req: Request, userId: number }) => {
  try {
    const whereClause = buildWhereClause({ search, gender, year, date, userId });
    const userOfficeFilter = companyId && !Number.isNaN(companyId) && companyId !== 0
      ? { user: { is: { companyId } } }
      : {};
    console.log("companyId :", userOfficeFilter);
    const queryFn = async (skip: number, take: number) => {
      const data = await prisma.profile.findMany({
        skip,
        take,
        where: {
          ...whereClause,
          ...userOfficeFilter,
          folder: {
            status: {
              in: status,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          folder: {
            select: {
              status: true,
            },
          },
        },
      });
      const totalCount = await prisma.profile.count({
        where: {
          folderId: {
            not: null,  // ມີ folderId (ບໍ່ແມ່ນ null)
          },
          folder: {
            status: {
              in: status,
            },
          },
        },
      });
      return [data, totalCount];
    };
    const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
    const dataWithIndex = addIndexToResults(paginationResult.result, page, limit);
    const result = resolveImageUrls({ records: dataWithIndex, fields: ["image", "oldImage"], request: req, nestedKey: "profileGallery", nestedImageField: "gallery.image" });
    const formattedDate = formatDate(result);
    return {
      ...paginationResult,
      result: formattedDate,
    };
  } catch (error) {
    logger.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

export const getDetailsProfileService = async ({ id, page, limit, paginate, req }: IGetOneProfileProp & { req: Request }) => {
  try {
    const profileId = Number(id); 
    const queryFn = async (skip: number, take: number) => {
      const data = await prisma.profile.findMany({
        skip,
        take,
        where:
        {
          folderId: profileId,
        },
        orderBy: { createdAt: "desc" },
      });
      const totalCount = await prisma.profile.count({ where: { folderId: profileId } });
      return [data, totalCount];
    };
    const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
    const dataWithIndex = addIndexToResults(paginationResult.result, page, limit);
    const result = resolveImageUrls({ records: dataWithIndex, fields: ["image"], request: req, nestedKey: "profileGallery", nestedImageField: "gallery.image" });
    const formattedDate = formatDate(result);
    return {
      ...paginationResult,
      result: formattedDate,
    };
  } catch (error) {
    logger.error("Error in getOneProfileService:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
export const getOneProfileService = async ({ id, req }: { id: number | string, req: Request }) => {
  try {
    const profileId = Number(id); 
    const data = await prisma.profile.findUnique({
      where:
      {
        id: profileId,
      },
      include: {
        profileFile: {
          where: { deletedAt: null },
          select: {
            id: true,
            file: true,
            name: true,
          },
        },
      },
    }); 
    const datas = getImagePath({ req, data, field: "image" });  
    const result = {
      ...datas,
      profileFile: getImagePath({ req, data: data?.profileFile, field: "file" }),
    };
    return { result };
  } catch (error) {
    logger.error("Error in getOneProfileService:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

export const createProfileService = async (
  profileData: Omit<profile, "id">,
  tx: Prisma.TransactionClient,
) => {
  try {
    const createdProfile = await tx.profile.create({
      data: profileData,
    });
    return createdProfile;
  } catch (error) {
    logger.error(error);
    throw new Error("Failed to create profile data");
  }
};

export const createNewCardService = async ({
  companyId,
  userId, 
  groupedByPrice,
  status,
}: CreateNewCardServiceParams) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const folder = await tx.folder.create({
      data: { companyId, userId,status },
    });
    const folderId = folder.id;
    const folderPriceRecords: any[] = []; 
    const entries = Object.entries(groupedByPrice); 
    for (const [priceId, items] of entries) { 
      const itemsArray = items as any[];
      const amount = itemsArray.length;
      const priceValue = Number(itemsArray[0].price);
      const name = itemsArray[0].priceName;
      if (isNaN(priceValue)) {
        throw new Error(`Invalid price value for priceId ${priceId}`);
      } 
      const total = amount * priceValue;
      const priceIdNumber = Number(priceId); 
      const folderPrice = await tx.folderPrice.create({
        data: {
          userId,
          companyId,
          priceId: priceIdNumber,
          folderId,
          price: String(priceValue),
          name: String(name),
          amount,
          total,
        },
      });
      folderPriceRecords.push({
        folderPriceId: folderPrice.id,
        priceId: priceIdNumber,
        items: itemsArray,
      });
    } 
    const updatePromises: any[] = [];
    for (const recordData of folderPriceRecords) {
      const recordPromises = processRecordItems(tx, recordData, folderId);
      updatePromises.push(...recordPromises);
    } 
    await Promise.all(updatePromises); 
    return {
      folderId,
      totalRecords: updatePromises.length,
    };
  }); 
  return transactionResult;
};
export const editProfileService = async ({
  data,
  profileFileId,
  id,
  tx,
}: {
  data: Omit<profile, "id">;
  profileFileId: number[];
  id: number;
  tx: Prisma.TransactionClient
}) => {
  try {
    await tx.profileFile.updateMany({
      data: {
        deletedAt: new Date(),
      },
      where: {
        profileId: id,
        id: {
          notIn: profileFileId,
        },
      },
    }); 
    const editProfileRes = await tx.profile.update({
      where: { id },
      data,
    });
    return editProfileRes;
  } catch (error) {
    logger.error(error);
    throw new Error("Failed to editing profile data");
  }
}; 
export const editStatusService = async ({
  folderId,
  status,
  comment,
}: UpdateStatusParams) => {

  if (!folderId) {
    throw new Error("Folder ID is required");
  } 
  const updatedFolder = await prisma.folder.update({
    where: {
      id: folderId,
    },
    data: {
      status: status,                     // enum
      comment: comment ?? null,           // ต้องเป็น string หรือ null
    },
  }); 
  return updatedFolder;
};

export const getRejectedService = async (id: number, status: FolderRejectStatus) => {
  const data = await prisma.folder.findMany({
    where: {
      userId: id,
      status: status,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      profile: true,
      folderPrice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
}; 