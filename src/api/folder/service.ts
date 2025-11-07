import { prisma } from "src/prisma";

export const getAllService = async (companyId: number) => {
  const data = await prisma.folder.findMany({
    where: {
      companyId: companyId,
      profile: {
        some: {
          status: "PENDING",
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      profile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
