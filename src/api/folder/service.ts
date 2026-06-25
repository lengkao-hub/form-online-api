
import { FolderRejectStatus } from "@prisma/client";
import { Request } from "express";
import { getImagePath } from "src/utils/fileUrl";
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
export const getAllServices = async (req: Request, status: FolderRejectStatus, officeId: string) => {
  const data = await prisma.folder.findMany({
    where: {
      status: status,
      user: {
        officeId: Number(officeId),
      },
    },
    include: {
      user: true,
      profile: {
        include: {
          profileFile: true,
        },
      },
      folderPrice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log("data",data);
  const mapFolderWithProfile = (folder: any) => ({
    ...folder,
    profile: folder.profile.map((profile: any) => mapProfileWithImage(req, profile)),
  });
  const foldersWithProfileFiles = data.map(mapFolderWithProfile);
  return foldersWithProfileFiles;
};
const mapProfileWithImage = (req: Request, profile: any) => ({
  ...profile,
  profileFile: getImagePath({ req, data: profile.profileFile, field: "file" }),
});

export const getOneServices = async (req: Request, status: FolderRejectStatus, id: number) => {
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
      profile: {
        include: {
          profileFile: true,
        },
      },
      folderPrice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const folderWithProfileFiles = {
    ...data,
    profile: data?.profile?.map((profile) => mapProfileWithImage(req, profile)),
  };
  return folderWithProfileFiles;
};

