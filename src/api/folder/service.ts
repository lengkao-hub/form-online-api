
import { FolderRejectStatus } from "@prisma/client";
import { prisma } from "src/prisma";

export const getAllService = async (wherefolder: { status: FolderRejectStatus; companyId: number }) => {
  // console.log("companyId:", companyId);
  // console.log("status:", status);
  const data = await prisma.folder.findMany({
    where: {
      companyId: wherefolder.companyId,
      status: wherefolder.status,
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
