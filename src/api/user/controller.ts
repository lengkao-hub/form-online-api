
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import logger from "../../middleware/logger/config";
import {
  buildNewUser,
  buildUserRecord,
  createCompanyFiles,
  hashPassword,
  isPhoneNumberTaken,
} from "./lib";

import { Prisma } from "@prisma/client";
import { sendErrorResponse } from "../../api/lib";
import { prisma } from "../../prisma";
import { dataTokenPayload } from "../../utils/lib";
const saveCompanyFiles = async (
  tx: Prisma.TransactionClient,
  userId: number, 
  companyFile: any[],
) => {
  if (companyFile.length === 0) {
    return;
  }
  await tx.companyFile.createMany({
    data: companyFile.map((file) => ({
      userId,
      name: file.name,
      file: file.file,
    })),
  });
};

import { getFileUrlsWithName } from "src/utils/fileUrl";
import {
  createUserServicer,
  getAllUserService,
  getOneUserServicer,
  updateUserAccountService,
} from "./service";

export const createUserCompanyController = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { firstName, phone, email, password, lastName, role, username, isActive } = req.body; 
    const isPhoneExists = await isPhoneNumberTaken(phone);
    const companyId = dataTokenPayload(req, res)?.companyId;
    const officeId = dataTokenPayload(req, res)?.officeId; 
    if (isPhoneExists) {
      sendErrorResponse(res, StatusCodes.BAD_REQUEST, "ໝາຍເລກໂທລະສັບນີ້ ມີໃນລະບົບແລ້ວ");
      return;
    } 
 
    const hashedPassword = await hashPassword(password); 

    const transactionResult = await prisma.$transaction(async (tx) => {
      const newUser = buildNewUser({ 
        firstName, 
        lastName, 
        phone, 
        email, 
        hashedPassword, 
        role, 
        username, 
        isActive, 
        companyId, 
        officeId,
      }); 
      console.log("New User Data:", newUser);
      const createdUser = await createUserServicer(newUser, tx); 
      return createdUser;
    });

    res.json({
      status: "ok",
      message: "success",
      ...transactionResult,
    });

  } catch (error) {
    logger.error(error);
    sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, "ສ້າງບັນຊີບໍ່ສໍາເລັດ");
  } finally {
    await prisma.$disconnect();
  }
};

export const updateUserCompanyController = async (
  req: Request,
  res: Response,
) => {
  const id = Number(req.params.id);
  // if (!req.body.password) {
  //   sendErrorResponse(res, StatusCodes.BAD_REQUEST, "ກະລຸນາປ້ອນລະຫັດຜ່ານ");
  //   return;
  // }
  try { 
    const transactionResult = await prisma.$transaction(async (tx) => {
      const data = await buildUserRecord(req.body);
      console.log("Data to update:", data);
      const existingUser = await tx.user.findUnique({
        where: { id }, 
      });
      if (!existingUser) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: "error",
          message: "User not found",
        });
        return;
      }  
 
      const updateData = {
        ...data, 
      };
      const result = await updateUserAccountService({ data: updateData, id, tx });
     
      return result;
    });

    res.json({
      status: "success",
      message: "edit success",
      data: transactionResult,
    });
  } catch (e) {
    logger.error(e);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An unexpected error occurred",
    });
  }
};
export const getManyUserController = async (req: Request, res: Response) => {
  try {
    const companyId = dataTokenPayload(req, res)?.companyId;
    const result = await getAllUserService(req, companyId);
    res.json({
      status: "ok",
      message: "success",
      ...result,
    });
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to fetch folder",
    });
  }
}; 
export const getOneUserController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id); 
    if (isNaN(id) || id <= 0) { 
      res.status(StatusCodes.NOT_FOUND).json({ status: "error", message: "Invalid user ID" });
      return;
    }
    const user = await getOneUserServicer({ id });
    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ status: "error", message: "User not found" });
      return;
    }
    res.json({ status: "ok", message: "User retrieved successfully", ...user });
    return;
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An unexpected error occurred",
      error: (error as Error).message,
    });
    return;
  }
};

export const createUserController = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { firstName, phone, email, password, lastName, role, username, isActive, companyId, officeId } = req.body; 
    const isPhoneExists = await isPhoneNumberTaken(phone);
    if (isPhoneExists) {
      sendErrorResponse(res, StatusCodes.BAD_REQUEST, "ໝາຍເລກໂທລະສັບນີ້ ມີໃນລະບົບແລ້ວ");
      return;
    } 
 
    const hashedPassword = await hashPassword(password);

    // ✅ ເອົາ companyFile ຈາກ upload middleware (.array("companyFile"))
    const companyFile = getFileUrlsWithName(req);
    console.log("Uploaded Files:", companyFile);

    const transactionResult = await prisma.$transaction(async (tx) => {
      const newUser = buildNewUser({ 
        firstName, 
        lastName, 
        phone, 
        email, 
        hashedPassword, 
        role, 
        username, 
        isActive, 
        companyId , 
        officeId,
      });
      console.log("New User Data:", newUser);
      const createdUser = await createUserServicer(newUser, tx); 
      if (companyFile && createdUser) {
        await saveCompanyFiles(tx, createdUser.id, companyFile);
      } 
      return createdUser;
    });

    res.json({
      status: "ok",
      message: "success",
      ...transactionResult,
    });

  } catch (error) {
    logger.error(error);
    sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, "ສ້າງບັນຊີບໍ່ສໍາເລັດ");
  } finally {
    await prisma.$disconnect();
  }
};
export const updateUserEditAccountController = async (
  req: Request,
  res: Response,
) => {
  const id = Number(req.params.id);
  const companyFileIds: number[] = JSON.parse(req?.body?.companyFileIds);
  const companyFile = getFileUrlsWithName(req);
  console.log("Company File IDs to keep:", companyFileIds);
  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      await tx.companyFile.updateMany({
        data: {
          deletedAt: new Date(),
        },
        where: {
          userId: id, 
          id: {
            notIn: companyFileIds,
          },
        },
      }); 
      await createCompanyFiles(tx, id, companyFile);
      
      const data = await buildUserRecord(req.body);
      const existingUser = await tx.user.findUnique({
        where: { id },
      });
      if (!existingUser) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: "error",
          message: "User not found",
        });
        return;
      }
      // const checkPhone = await findUserServicer(data.phone, tx);
      // if (checkPhone && checkPhone.id !== id) {
      //   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      //     status: "error",
      //     message: "ເບີໂທນີ້ ຖືກໃຊ້ງານແລ້ວ",
      //   });
      //   return;
      // }
      const result = await updateUserAccountService({ data: data, id, tx });
      return { result, companyFile };
    });

    res.json({
      status: "success",
      message: "edit success",
      data: transactionResult,
    });
  } catch (e) {
    logger.error(e);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An unexpected error occurred",
    });
  } finally {
    await prisma.$disconnect();
  }
};

