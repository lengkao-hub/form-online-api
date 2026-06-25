import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcrypt";

import { prisma } from "../../prisma";
import { findOneUserServicer } from "./service";
import { UserRecord } from "./types";

export const buildUserRecord = async (data: UserRecord) => {
  const { firstName, lastName, phone, email, password, role, isActive, username } = data;
  const userRecord: UserRecord = { firstName, lastName, phone, email, role, isActive, username };
  if (password && password.trim() !== "") {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    userRecord.password = hashedPassword;
  } 
  return userRecord;
};

export const hashPassword = (password: string): string => {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
};

export const buildNewUser = ({
  firstName,
  lastName,
  phone,
  email,
  hashedPassword,
  role,
  username,
  isActive,
  companyId,
  officeId,
}: any) => ({
  firstName,
  lastName,
  phone,
  username,
  email, 
  companyId: Number(companyId),
  officeId: Number(officeId),
  password: hashedPassword,
  role: role || Role.ADMIN,
  isActive: isActive === "true" || isActive === true,
  updatedAt: new Date(),
  createdAt: new Date(),
  deletedAt: null,
});

export const isPhoneNumberTaken = async (phone: string): Promise<boolean> => {
  const user = await prisma.user.findFirst({
    where: { phone },
    select: { id: true },
  });
  return !!user;
};

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const user = await findOneUserServicer(username);
  return !!user;
};

export const validatePassword = (plainPassword: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

export const buildPayload = (user: any) => ({
  id: user.id,
  phone: user.phone,
  role: [user.role],
  firstName: user.firstName,
  email: user.email,
});

export const buildWhereClause = ({
  search,
  companyId,
  role,
}: {
  search?: any;
  companyId?: number;
  role?: any;
}): Prisma.userWhereInput => {
  const whereClause: Prisma.userWhereInput = {};
  if (search) {
    whereClause.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  if (companyId) {
    whereClause.companyId = companyId;
  }
  if (role) {
    whereClause.role = role;
  }
  return whereClause;
};

export const createCompanyFiles = async (
  tx: any, 
  userId: number, 
  files: { name: string; file: string }[],
) => {
  if (!files || files.length === 0) {
    return;
  }

  return await tx.companyFile.createMany({
    data: files.map((file) => ({
      userId: userId,
      name: file.name,
      file: file.file,
    })),
  });
};