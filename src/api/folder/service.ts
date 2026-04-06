
import { FolderRejectStatus } from "@prisma/client";
import { prisma } from "../../prisma";

export const getAllService = async (wherefolder: { status: FolderRejectStatus; companyId: number }) => {
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
export const getAllServices = async (status: FolderRejectStatus) => { 
  const data = await prisma.folder.findMany({
    where: {
      status: status,
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
export const getOneServices = async (status: FolderRejectStatus, id: number) => {
  const data = await prisma.folder.findFirst({
    where: {
      status: status,
      id: id,
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

