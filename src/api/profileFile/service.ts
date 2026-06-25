import { prisma } from "src/prisma";

export const createProfileFileService = async (profileId: number, profileFile: any[]) => {
  if (profileFile.length === 0) {
    return [];
  }
  console.log("Creating profile files for user ID:", profileId, profileFile);
  const createdFiles = await prisma.profileFile.createManyAndReturn({
    data: profileFile.map((file) => ({
      profileId: profileId,
      name: file.name,
      file: file.file,
    })),
  });
  return createdFiles;
};
