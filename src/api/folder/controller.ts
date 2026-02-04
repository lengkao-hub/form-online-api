import { Request, Response } from "express";
// import { dataTokenPayload } from "../../utils/lib";
import { getAllService } from "./service";

export const getAllFolderController = async (req: Request, res: Response) => {
  try {
    // const companyId = Number(dataTokenPayload(req, res)?.companyId);
    const result = await getAllService();
    res.json({
      status: "ok",
      message: "success",
      result,
    });
  } catch (error) {
    throw error;
  }

};