
import { prisma } from "src/prisma";

export const getAllService = async () => {
  const data = await prisma.folder.findMany({
    where: { 
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
      folderPrice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
