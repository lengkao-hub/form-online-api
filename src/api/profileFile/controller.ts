import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "src/middleware/logger/config";
import { prisma } from "src/prisma";
import { getFileUrlsWithName } from "src/utils/fileUrl";
import { sendErrorResponse } from "../lib";
import { createProfileFileService } from "./service";
export const createProfileFileController = async (req: Request, res: Response) => {
  try {
    const profileId = Number(req.params.id);
    const profileFile = getFileUrlsWithName(req);
    // Save the profile file information to the database
    const result = await createProfileFileService(profileId, profileFile);
    res.json({
      status: "success",
      message: "ບັນທືກຂໍ້ມູນສໍາເລັດ",
      data: result,
    });
  } catch (error) {
    logger.error(error);
    sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, "ບັນທືກຂໍ້ມູນລົ້ມເຫຼວ");
  } finally {
    await prisma.$disconnect();
  }
}; 
