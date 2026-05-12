// import { Readable } from "stream";
// import csv from "csv-parser";
// import prisma from "../config/prisma";
// import { donorRepository } from "../repositories/donor.repository";
// import { BloodType, Gender } from "@prisma/client";
// import { AppError } from "../middlewares/errorHandler";

// // ============================================================================
// // BLOOD BANK IMPORT (csv-import)
// // ============================================================================

// interface BloodBankCsvRow {
//   nationalId: string;
//   name: string;
//   phone: string;
//   address?: string;
//   bloodType?: string;
//   gender?: string;
//   campaignNumber: string;
// }

// interface BloodBankImportResult {
//   inserted: number;
//   updated: number;
//   skipped: number;
//   errors: Array<{
//     row: number;
//     reason: string;
//   }>;
// }

// const isValidBloodType = (type: string): type is BloodType => {
//   const validTypes = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"];
//   return validTypes.includes(type);
// };

// const validateBloodBankRow = (
//   row: any,
//   rowNumber: number
// ): { valid: boolean; error?: string; data?: BloodBankCsvRow } => {
//   if (!row.nationalId || typeof row.nationalId !== "string") {
//     return { valid: false, error: `صف ${rowNumber}: معرف المتبرع مطلوب` };
//   }

//   if (!row.name || typeof row.name !== "string") {
//     return { valid: false, error: `صف ${rowNumber}: اسم المتبرع مطلوب` };
//   }

//   if (!row.phone || typeof row.phone !== "string") {
//     return { valid: false, error: `صف ${rowNumber}: رقم الهاتف مطلوب` };
//   }

//   if (!row.campaignNumber) {
//     return { valid: false, error: `صف ${rowNumber}: رقم الحملة مطلوب` };
//   }

//   if (row.bloodType && !isValidBloodType(row.bloodType)) {
//     return { valid: false, error: `صف ${rowNumber}: نوع الدم غير صحيح` };
//   }

//   return {
//     valid: true,
//     data: {
//       nationalId: row.nationalId.trim(),
//       name: row.name.trim(),
//       phone: row.phone.trim(),
//       address: row.address?.trim(),
//       bloodType: row.bloodType?.trim(),
//       gender: row.gender?.trim(),
//       campaignNumber: row.campaignNumber.toString().trim(),
//     },
//   };
// };

// // ============================================================================
// // LEGACY IMPORT (legacy-import)
// // ============================================================================

// interface LegacyDonorRow {
//   "National ID"?: string;
//   ID?: string;
//   "الموبيل"?: string;
//   الاسم?: string;
//   "العنوان"?: string;
//   الدم?: string;
//   النوع?: string;
//   "E-mail"?: string;
//   [key: string]: string | undefined;
// }

// const VALID_BLOOD_TYPES = new Set<BloodType>([
//   "A_POS",
//   "A_NEG",
//   "B_POS",
//   "B_NEG",
//   "AB_POS",
//   "AB_NEG",
//   "O_POS",
//   "O_NEG",
// ]);

// function mapBloodType(value: string | undefined): BloodType | null {
//   if (!value || value.trim() === "" || value === "ـــ") {
//     return null;
//   }

//   const normalized = value.trim().toUpperCase();
//   if (VALID_BLOOD_TYPES.has(normalized as BloodType)) {
//     return normalized as BloodType;
//   }

//   return null;
// }

// function mapGender(value: string | undefined): Gender | null {
//   if (!value || value.trim() === "" || value === "ـــ") {
//     return null;
//   }

//   const normalized = value.trim().toUpperCase();
//   if (normalized === "MALE" || normalized === "ذكر") {
//     return "MALE";
//   }
//   if (normalized === "FEMALE" || normalized === "انثى") {
//     return "FEMALE";
//   }

//   return null;
// }

// function generateNationalId(row: LegacyDonorRow): string {
//   const id = row["National ID"] || "LEGACY-" + (row["ID"] || row["الموبيل"] || "UNKNOWN");
//   return id.trim();
// }

// // ============================================================================
// // UNIFIED IMPORT SERVICE
// // ============================================================================

// export const importService = {
//   // Blood Bank Import
//   async importBloodBankDonors(rows: any[]): Promise<BloodBankImportResult> {
//     const result: BloodBankImportResult = {
//       inserted: 0,
//       updated: 0,
//       skipped: 0,
//       errors: [],
//     };

//     // Validate all rows first
//     const validatedRows: Array<{ rowNumber: number; data: BloodBankCsvRow }> = [];

//     for (let i = 0; i < rows.length; i++) {
//       const rowNumber = i + 2; // +2 because row 1 is header, +1 for 1-based indexing
//       const validation = validateBloodBankRow(rows[i], rowNumber);

