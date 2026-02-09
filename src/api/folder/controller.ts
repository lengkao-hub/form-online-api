import { FolderRejectStatus } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "src/middleware/logger/config";
import { dataTokenPayload } from "../../utils/lib";
import { getAllService } from "./service";

export const getAllFolderController = async ( req: Request, res: Response ) => {
  try { 
    const companyId = Number(dataTokenPayload(req, res)?.companyId); 
    const status = req.query.status as FolderRejectStatus;
    const wherefolder = { status, companyId };
    const result = await getAllService(wherefolder);
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
