 
/* eslint-disable max-lines */

import { Prisma, profile } from "@prisma/client";
import { Request } from "express";
import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma/index";
import { addIndexToResults } from "../../utils/addIndexToResults";
import { getImagePath, resolveImageUrls } from "../../utils/fileUrl";
import { PaginateCalucations } from "../../utils/pagination";
import {
  buildWhereClause,
  formatDate,
} from "./lib";
import { IGetAllProfilesServiceProps } from "./types";
export const getAllProfilesService = async ({
  page,
  limit,
  paginate,
  search,
  gender,
  year,
  date,
  officeId,
  barcode,
  officeIds,
  excludeApplications = undefined,
  req,
}: IGetAllProfilesServiceProps & { excludeApplications?: boolean, barcode?: number, req: Request, officeIds?: string }) => {
  try {
    const whereClause = buildWhereClause({
      search,
      gender,
      year,
      date,
      excludeApplications,
      officeId,
      barcode,
      officeIds,
    });
    const queryFn = async (skip: number, take: number) => {
      const data = await prisma.profile.findMany({
        skip,
        take,
        where: whereClause,
        include: {
          district: true,
          province: true,
          currentVillage: true,
        },
        orderBy: { createdAt: "desc" },
      });
      const totalCount = await prisma.profile.count({
        where: whereClause,
      });
      return [data, totalCount];
    };
    const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
    const dataWithIndex = addIndexToResults(paginationResult.result, page, limit );
    const result = resolveImageUrls({ records: dataWithIndex, fields: ["image", "oldImage"], request: req, nestedKey: "profileGallery", nestedImageField: "gallery.image" });
    const formattedDate = formatDate(result);
    return {
      ...paginationResult,
      result: formattedDate,
    };
  } catch (error) {
    logger.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

// export const getProfileLogService = async (req: Request) => {
//   const paginationParams = validatePaginationParams(req);
//   const { profileId, action } = req.query;
//   const { page, limit, paginate } = paginationParams;
//   const queryFn = async (skip: number, take: number) => {
//     const where: Record<string, any> = {
//     };
//     if (profileId) {
//       where.profileId = Number(profileId);
//     }
//     if (action) {
//       where.action = action;
//     }
//     const data = await prisma.profileLog.findMany({ where, skip, take, orderBy: { id: "desc" } });
//     const totalCount = await prisma.profileLog.count({ where });
//     return [data, totalCount];
//   };
//   const paginationResult = await PaginateCalucations({ page, limit, queryFn, paginate });
//   const dataWithIndex = addIndexToResults(paginationResult.result, page, limit);
//   return {
//     ...paginationResult,
//     result: dataWithIndex,
//   };
// };

export const getProfilesBarcodeService = async (req: Request) => {
  const { search, barcode } = req.query;
  if (!search && !barcode) {
    return { result: [] };
  }
  try {
    const data = await prisma.profile.findMany({
      include: {
        district: true,
        province: true,
      },
      where: {
        barcode: barcode ? parseInt(barcode as string, 10) : undefined,
        OR: search
          ? [
            { lastName: { contains: search as string, mode: "insensitive" } },
            { firstName: { contains: search as string, mode: "insensitive" } },
            { identityNumber: { contains: search as string, mode: "insensitive" } },
          ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      result: data,
    };
  } catch (error) {
    logger.error(error);
    return { result: [] };
  } finally {
    await prisma.$disconnect();
  }
};
export const getOneProfileService = async ({ id, req }: { id: number | string, req: Request }) => {
  try {
    const profileId = Number(id);
    if (isNaN(profileId)) {
      throw new Error("Invalid profile ID: ID must be a number.");
    }
    const data = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
      },
    });
    if (!data) {
      throw new Error(`Profile with ID ${profileId} not found.`);
    }
    const dataWithImagePath = getImagePath({ req, data, field: "image" });
    const dataWithOldImagePath = getImagePath({ req, data: dataWithImagePath, field: "oldImage" });
    const result = resolveImageUrls({ records: dataWithOldImagePath, fields: ["gallery.image"], request: req, nestedKey: "profileGallery", nestedImageField: "gallery.image" });
    return { result };
  } catch (error) {
    logger.error("Error in getOneProfileService:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
// export const aggregationProfileServices = async ({
//   start,
//   end,
//   officeId,
// }: {
//   start: string;
//   end: string;
//   officeId: number | null;
// }) => {
//   try {
//     const startDate = new Date(start);
//     const endDate = new Date(end);

//     const baseWhere = {
//       deletedAt: null,
//       ...excludeBlacklistedProfiles,
//     };
//     const whereWithOffice =
//     officeId !== null && !Number.isNaN(officeId) && officeId !== 0
//       ? { ...baseWhere, officeId }
//       : baseWhere;
//     const [total, maleCounts, femaleCounts, newProfilesCount, femaleNewProfilesCount] = await Promise.all([
//       prisma.profile.count({
//         where: whereWithOffice,
//       }),
//       prisma.profile.count({
//         where: {
//           ...whereWithOffice,
//           gender: { in: ["MALE", "M"] },
//         },
//       }),
//       prisma.profile.count({
//         where: {
//           ...whereWithOffice,
//           gender: { in: ["FEMALE", "F"] },
//         },
//       }),
//       prisma.profile.count({
//         where: {
//           ...whereWithOffice,
//           createdAt: { gte: startDate, lte: endDate },
//         },
//       }),
//       prisma.profile.count({
//         where: {
//           ...whereWithOffice,
//           createdAt: { gte: startDate, lte: endDate },
//           gender: { in: ["FEMALE", "F"] },
//         },
//       }),
//     ]);

//     return { total, male: maleCounts, female: femaleCounts, newProfilesCount, femaleNewProfilesCount };
//   } catch (error) {
//     logger.error("Error in aggregationProfileServices:", error);
//     throw new Error("Failed to aggregate profile data");
//   } finally {
//     await prisma.$disconnect();
//   }
// };

// export const reportProfileServices = async ({
//   start,
//   end,
//   gender,
//   nationality,
//   officeIds,
// }: {
//   start: string;
//   end?: string;
//   gender?: string;
//   nationality?:string;
//   officeIds?: number[];
// }) => {
//   try {
//     const whereClause = buildReportWhereClause({
//       start,
//       end,
//       gender,
//       nationality,
//       officeIds,
//     });

//     const grouped = await prisma.profile.groupBy({
//       by: ["nationalityId", "gender" ],
//       where: {
//         ...whereClause,
//       },
//       _count: {
//         _all: true,
//       },
//     });

//     const tableData = await Promise.all(grouped.map(async (item) => {
//       const nationality = await prisma.nationality.findUnique({
//         where: { id: item.nationalityId },
//       });

//       return {
//         nationality: nationality?.name ?? "Unknown",
//         gender: item.gender,
//         count: item._count._all,
//       };
//     }));

//     const finalTable = tableData.reduce((acc, item) => {
//       const { nationality, gender, count } = item;
//       const key = `${nationality}`;

//       if (!acc[key]) {
//         acc[key] = {
//           nationality,
//           male: 0,
//           female: 0,
//         };
//       }

//       if (gender === "MALE" || gender === "M") { acc[key].male += count; }
//       else if (gender === "FEMALE" || gender === "F") { acc[key].female += count; }

//       return acc;
//     }, {} as Record<string, any>);

//     const finalRows = Object.values(finalTable);
//     const uniqueNationalities = new Set(finalRows.map((row) => row.nationality)).size;

//     const total = finalRows.reduce(
//       (sum, row) => {
//         sum.male += row.male;
//         sum.female += row.female;
//         return sum;
//       },
//       { male: 0, female: 0 },
//     );

//     return {
//       rows: finalRows,
//       total,
//       nationalityCount: uniqueNationalities,
//     };
//   } catch (error) {
//     logger.error("Error in aggregationProfileServices:", error);
//     throw new Error("Failed to aggregate profile data");
//   } finally {
//     await prisma.$disconnect();
//   }
// };

// export const aggregationChartProfileServices = async ({
//   officeId,
// }: {
//   officeId: number;
// }) => {
//   try {
//     const result = await getAggregatedProfileData({ officeId });
//     return result;
//   } catch (error) {
//     logger.error("Error in aggregationChartProfileServices:", error);
//     throw new Error("Failed to aggregate profile data");
//   } finally {
//     await prisma.$disconnect();
//   }
// };

// const getAggregatedProfileData = async ({
//   officeId,
// }: {
//   officeId: number;
// }): Promise<{ month: string; male: number; female: number }[]> => {
//   const currentDate = new Date();
//   const sixMonthsAgo = new Date(currentDate);
//   sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
//   const profiles = await fetchProfilesCreatedInLastSixMonths(
//     sixMonthsAgo,
//     officeId,
//   );
//   const months = generateLastSixMonths();
//   return aggregateProfilesByGender(profiles, months);
// };

// const fetchProfilesCreatedInLastSixMonths = async (
//   sixMonthsAgo: Date,
//   officeId: number,
// ) => {
//   const baseWhere = {
//     deletedAt: null,
//     ...excludeBlacklistedProfiles,
//   };
//   const whereWithOffice =
//   officeId !== null && !Number.isNaN(officeId) && officeId !== 0
//     ? { ...baseWhere, officeId }
//     : baseWhere;
//   return prisma.profile.findMany({
//     where: {
//       ...whereWithOffice,
//       createdAt: {
//         gte: sixMonthsAgo,
//       },
//       ...excludeBlacklistedProfiles,
//     },
//   });
// };

export const createProfileService = async (
  profileData: Omit<profile, "id">,
  tx: Prisma.TransactionClient,
) => {
  try {
    const createdProfile = await tx.profile.create({
      data: profileData,
    });
    return createdProfile;
  } catch (error) {
    logger.error(error);
    throw new Error("Failed to create profile data");
  }
};
export const editProfileService = async ({
  data,
  id,
  tx,
}: {
  data: Omit<profile, "id">;
  id: number;
  tx: Prisma.TransactionClient
}) => {
  try {
    const editProfileRes = await tx.profile.update({
      where: { id },
      data,
    });
    return editProfileRes;
  } catch (error) {
    logger.error(error);
    throw new Error("Failed to editing profile data");
  }
};

// export const createProfileLogService = async ({
//   action,
//   data,
//   changes,
//   changedBy,
//   tx,
// }: {
//   action: ActionType;
//   data: Record<string, any>;
//   changes?: Record<string, any>;
//   changedBy: number;
//   tx: Prisma.TransactionClient
// }) => {
//   const result = {
//     profileId: data.id,
//     action,
//     changedBy,
//     oldFirstName: action === ActionType.CREATE ? null : data.firstName ?? null,
//     newFirstName: action === ActionType.CREATE ? data.firstName ?? null : changes?.firstName ?? null,
//     oldLastName: action === ActionType.CREATE ? null : data.lastName ?? null,
//     newLastName: action === ActionType.CREATE ? data.lastName ?? null : changes?.lastName ?? null,
//     oldPhoneNumber: action === ActionType.CREATE ? null : data.phoneNumber ?? null,
//     newPhoneNumber: action === ActionType.CREATE ? data.phoneNumber ?? null : changes?.phoneNumber ?? null,
//   };
//   await tx.profileLog.create({ data: result });
//   return result;
// };
