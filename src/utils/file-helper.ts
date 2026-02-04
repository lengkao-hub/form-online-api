/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-magic-numbers */

import dayjs from "dayjs";
import multer, { diskStorage } from "multer";
import { resolve } from "path";
import env from "./env";
export function setFileName(length: number = 25): string {
  let text = "";
  const possible = "abcdefghijklmnopqrstuvwxyz012345678ASDFGHJKLZXCVBNMQWERTYUIOP";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const dateDir = dayjs().format("YYYYMMDD");

export const upload = (directory: string = "", separateByDate = false) =>
  multer({
    storage: diskStorage({
      destination: resolve(`${env.PWD}/uploads/${directory}`),
      filename: (_, file, cb) => {
        const ext = file.originalname.split(".").pop();
        const fileName = dateDir + file.fieldname + setFileName() + `.${ext}`;
        cb(null, `${fileName}`);
      },
    }),
  });

interface UploadFilesOptions {
  directory?: string;
  separateByDate?: boolean;
  fields?: string[];
  allowDynamicFields?: boolean;
}

export const uploadFiles = ({
  directory = "",
  separateByDate = false,
  fields = ["image"],
  allowDynamicFields = false,
}: UploadFilesOptions = {}) => {
  const storage = diskStorage({
    destination: resolve(`${env.PWD}/uploads/${directory}`),
    filename: (_, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const fileName = dateDir + file.fieldname + setFileName() + `.${ext}`;
      cb(null, `${fileName}`);
    },
  });

  // ✅ ຖ້າ allowDynamicFields = true, ໃຊ້ .any() ແທນ .fields()
  if (allowDynamicFields) {
    return multer({
      storage,
      fileFilter: (req, file, cb) => {
        // ✅ ຍອມຮັບທຸກ field ທີ່ຂຶ້ນຕົ້ນດ້ວຍຊື່ໃນ fields array
        const isValid = fields.some((fieldName) =>
          file.fieldname === fieldName || file.fieldname.startsWith(`${fieldName}_`),
        );

        if (isValid) {
          cb(null, true);
        } else {
          cb(new Error(`Unexpected field: ${file.fieldname}`));
        }
      },
    }).any();
  }

  // ✅ ຖ້າບໍ່, ໃຊ້ .fields() ແບບເກົ່າ
  return multer({ storage }).fields(
    fields.map((name) => ({
      name,
      maxCount: 10,
    })),
  );
};
export const uploadFile = (
  directory: string = "",
  separateByDate = false,
  fields: string[] = ["image"],
) =>
  multer({
    storage: diskStorage({
      destination: resolve(`${env.PWD}/uploads/${directory}`),
      filename: (_, file, cb) => {
        const ext = file.originalname.split(".").pop();
        const fileName = dateDir + file.fieldname + setFileName() + `.${ext}`;
        cb(null, `${fileName}`);
      },
    }),
  }).fields(
    fields.map((name) => ({
      name,
      maxCount: 20,
    })),
  );