import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../../middleware/logger/config";
import { aggregationChartProfileServices, aggregationProfileServices } from "./service";

export const getAggregationChartProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { officeId } = req.query;
    const aggregationResult = await aggregationChartProfileServices({
      officeId: Number(officeId),
    });
    res.json({
      status: "ok",
      message: "Success",
      result: aggregationResult,
    });
    return;
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching user aggregation.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

export const getAggregationProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { start, end, officeId, year } = req.query;
    const aggregationResult = await aggregationProfileServices({
      start: start as string,
      end: end as string,
      year: Number(year),
      officeId: Number(officeId),
    });
    res.json({
      status: "ok",
      message: "Success",
      result: aggregationResult,
    });
    return;
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching user aggregation.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
