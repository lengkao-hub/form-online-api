
import { Prisma, profile } from "@prisma/client";
import { Request } from "express";
import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma/index";
import { addIndexToResults } from "../../utils/addIndexToResults";
import { getImagePath, resolveImageUrls } from "../../utils/fileUrl";
import { PaginateCalucations } from "../../utils/pagination";
import { buildWhereClause, formatDate, processRecordItems } from "./lib";
import { CreateNewCardServiceParams, IGetAllProfilesServiceProps, IGetOneProfileProp, UpdateStatusParams } from "./types";

export const getAllProfilesService = async ({
  page, limit, paginate, search, gender, year, date, companyId, status, req,
}: IGetAllProfilesServiceProps & { req: Request, companyId?: number, userId?: number }) => {
  try {
    const whereClause = buildWhereClause({ search, gender, year, date, companyId, status });
    const queryFn = async (skip: number, take: number) => {
      const data = await prisma.profile.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
      const totalCount = await prisma.profile.count({
        where: whereClause,
      });
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
export const getAllApprovedService = async ({
  page, limit, paginate, search, gender, year, date, status, req, userId,
}: IGetAllProfilesServiceProps & { req: Request, userId: number }) => {
  try {
    const whereClause = buildWhereClause({  search, gender, year, date, status });
    const queryFn = async (skip: number, take: number) => {
      const data = await prisma.profile.findMany({
        skip,
        take,
        where: {
          ...whereClause,
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
      });
      const totalCount = await prisma.profile.count({
        where: { userId: userId, status: status },
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
    }); 
    const dataWithImagePath = getImagePath({ req, data, field: "image" }); 
    const result = resolveImageUrls({ records: dataWithImagePath, fields: ["gallery.image"], request: req, nestedKey: "profileGallery", nestedImageField: "gallery.image" });
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
}: CreateNewCardServiceParams) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const folder = await tx.folder.create({
      data: { companyId, userId },
    });
    const folderId = folder.id;
    const folderPriceRecords: any[] = [];

    // ແທນທີ່ Object.entries().map() ດ້ວຍ for...of
    const entries = Object.entries(groupedByPrice); 
    for (const [priceId, items] of entries) { 
      const itemsArray = items as any[];
      const amount = itemsArray.length;
      const priceValue = Number(itemsArray[0].price);

      if (isNaN(priceValue)) {
        throw new Error(`Invalid price value for priceId ${priceId}`);
      }

      const totalPrice = amount * priceValue;
      const priceIdNumber = Number(priceId);

      const folderPrice = await tx.folderPrice.create({
        data: {
          userId,
          companyId,
          priceId: priceIdNumber,
          folderId,
          price: String(priceValue),
          amount,
          totalPrice,
        },
      }); 
      folderPriceRecords.push({
        folderPriceId: folderPrice.id,
        priceId: priceIdNumber,
        items: itemsArray,
      });
    } 
    const updatePromises: any[] = [];
    for (const record of folderPriceRecords) {
      const recordPromises = processRecordItems(tx, record, folderId);
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
  id,
  tx,
}: {
  data: Omit<profile, "id">;
  id: number;
  tx: Prisma.TransactionClient
}) => {
  try {
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
  content,
}: UpdateStatusParams) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedProfiles = await tx.profile.updateMany({
      where: { folderId },
      data: { status },
    });

    const updatedFolder = await tx.folder.update({
      where: { id: folderId },
      data: {
        content,
      },
    });

    return {
      profilesUpdated: updatedProfiles.count,
      folder: updatedFolder,
    };
  });

  return result;
};
export const getRejectedService = async (id: number) => {
  const data = await prisma.folder.findMany({
    where: {
      userId: id,
      profile: {
        some: {
          status: "REJECTED",
        },
      },
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
