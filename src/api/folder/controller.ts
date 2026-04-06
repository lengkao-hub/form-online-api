import { FolderRejectStatus } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../../middleware/logger/config";
import { dataTokenPayload } from "../../utils/lib";
import { getAllService, getAllServices, getOneServices } from "./service";

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
export const getAllFolderControllers = async ( req: Request, res: Response ) => {
  try {  
    const status= req.query.status as FolderRejectStatus; 
    const result = await getAllServices(status); 
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
export const getOneFolderControllers = async ( req: Request, res: Response ) => {
  try { 
    const status= req.query.status as FolderRejectStatus; 
    const id = Number(req.params.id);
    const result = await getOneServices(status, id); 
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