//       if (!validation.valid) {
//         result.errors.push({
//           row: rowNumber,
//           reason: validation.error || "خطأ غير معروف",
//         });
//         result.skipped++;
//       } else {
//         validatedRows.push({
//           rowNumber,
//           data: validation.data!,
//         });
//       }
//     }

//     // Process validated rows
//     for (const { rowNumber, data } of validatedRows) {
//       try {
//         // Find campaign by campaignNumber
//         const campaign = await prisma.campaign.findUnique({
//           where: { campaignNumber: parseInt(data.campaignNumber) },
//         });

//         if (!campaign) {
//           result.errors.push({
//             row: rowNumber,
//             reason: `صف ${rowNumber}: الحملة رقم ${data.campaignNumber} غير موجودة`,
//           });
//           result.skipped++;
//           continue;
//         }

//         // Use transaction for atomicity
//         await prisma.$transaction(async (tx) => {
//           // Upsert donor
//           const donor = await tx.donor.upsert({
//             where: { nationalId: data.nationalId },
//             update: {
//               name: data.name,
//               phone: data.phone,
//               address: data.address || null,
//               bloodType: data.bloodType && isValidBloodType(data.bloodType) ? data.bloodType : null,
//               gender: data.gender ? mapGender(data.gender) : null,
//             },
//             create: {
//               nationalId: data.nationalId,
//               name: data.name,
//               phone: data.phone,
//               address: data.address || null,
//               bloodType: data.bloodType && isValidBloodType(data.bloodType) ? data.bloodType : null,
//               gender: data.gender ? mapGender(data.gender) : null,
//             },
//           });

//           // Check if already registered for this campaign
//           const existingRegistration = await tx.donorCampaign.findFirst({
//             where: {
//               donorId: donor.id,
//               campaignId: campaign.id,
//             },
//           });

//           if (!existingRegistration) {
//             // Create registration with unique offlineSyncId
//             await tx.donorCampaign.create({
//               data: {
//                 donorId: donor.id,
//                 campaignId: campaign.id,
//                 offlineSyncId: `csv-import-${data.nationalId}-${campaign.id}`,
//               },
//             });
//             result.inserted++;
//           } else {
//             result.updated++;
//           }
//         });
//       } catch (error: any) {
//         result.errors.push({
//           row: rowNumber,
//           reason: `صف ${rowNumber}: ${error.message || "خطأ في معالجة الصف"}`,
//         });
//         result.skipped++;
//       }
//     }

//     return result;
//   },

//   // Legacy Import
//   async importLegacyDonors(
//     buffer: Buffer
//   ): Promise<{ successCount: number; failedCount: number }> {
//     return new Promise((resolve, reject) => {
//       let successCount = 0;
//       let failedCount = 0;
//       const rows: LegacyDonorRow[] = [];

//       const stream = Readable.from(buffer.toString("utf-8"));

//       stream
//         .pipe(csv())
//         .on("data", (row: LegacyDonorRow) => {
//           rows.push(row);
//         })
//         .on("end", async () => {
//           // Process rows sequentially
//           for (const row of rows) {
//             try {
//               const finalNationalId = generateNationalId(row).trim();
//               const name = row.الاسم?.trim() || null;
//               const phone = row["الموبيل"]?.trim() || null;
//               const address = row["العنوان"]?.trim() || null;
//               const bloodType = mapBloodType(row.الدم);
//               const gender = mapGender(row.النوع);
//               const email = row["E-mail"]?.trim() || null;

//               // Skip empty rows
//               if (!name && !phone) {
//                 failedCount++;
//                 continue;
//               }

//               // Upsert donor
//               await donorRepository.upsert(finalNationalId, {
//                 name: name || "Unknown",
//                 phone: phone || "Unknown",
//                 address,
//                 bloodType,
//                 gender,
//                 email,
//               });

//               successCount++;
//             } catch (error) {
//               failedCount++;
//               // Continue processing other rows
//             }
//           }

//           resolve({ successCount, failedCount });
//         })
//         .on("error", (error) => {
//           reject(error);
//         });
//     });
//   },


  

// };














import { Readable } from "stream";
import csv from "csv-parser";
import prisma from "../config/prisma";
import { donorRepository } from "../repositories/donor.repository";
import { BloodType } from "@prisma/client";

// ============================================================================
// HELPERS
// ============================================================================

function normalizeRow(row: any) {
  const cleaned: any = {};

  for (const key of Object.keys(row)) {
    const cleanKey = key.replace(/^\uFEFF/, "").trim();
    const value = row[key];

    cleaned[cleanKey] =
      typeof value === "string" ? value.trim() : value;
  }

  return cleaned;
}

