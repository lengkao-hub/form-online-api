/* eslint-disable max-params */
import { blacklist, Prisma } from "@prisma/client";
import { Request } from "express";
import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma/index";
import { addIndexToResults } from "../../utils/addIndexToResults";
import { PaginateCalucations, validatePaginationParams } from "../../utils/pagination";

export const getBlacklistedProfilesService = async (req: Request) => {
  const paginationParams = validatePaginationParams(req);
  const { page, limit, paginate } = paginationParams;
  const { search, gender, officeId } = req.query;
  try {
    const whereClause: Prisma.blacklistWhereInput = {
      profile: {
        OR: search
          ? [
            { firstName: { contains: String(search), mode: "insensitive" } },
            { lastName: { contains: String(search), mode: "insensitive" } },
            { phoneNumber: { contains: String(search), mode: "insensitive" } },
          ]
          : undefined,
        gender: gender ? { equals: String(gender), mode: "insensitive" } : undefined,
        officeId: officeId ? Number(officeId) : undefined,
      },
    };
    const queryFn = async (skip: number, take: number) => {
      const data = await prisma.blacklist.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            include: {
              nationality: true,
              ethnicity: true,
              district: true,
              province: true,
            },
          },
        },
      });
      const totalCount = await prisma.blacklist.count({
        where: whereClause,
      });
      return [data, totalCount];
    };

    const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
    const dataWithIndex = addIndexToResults(
      paginationResult.result,
      page,
      limit,
    );
    return {
      ...paginationResult,
      result: dataWithIndex,
    };
  } catch (error) {
    logger.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

export const getCheckBlacklistAndExistService = async ({
  req,
}: {
  req: Request;
}) => {
  const { firstName, lastName, dateOfBirth, identityNumber } = req.query;
  validateInput(firstName, lastName, dateOfBirth, identityNumber);
  const { year, month, day } = parseDateOfBirth(dateOfBirth as string);
  try {
    const blacklistedProfile = await checkBlacklist(firstName as string, lastName as string, identityNumber as string, year, month, day);
    if (blacklistedProfile) {
      return { status: "blacklisted", message: "ບຸກຄົນນີຖືກຂຶ້ນບັນຊິດໍາ" };
    }
    return {
      status: "ok",
      message: "No matching profile found in the database.",
    };
  } catch {
    throw new Error("Failed to fetch application requests");
  }
};

// const checkProfileExistence = async (
//   firstName: string,
//   lastName: string,
//   year: number,
//   month: number,
//   day: number,
// ) => {
//   return await prisma.profile.findFirst({
//     where: {
//       firstName: { equals: firstName.trim(), mode: "insensitive" },
//       lastName: { equals: lastName.trim(), mode: "insensitive" },
//       dateOfBirth: {
//         gte: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)),
//         lt: new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0)),
//       },
//     },
//   });
// };

const checkBlacklist = async (
  firstName: string,
  lastName: string,
  identityNumber: string,
  year: number,
  month: number,
  day: number,
) => {
  return await prisma.profile.findFirst({
    where: {
      firstName: { equals: firstName.trim(), mode: "insensitive" },
      lastName: { equals: lastName.trim(), mode: "insensitive" },
      identityNumber: { equals: identityNumber.trim(), mode: "insensitive" },
      dateOfBirth: {
        gte: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)),
        lt: new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0)),
      },
      blacklist: {
        some: {
          status: true,
        },
      },
    },
  });
};

const parseDateOfBirth = (
  dateOfBirth: string,
): { year: number; month: number; day: number } => {
  const parsedDate = new Date(dateOfBirth);
  return {
    year: parsedDate.getUTCFullYear(),
    month: parsedDate.getUTCMonth(),
    day: parsedDate.getUTCDate(),
  };
};

const validateInput = (
  firstName: unknown,
  lastName: unknown,
  dateOfBirth: unknown,
  identityNumber: unknown,
): void => {
  if (
    !firstName ||
    typeof firstName !== "string" ||
    !lastName ||
    typeof lastName !== "string" ||
    !identityNumber ||
    typeof identityNumber !== "string" ||
    !dateOfBirth ||
    typeof dateOfBirth !== "string"
  ) {
    throw new Error(
      "Missing required fields: firstName, lastName, identityNumber, or dateOfBirth.",
    );
  }
};

export const createBlacklistService = async (
  blacklist: Omit<blacklist, "id">,
) => {
  try {
    const createdBlacklist = await prisma.blacklist.create({
      data: blacklist,
    });
    return createdBlacklist;
  } catch (error) {
    logger.error(error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
};