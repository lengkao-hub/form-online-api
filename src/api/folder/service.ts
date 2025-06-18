/* eslint-disable no-magic-numbers */
/* eslint-disable max-lines */

import { ActionType, folder, folderPrice, folderReject, Prisma, processStatus } from "@prisma/client";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma/index";
import { addIndexToResults } from "../../utils/addIndexToResults";
import {
  PaginateCalucations,
  validatePaginationParams,
} from "../../utils/pagination";
import { shouldIncludeOfficeId } from "../lib";
import { FolderItem, FolderPriceItem, FolderServiceResponse } from "./type";
import { endOfDay, startOfDay } from "date-fns";

export const folderRejectService = async (
  data: Omit<folderReject, "id">,
) => {
  try {
    const createdFolderReject = await prisma.folderReject.create({
      data: { ...data },
    });
    return createdFolderReject;
  } catch (error) {
    logger.error(error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
};

export const getAllFolderService = async (req: Request): Promise<FolderServiceResponse> => {
  const { search, status, priceId, officeId, officeIds, createdAt } = req.query;
  const { page, limit, paginate } = validatePaginationParams(req);
  const date = typeof createdAt === "string" ? createdAt : undefined;
  const whereClause = buildWhereClause({ search, status, priceId, officeId, officeIds, date });

  const queryFn = async (skip: number, take: number) => {
    const folders = await fetchFolders(skip, take, whereClause);
    const totalCount = await prisma.folder.count({ where: whereClause });
    return [folders, totalCount];
  };
  const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
  const foldersWithPrices = enhanceFolderPrices(paginationResult.result, page, limit);
  return {
    ...paginationResult,
    result: foldersWithPrices,
  } as any;
};

const fetchFolders = async (skip: number, take: number, whereClause: object) => {
  return prisma.folder.findMany({
    skip,
    take,
    orderBy: { id: "desc" },
    where: whereClause,
    select: {
      id: true,
      code: true,
      name: true,
      officeId: true,
      status: true,
      createdAt: true,
      billDate: true,
      billNumber: true,
      folderReject: true,
      number: {
        include: {
          price: true,
        },
      },
      office: {
        select: {
          id: true,
          name: true,
        },
      },
      folderPrice: {
        select: {
          amount: true,
          multiple: true,
          totalPrice: true,
          price: { select: { id: true, name: true, price: true, type: true } },
        },
      },
    },
  });
};

const enhanceFolderPrices = (folders: FolderItem[], page: number, limit: number) => {
  const foldersWithIndex = addIndexToResults(folders, page, limit);
  return foldersWithIndex.map((folder: FolderItem) => {
    const { folderPriceWithTotal, totalAmount, totalPrice } = calculateFolderPriceTotal(folder.folderPrice);
    return {
      ...folder,
      folderPrice: folderPriceWithTotal,
      totalAmount,
      totalPrice,
    };
  });
};

const calculateFolderPriceTotal = (folderPrices: FolderPriceItem[]) => {
  let totalAmountSum = 0;
  let totalPriceSum = 0;
  const folderPriceWithTotal = folderPrices.map((fp: FolderPriceItem) => {
    const amount = Number(fp.amount);
    const unitPrice = Number(fp.price.price);
    const total = amount * unitPrice;
    totalAmountSum += amount;
    totalPriceSum += total;
    return {
      ...fp,
      amount: amount,
      multiple: fp.multiple !== null ? Number(fp.multiple) : 0,
      total: String(total),
      price: {
        ...fp.price,
        price: String(fp.price.price),
      },
    };
  });
  return {
    folderPriceWithTotal,
    totalAmount: String(totalAmountSum),
    totalPrice: String(totalPriceSum),
  };
};

export const getOneFolderService = async (req: Request) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      throw new Error("Invalid or missing folder ID");
    }
    const data = await prisma.folder.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        code: true,
        name: true,
        officeId: true,
        status: true,
        createdAt: true,
        number: {
          include: {
            price: true,
          },
        },
        folderPrice: {
          select: {
            amount: true,
            priceId: true,
            multiple: true,
            totalPrice: true,
            price: { select: { id: true, name: true, price: true, type: true } },
          },
        },
      },
    });
    if (!data) {
      throw new Error("Folder not found");
    }
    const enhancedFolder = enhanceFolderData(data);
    return enhancedFolder;
  } catch (error) {
    logger.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

const enhanceFolderData = (folder: any) => {
  const { folderPriceWithTotal, totalAmount, totalPrice } = calculateFolderPriceTotal(folder.folderPrice);
  return {
    ...folder,
    folderPrice: folderPriceWithTotal,
    totalAmount,
    totalPrice,
  };
};

export const getFolderLogService = async (req: Request) => {
  const paginationParams = validatePaginationParams(req);
  const { companyId, action } = req.query;
  const { page, limit, paginate } = paginationParams;
  const queryFn = async (skip: number, take: number) => {
    const where: Record<string, any> = {};
    if (companyId) {
      where.companyId = Number(companyId);
    }
    if (action) {
      where.action = action;
    }
    const data = await prisma.folderLog.findMany({ where, skip, take, orderBy: { id: "desc" } });
    const totalCount = await prisma.folderLog.count({ orderBy: { id: "desc" }, where });
    return [data, totalCount];
  };
  const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
  const dataWithIndex = addIndexToResults(paginationResult.result, page, limit);
  return {
    ...paginationResult,
    result: dataWithIndex,
  };
};

const buildWhereClause = (params: { search?: any; status?: any; priceId?: any; officeId?: any, officeIds?: any, date?: string }) => {
  const { search, status, officeId, officeIds, date } = params;
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: "insensitive" } },
      { code: { contains: search as string, mode: "insensitive" } },
      { billNumber: { contains: search as string, mode: "insensitive" } },
    ];
  }
  const officeIdsList = officeIds ? String(officeIds).split(",").map(Number) : [];
  if (officeIdsList.length > 0) {
    where.officeId = { in: officeIdsList };
  } else if (officeId) {
    where.officeId = Number(officeId);
  }

  if (status) {
    where.status = status;
  }
  if (officeId) {
    where.officeId = Number(officeId);
  }
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      where.billDate = {
        gte: startOfDay(parsedDate),
        lt: endOfDay(parsedDate),
      };
    }
  }
  return where;
};