const isValidBloodType = (type: string): type is BloodType => {
  const validTypes: BloodType[] = [
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
    "O_POS",
    "O_NEG",
  ];

  return validTypes.includes(type as BloodType);
};

// ============================================================================
// IMPORT SERVICE
// ============================================================================

export const importService = {
  // ========================================================================
  // BLOOD BANK IMPORT
  // ========================================================================
  async importBloodBankDonors(rows: any[]) {
    const result = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = normalizeRow(rows[i]);

      try {
        if (!row.nationalId || !row.name || !row.phone || !row.campaignNumber) {
          result.skipped++;
          result.errors.push({
            row: rowNumber,
            reason: "Missing required fields",
          });
          continue;
        }

        const campaign = await prisma.campaign.findUnique({
          where: { campaignNumber: Number(row.campaignNumber) },
        });

        if (!campaign) {
          result.skipped++;
          result.errors.push({
            row: rowNumber,
            reason: "Campaign not found",
          });
          continue;
        }

        await prisma.$transaction(async (tx) => {
          const donor = await tx.donor.upsert({
            where: { nationalId: row.nationalId },
            update: {
              name: row.name,
              phone: row.phone,
              address: row.address || null,
              bloodType:
                row.bloodType && isValidBloodType(row.bloodType)
                  ? row.bloodType
                  : null,
              // gender: row.gender || null,
            },
            create: {
              nationalId: row.nationalId,
              name: row.name,
              phone: row.phone,
              address: row.address || null,
              bloodType:
                row.bloodType && isValidBloodType(row.bloodType)
                  ? row.bloodType
                  : null,
              // gender: row.gender || null,
            },
          });

          const exists = await tx.donorCampaign.findFirst({
            where: {
              donorId: donor.id,
              campaignId: campaign.id,
            },
          });

          if (!exists) {
            await tx.donorCampaign.create({
              data: {
                donorId: donor.id,
                campaignId: campaign.id,
                offlineSyncId: `csv-${row.nationalId}-${campaign.id}`,
              },
            });

            result.inserted++;
          } else {
            result.updated++;
          }
        });
      } catch (err: any) {
        result.skipped++;
        result.errors.push({
          row: rowNumber,
          reason: err.message || "Unknown error",
        });
      }
    }

    return result;
  },

  // ========================================================================
  // LEGACY IMPORT
  // ========================================================================
async importLegacyDonors(
  buffer: Buffer
): Promise<{ successCount: number; failedCount: number }> {
  return new Promise((resolve, reject) => {
    let successCount = 0;
    let failedCount = 0;
    const rows: any[] = [];

    console.log("🚀 START LEGACY IMPORT");

    // 🔥 STEP 1: Check raw file content
    const rawString = buffer.toString("utf-8");
    console.log("📄 RAW FIRST LINE:", rawString.split("\n")[0]);

    // 🔥 STEP 2: Remove BOM
    const csvString = rawString.replace(/^\uFEFF/, "");

    const stream = Readable.from(csvString);

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => {
            const cleaned = header.replace(/^\uFEFF/, "").trim();
            console.log("🧩 HEADER:", header, "=>", cleaned);
            return cleaned;
          },
        })
      )
      .on("data", (row) => {
        const normalizedRow = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k.trim(), v])
        );

        console.log("📦 ROW RECEIVED:", normalizedRow);

        rows.push(normalizedRow);
      })
      .on("end", async () => {
        console.log("✅ TOTAL ROWS:", rows.length);

        if (rows.length > 0) {
          console.log("🔍 SAMPLE ROW KEYS:", Object.keys(rows[0]));
          console.log("🔍 SAMPLE ROW:", rows[0]);
        }

        for (const row of rows) {
          try {
            const nationalId =
              row["National ID"] ||
              row["ID"] ||
              row["الموبيل"] ||
              `LEGACY-${Date.now()}`;

            const name = row["الاسم"];
            const phone = row["الموبيل"];

            console.log("⚙️ PROCESSING:", { nationalId, name, phone });

            if (!name && !phone) {
              console.log("⚠️ SKIPPED EMPTY ROW");
              continue;
            }

            await donorRepository.upsert(nationalId, {
              name: name || "Unknown",
              phone: phone || "Unknown",
              address: row["العنوان"] || null,
              bloodType: row["الدم"] || null,
              // gender: row["النوع"] || null,
              email: row["E-mail"] || null,
            });

            successCount++;
          } catch (err) {
            console.log("❌ ERROR ROW:", err);
            failedCount++;
          }
        }

        console.log("🎯 FINAL RESULT:", {
          successCount,
          failedCount,
        });

        resolve({ successCount, failedCount });
      })
      .on("error", (err) => {
        console.log("💥 STREAM ERROR:", err);
        reject(err);
      });
  });
},
};