import logger from "../../middleware/logger/config";
import { prisma } from "../../prisma";

const SIX_MONTHS = 6;
const MIN_VALID_YEAR = 1900;

export const aggregationChartProfileServices = async ({
  officeId,
}: {
  officeId: number;
}) => {
  try {
    const result = await getAggregatedProfileData({ officeId });
    return result;
  } catch (error) {
    logger.error("Error in aggregationChartProfileServices:", error);
    throw new Error("Failed to aggregate profile data");
  };
};
const getAggregatedProfileData = async ({
  officeId,
}: {
  officeId: number;
}): Promise<{ month: string; male: number; female: number }[]> => {
  const currentDate = new Date();
  const sixMonthsAgo = new Date(currentDate);
  sixMonthsAgo.setMonth(currentDate.getMonth() - SIX_MONTHS);
  const profiles = await fetchProfilesCreatedInLastSixMonths(
    sixMonthsAgo,
    officeId,
  );
  const months = generateLastSixMonths();
  return aggregateProfilesByGender(profiles, months);
};
const fetchProfilesCreatedInLastSixMonths = async (
  sixMonthsAgo: Date,
  officeId: number,
) => {
  const whereWithOffice =
  officeId !== null && !Number.isNaN(officeId) && officeId !== 0
    ? { officeId }
    : {};
  return prisma.profile.findMany({
    where: {
      ...whereWithOffice,
      folderId: { not: null }, // ສະເພາະ profile ທີ່ມີ folderId
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
  });
};

function generateLastSixMonths(): string[] {
  const months: string[] = [];
  const currentDate = new Date();

  for (let i = SIX_MONTHS - 1; i >= 0; i--) {
    const currentDateIter = new Date(currentDate);
    currentDateIter.setMonth(currentDate.getMonth() - i);
    const month = currentDateIter.toLocaleString("en-US", { month: "short" }); // Jan, Feb
    const year = currentDateIter.getFullYear();

    months.push(`${month}-${year}`);
  }

  return months;
}

function aggregateProfilesByGender(
  profiles: any[],
  months: string[],
): { month: string; male: number; female: number }[] {

  const result = months.map((month) => ({
    month,
    male: 0,
    female: 0,
  }));

  profiles.forEach((profile) => {
    const date = new Date(profile.createdAt);
    const monthStr = `${date.toLocaleString("en-US", {
      month: "short",
    })}-${date.getFullYear()}`;

    // eslint-disable-next-line max-nested-callbacks
    const found = result.find((m) => m.month === monthStr);

    if (found) {
      if (profile.gender === "MALE") {
        found.male += 1;
      } else if (profile.gender === "FEMALE") {
        found.female += 1;
      }
    }
  });

  return result;
}

export const aggregationProfileServices = async ({
  start,
  end,
  year,
  officeId,
}: {
  start: string;
  end: string;
  year: number,
  officeId: number | null;
}) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const isValidYear = (y: unknown): y is number =>
      typeof y === "number" && Number.isInteger(y) && y > MIN_VALID_YEAR;

    const yearFilter = isValidYear(year)
      ? {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      }
      : {}; 
    const whereWithOffice = officeId !== null && !Number.isNaN(officeId) && officeId !== 0
      ? { officeId }
      : null;
    const [total, maleCounts, femaleCounts, newProfilesCount, femaleNewProfilesCount] = await Promise.all([
      prisma.profile.count({
        where: {
          ...whereWithOffice,
          ...yearFilter,
        },
      }),
      prisma.profile.count({
        where: {
          ...whereWithOffice,
          gender: { in: ["MALE", "M"] },
          ...yearFilter,
        },
      }),
      prisma.profile.count({
        where: {
          ...whereWithOffice,
          gender: { in: ["FEMALE", "F"] },
          ...yearFilter,
        },
      }),
      prisma.profile.count({
        where: {
          ...whereWithOffice,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.profile.count({
        where: {
          ...whereWithOffice,
          createdAt: { gte: startDate, lte: endDate },
          gender: { in: ["FEMALE", "F"] },
        },
      }),
    ]);

    return { total, male: maleCounts, female: femaleCounts, newProfilesCount, femaleNewProfilesCount };
  } catch (error) {
    logger.error("Error in aggregationProfileServices:", error);
    throw new Error("Failed to aggregate profile data");
  };
};