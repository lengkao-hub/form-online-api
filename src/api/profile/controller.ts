/* eslint-disable max-lines */
/* eslint-disable no-magic-numbers */
 
import { FolderRejectStatus, profile } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma/index";
import { getFileUrlsWithName, processFileUrl } from "../../utils/fileUrl";
import { dataTokenPayload } from "../../utils/lib";
import { validatePaginationParams } from "../../utils/pagination";
import { buildEditProfileRecord, buildProfileRecord } from "./lib";
import {
  createNewCardService,
  createProfileService,
  editProfileService,
  editStatusService,
  getAllProfilesService,
  getApprovedService,
  getCompopoxService,
  getDetailsProfileService,
  getOneProfileService,
  getRejectedService,
} from "./service";

export const getAllProfileController = async (req: Request, res: Response) => {
  const pagination = validatePaginationParams(req);

  if (!pagination) {
    return;
  }
  const { search, gender, year, date, status, userId } = req.query;
  const parsedDate = date ? new Date(date.toString()) : undefined;
  const companyId = dataTokenPayload(req, res)?.companyId; 
  try {
    const result = await getAllProfilesService({
      page: pagination.page,
      limit: pagination.limit,
      paginate: pagination.paginate,
      search: search?.toString(),
      gender: gender?.toString(),
      year: year?.toString(),
      date: parsedDate,
      companyId: companyId,
      userId: Number(userId),
      status: status,
      req,
    }); 
    res.json({
      status: "ok",
      message: "success",
      ...result,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to fetch application requests",
    });
  }
};
export const getCompopoxController = async (req: Request, res: Response) => {
 
  const { search, userId } = req.query; 
  const companyId = dataTokenPayload(req, res)?.companyId; 
  try {
    const result = await getCompopoxService({ 
      search: search?.toString(), 
      companyId: companyId,
      userId: Number(userId), 
      req,
    }); 
    res.json({
      status: "ok",
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to fetch application requests",
    });
  }
};
export const getApprovedController = async (req: Request, res: Response) => {

  const userId = Number(req.query.userId);
  const pagination = validatePaginationParams(req); 
  const companyId = Number(dataTokenPayload(req, res)?.companyId);
  if (!pagination) {
    return;
  }
  const { search, gender, year, date, status } = req.query;
  const parsedDate = date ? new Date(date.toString()) : undefined;
  try {
    const result = await getApprovedService({
      page: pagination.page,
      limit: pagination.limit,
      paginate: pagination.paginate,
      search: search?.toString(),
      gender: gender?.toString(),
      year: year?.toString(),
      date: parsedDate,
      status: status,
      userId: userId,
      companyId,
      req,
    });
    res.json({
      status: "ok",
      message: "success",
      ...result,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to fetch application requests",
    });
  }
};
export const getDetailsProfileController = async (req: Request, res: Response) => {
  try {
    const pagination = validatePaginationParams(req); 
    if (!pagination) {
      return;
    }
    const result = await getDetailsProfileService({
      id: Number(req.params.id),
      page: pagination.page,
      limit: pagination.limit,
      paginate: pagination.paginate,
      req,
    });
    console.log("result :", result);
    res.json({
      status: "ok",
      message: "success",
      ...result,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to fetch application requests",
    });
  }
};
export const getOneProfileController = async (req: Request, res: Response) => {
  try {
    const pagination = validatePaginationParams(req);
    if (!pagination) {
      return;
    }
    const result = await getOneProfileService({ id: Number(req.params.id), req });
    res.json({
      status: "ok",
      message: "success",
      ...result,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to fetch application requests",
    });
  }
};
const parseProfileFileIds = (value: any): number[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

export const editProfileController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const getImage = await processFileUrl(req, "image"); 
    const profileFileId = parseProfileFileIds(req.body.profileFileIds);
    const updatedRecord = buildEditProfileRecord({ profile: req.body, imagePath: getImage });
    if (req.body) {
      req.body.currentDistrict = parseInt(req.body.currentDistrict, 10);
    }
    if (req.body.currentProvince) {
      req.body.currentProvince = parseInt(req.body.currentProvince, 10);
    }
    if (req.body.ethnicityId) {
      req.body.ethnicityId = parseInt(req.body.ethnicityId, 10);
    }
    if (req.body.nationalityId) {
      req.body.nationalityId = parseInt(req.body.nationalityId, 10);
    }
    const transactionResult = await prisma.$transaction(async (tx) => {
      const editProfile = await editProfileService({ data: updatedRecord as profile,profileFileId, id, tx });
      return editProfile;
    });
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Profile edit successfully",
      result: transactionResult,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An unexpected error occurred",
    });
  } finally {
    await prisma.$disconnect();
  }
};
export const editStatusController = async (req: Request, res: Response) => {
  try {
    const folderId = Number(req.params.id);
    const comment = req.body.comment;
    const status = req.body.status as FolderRejectStatus;  
    console.log("folderId :", folderId, "comment :", comment, "status :", status);
    const result = await editStatusService({
      folderId,
      status,
      comment,
    });
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Profile and folder status updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An unexpected error occurred",
    });
  } finally {
    await prisma.$disconnect();
  }
};
export const deleteProfileController = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const deleteProfile = await prisma.profile.delete({
      where: { id: id },
    });
    return res.status(200).json({
      message: "Profile deleted successfully",
      deleteProfile,
    });
  } catch (error: any) {
    return res.status(500).json({
      massage: "Error deleting profile",
      error: error.massage,
    });
  }
}; 
export const getRejectController = async (req: Request, res: Response) => {
  try {
    const id = Number(dataTokenPayload(req, res)?.id);
    const status = req.query.status as FolderRejectStatus;
    const result = await getRejectedService(id, status);
    res.json({
      status: "ok",
      message: "success",
      result,
    });
  } catch (error) {
    throw error;
  }
};
export const createProfileController = async (req: Request, res: Response) => {
  try {
    const companyId = Number(dataTokenPayload(req, res)?.companyId);
    const userId = Number(dataTokenPayload(req, res)?.id);
    const image = processFileUrl(req, "image");
    const transactionResult = await prisma.$transaction(async (tx) => { 
      const newProfile = buildProfileRecord({
        profile: req.body,
        imagePath: image,
        companyId,
        userId,
      });
      const createdProfile = await createProfileService(newProfile as any, tx);
      return createdProfile;
    });
    res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Profile created successfully",
      result: transactionResult,
    });
  } catch (error) {
    logger.error("Error creating profile", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An unexpected error occurred",
    });
  } finally {
    await prisma.$disconnect();
  }
}; 
export const createNewCardController = async ( req: Request, res: Response): Promise<void> => {
  try {
    const companyId = Number(dataTokenPayload(req, res)?.companyId);
    const userId = Number(dataTokenPayload(req, res)?.id);
    const status = req.query.status as FolderRejectStatus;
    const fileUrlInfos = getFileUrlsWithName(req);

    let recordIndexes = req.body.fileRecordIndex;
    if (typeof recordIndexes === "string") {
      recordIndexes = [recordIndexes];
    }

    const fileMap: Record<string, { file: string; name: string }[]> = {};

    fileUrlInfos.forEach((info, i) => {
      const recordIndex = recordIndexes?.[i];
      if (!recordIndex) {
        return;
      }
      if (!fileMap[recordIndex]) {
        fileMap[recordIndex] = [];
      }
      fileMap[recordIndex].push(info);
    });

    const putdata: any[] = [];
    const allData = Object.keys(req.body).filter((key) => {
      return /^\d+$/.test(key);
    });
    // ລວມ { file, name } ແລະ ຂໍ້ມູນເຂົ້າໃນ putdata
    for (const index of allData) { 
      const record = JSON.parse(req.body[index]);
      const files = fileMap[index] || [];
      const data = {
        ...record,
        files: files,
      };
      putdata.push(data);
    } 
    const groupedByPrice = putdata.reduce((acc: any, item: any) => {
      const key = Number(item.priceId);
      if (isNaN(key)) { 
        return acc;
      }
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
    const transactionResult = await createNewCardService({ companyId, userId , groupedByPrice, status });
    res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Profile New card successfully with files updated",
      result: transactionResult,
    });
    return;
  } catch (error) {
    logger.error("Error New card profile", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An unexpected error occurred",
    });
    return;
  } finally {
    await prisma.$disconnect();
  }
};