export const createFolderService = async (folderData: Omit<folder, "id">, tx: Prisma.TransactionClient) => {
  try {
    const createdFolder = await tx.folder.create({
      data: folderData,
    });
    return createdFolder;
  } catch (error) {
    logger.error(error);
    return null;
  }
};
export const editFolderService = async ({
  data,
  id,
  tx,
}: {
  data: Pick<folder, "name">;
  id: number;
  tx: Prisma.TransactionClient
}) => {
  try {
    const editProfileRes = await tx.folder.update({
      where: { id },
      data,
    });
    return editProfileRes;
  } catch (error) {
    logger.error(error);
    throw new Error("Failed to edit profile data");
  }
};

export const generateFolderCode = async ({ officeId, tx }: { officeId?: number, tx: Prisma.TransactionClient }): Promise<string> => {
  const currentYear = new Date().getFullYear();
  try {
    const latestFolder = await tx.folder.findFirst({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
        },
        officeId: officeId,
      },
      orderBy: {
        id: "desc",
      },
    });
    const nextCode = latestFolder
      ? String(Number(latestFolder.code) + 1).padStart(4, "0")
      : "0001";
    return nextCode;
  } catch {
    return "0001";
  }
};

export const checkFolderLimit = async (folderId: number) => {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },

  });
  if (!folder) {
    return {
      valid: false,
      status: StatusCodes.NOT_FOUND,
      message: "Folder not found",
    };
  }

  return {
    valid: true,
    status: StatusCodes.OK,
    message: "Validation successful",
  };
};

export const statusFolderService = async ({
  id,
  status,
  tx,
}: {
  id: number;
  status: processStatus;
  tx: Prisma.TransactionClient
}) => {
  try {
    const updatedFolder = await tx.folder.update({
      where: { id },
      data: {
        status: status,
        updatedAt: new Date(),
      },
    });
    return updatedFolder;
  } catch (error) {
    logger.error("Step Progression Error:", error);
    throw error;
  }
};
export const aggregationFolderServices = async ({
  status,
  officeId,
}: {
  status: processStatus,
  officeId: number
}) => {
  const whereClause: any = { status: status };
  if (shouldIncludeOfficeId(officeId)) {
    whereClause.officeId = officeId;
  }

  try {
    const total = await prisma.folder.count({
      where: whereClause,
    });
    return { total };
  } catch (error) {
    logger.error("Error in aggregationProfileServices:", error);
    throw new Error("Failed to aggregate folder data");
  } finally {
    await prisma.$disconnect();
  }
};

export const createFolderLogService = async ({
  action,
  data,
  changes,
  changedBy,
  newStatus,
  tx,
}: {
  action: ActionType;
  data: Record<string, any>;
  changes?: Record<string, any>;
  changedBy: number;
  newStatus?: processStatus;
  tx: Prisma.TransactionClient
}) => {
  try {
    const result = {
      folderId: data.id,
      action,
      changedBy,
      oldName: action === ActionType.CREATE ? null : data.name ?? null,
      newName: action === ActionType.CREATE ? data.name ?? null : changes?.name ?? null,
      oldCode: action === ActionType.CREATE ? null : data.code ?? null,
      newCode: action === ActionType.CREATE ? data.code ?? null : changes?.code ?? null,
      oldStatus: action === ActionType.CREATE ? null : data.status ?? null,
      newStatus: action === ActionType.CREATE ? data.status ?? null : newStatus ?? null,
    };
    return await tx.folderLog.create({ data: result });
  } catch (error) {
    throw error;
  }
};
export const createFolderPriceService = async (prices: folderPrice[], tx: Prisma.TransactionClient) => {
  return await tx.folderPrice.createMany({
    data: prices,
  });
};

