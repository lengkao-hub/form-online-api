/* eslint-disable no-magic-numbers */

/* eslint-disable max-depth */
import { profile } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma/index";
import { processFileUrl } from "../../utils/fileUrl";
import { dataTokenPayload } from "../../utils/lib";
import { validatePaginationParams } from "../../utils/pagination";
import { buildEditProfileRecord } from "./lib";
import {
  createProfileService,
  editProfileService,
  getAllApprovedService,
  getAllProfilesService,
  getOneProfileService,
} from "./service";
export const getApprovedController = async (req: Request, res: Response) => {

  const userId = Number(dataTokenPayload(req, res)?.id);
  const pagination = validatePaginationParams(req);
  if (!pagination) {
    return;
  }
  const { search, gender, year, date, status } = req.query;
  const parsedDate = date ? new Date(date.toString()) : undefined;
  try {
    const result = await getAllApprovedService({
      page: pagination.page,
      limit: pagination.limit,
      paginate: pagination.paginate,
      search: search?.toString(),
      gender: gender?.toString(),
      year: year?.toString(),
      date: parsedDate,
      status: status,
      userId: userId,
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
export const getAllProfileController = async (req: Request, res: Response) => {

  const userId = Number(dataTokenPayload(req, res)?.id);
  const pagination = validatePaginationParams(req);
  if (!pagination) {
    return;
  }
  const { search, gender, year, date } = req.query;
  const parsedDate = date ? new Date(date.toString()) : undefined;
  try {
    const result = await getAllProfilesService({
      page: pagination.page,
      limit: pagination.limit,
      paginate: pagination.paginate,
      search: search?.toString(),
      gender: gender?.toString(),
      year: year?.toString(),
      date: parsedDate,
      userId: userId,
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

export const getOneProfileController = async (req: Request, res: Response) => {
  try {
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

export const createProfileController = async (req: Request, res: Response) => {
  try {
    const tokenData = dataTokenPayload(req, res);
    const userId = Number(tokenData?.id);
    const companyId = Number(tokenData?.companyId);

    // ✅ ເມື່ອໃຊ້ .any() → req.files ເປັນ Array
    const uploadedFiles = req.files as Express.Multer.File[];
    // Parse customers
    let parsedArray: any[] = [];
    const rawBody = req.body;

    if (rawBody.customers && typeof rawBody.customers === "string") {
      try {
        parsedArray = JSON.parse(rawBody.customers);
      } catch {
        throw new Error("Invalid JSON format in customers field");
      }
    } else if (Array.isArray(rawBody.customers)) {
      parsedArray = rawBody.customers;
    } else if (Array.isArray(rawBody)) {
      parsedArray = rawBody;
    } else {
      parsedArray = [rawBody];
    }

    if (!parsedArray || parsedArray.length === 0) {
      throw new Error("No customer data provided");
    }
    // ✅ ສ້າງ key ຂອງຮູບ ແລະ ທີ່ ຢູ່ຂອງຮູບ
    const fileMap: { [fieldname: string]: string } = {};
    if (uploadedFiles && Array.isArray(uploadedFiles)) {
      uploadedFiles.forEach((file) => {
        fileMap[file.fieldname] = `/uploads/profile/${file.filename}`;
      });
    }

    const imageFiles: (string | null)[] = parsedArray.map((_, index) => {
      // fieldName ມັນຈະສ້າງຊື່ key ຂອງຂໍ້ມູນ
      const fieldName = `image_${index}`;
      return fileMap[fieldName] || null;
    });
    const transactionResult = await prisma.$transaction(async (tx) => {
      const folder = await tx.folder.create({
        data: { userId, companyId },
      });

      if (!folder) {
        throw new Error("Failed to create folder");
      }

      // ແຍກ transform function ອອກມາ
      const transformCustomerData = (item: any, index: number) => {
        if (!item.firstName || !item.lastName) {
          throw new Error(`firstName and lastName are required for customer at index ${index}`);
        }

        return {
          firstName: item.firstName,
          lastName: item.lastName,
          phoneNumber: item.phoneNumber || null,
          dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : null,
          gender: item.gender || null,
          nationalityId: item.nationalityId ? Number(item.nationalityId) : null,
          ethnicityId: item.ethnicityId ? Number(item.ethnicityId) : null,
          identityType: item.identityType || null,
          identityIssueDate: item.identityIssueDate ? new Date(item.identityIssueDate) : null,
          identityNumber: item.identityNumber || null,
          identityExpiryDate: item.identityExpiryDate ? new Date(item.identityExpiryDate) : null,
          currentProvince: item.currentProvince ? Number(item.currentProvince) : null,
          currentDistrict: item.currentDistrict ? Number(item.currentDistrict) : null,
          currentVillageId: item.currentVillageId ? Number(item.currentVillageId) : null,
          overseasCountryId: item.overseasCountryId ? Number(item.overseasCountryId) : null,
          overseasProvince: item.overseasProvince || null,
          folderId: folder.id,
          image: imageFiles[index],
          companyId,
          userId,
        };
      };

      // ແລ້ວໃຊ້ແບບນີ້
      const dataToSave = parsedArray.map(transformCustomerData);

      const createdProfile = await createProfileService(dataToSave, tx);
      return createdProfile;
    });

    res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Profile created successfully",
      result: transactionResult,
    });
  } catch (error: any) {
    logger.error("Error creating profile", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Failed to create profile data",
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const editProfileController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const getImage = await processFileUrl(req, "image");
    const getOldImage = await processFileUrl(req, "oldImage");
    const updatedRecord = buildEditProfileRecord({ profile: req.body, imagePath: getImage, oldImage: getOldImage });
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
      const editProfile = await editProfileService({ data: updatedRecord as profile, id, tx });
      // await createProfileLogService({
      //   action: ActionType.UPDATE,
      //   data: existingProfile as Record<string, any>,
      //   changes: editProfile,
      //   changedBy,
      //   tx,
      // });
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

export const checkProfileExistenceController = async (req: Request, res: Response) => {
  const { identityNumber, identityType } = req.body;

  try {
    const existing = await prisma.profile.findFirst({
      where: {
        identityNumber,
        identityType,
      },
    });
    if (existing) {
      res.json({
        identityType: existing ? "ປະເພດເອກະສານນີ້ມີຢູ່ໃນລະບົບແລ້ວ" : null,
        identityNumber: existing ? "ເລກທີເອກະສານນີ້ມີໃນລະບົບແລ້ວ" : null,
        identityExists: true,
        data: existing,
      });
      return;
    }

    res.json({
      identityExists: false,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error checking profile data",
      error: error.message,
    });
    return;
  }
};
// export const getReportController = async (req: Request, res: Response) => {
//   try {
//     const { start, end, officeIds, gender, nationality, filterType } = req.query;
//     const officeIdsQuery = officeIds
//       ? (officeIds as string)
//         .split(",")
//         .map((id) => Number(id))
//         .filter((id) => !Number.isNaN(id))
//       : [];
//     const aggregationResult = await reportProfileServices({
//       start: start as string,
//       end: filterType === "daily" ? undefined : end as string,
//       gender: gender as string,
//       nationality: nationality as string,
//       officeIds: officeIdsQuery,
//     });
//     res.json({
//       status: "ok",
//       message: "Success",
//       result: aggregationResult,
//     });
//     return;
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching user report.",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//     return;
//   }
// };