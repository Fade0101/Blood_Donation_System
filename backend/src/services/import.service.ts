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

function mapLegacyBloodType(raw: string | undefined): BloodType | null {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();

  if (trimmed === "" || trimmed === "-" || trimmed.includes("ـ")) {
    return null;
  }

  const normalized = trimmed.toUpperCase().replace(/\s+/g, "");

  switch (normalized) {
    case "A+": return "A_POS";
    case "A-": return "A_NEG";
    case "B+": return "B_POS";
    case "B-": return "B_NEG";
    case "AB+": return "AB_POS";
    case "AB-": return "AB_NEG";
    case "O+": return "O_POS";
    case "O-": return "O_NEG";
    default:
      if (isValidBloodType(normalized)) {
        return normalized as BloodType;
      }
      return null;
  }
}

function mapLegacyGender(raw: string | undefined): "MALE" | "FEMALE" | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  
  const trimmed = raw.trim();
  if (trimmed === "ذكر" || trimmed.toUpperCase() === "MALE") return "MALE";
  if (trimmed === "أنثى" || trimmed === "انثى" || trimmed.toUpperCase() === "FEMALE") return "FEMALE";
  
  return undefined;
}

function extractGenderFromRow(row: any): "MALE" | "FEMALE" | undefined {
  if (!row || typeof row !== "object") return undefined;

  // 1. Try known explicit headers first
  const knownHeaders = ["gender", "النوع", "الجنس", "Gender", "النوع "];
  for (const header of knownHeaders) {
    if (row[header]) {
      const mapped = mapLegacyGender(row[header]);
      if (mapped) return mapped;
    }
  }

  // 2. Smart Fallback: If headers are corrupted (e.g. "?????" due to encoding),
  // scan all values in the row for a strict gender match.
  for (const key of Object.keys(row)) {
    const mapped = mapLegacyGender(row[key]);
    if (mapped) return mapped;
  }

  return undefined;
}

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
              gender: extractGenderFromRow(row),
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
              gender: extractGenderFromRow(row),
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

      const rawString = buffer.toString("utf-8");
      const csvString = rawString.replace(/^\uFEFF/, "");
      const stream = Readable.from(csvString);

      stream
        .pipe(
          csv({
            mapHeaders: ({ header }) => {
              return header.replace(/^\uFEFF/, "").trim();
            },
          })
        )
        .on("data", (row) => {
          const normalizedRow = Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k.trim(), v])
          );
          rows.push(normalizedRow);
        })
        .on("end", async () => {
          console.log(`✅ TOTAL ROWS TO PROCESS: ${rows.length}`);

          for (const row of rows) {
            try {
const name = row["الاسم"] ? String(row["الاسم"]).trim().replace(/\s+/g, ' ') : null;
let phone = row["الموبيل"] ? String(row["الموبيل"]).trim() : null;

if (phone && phone.length === 10 && phone.startsWith("1")) {
  phone = "0" + phone;
}

if (!name && !phone) {
  continue;
}

let nationalId = row["National ID"] ? String(row["National ID"]).trim() : null;

if (!nationalId) {
  if (name) {
    const existingByName = await prisma.donor.findFirst({
      where: { name: name }
    });
    
    if (existingByName) {
      nationalId = existingByName.nationalId;
    }
  }

  if (!nationalId && phone) {
    const existingByPhone = await prisma.donor.findFirst({
      where: { phone: phone }
    });

    if (existingByPhone) {
      nationalId = existingByPhone.nationalId;
    }
  }
}

if (!nationalId) {
  const fallbackId = `LEGACY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  nationalId = phone || fallbackId;
}
await donorRepository.upsert(nationalId, {
  name: name || "Unknown",
  phone: phone || "Unknown",
  address: row["العنوان"] || null,
  bloodType: mapLegacyBloodType(row["الدم"]),
  gender: extractGenderFromRow(row),
  email: row["E-mail"] || null,
});

              successCount++;
            } catch (err) {
              console.error("❌ ERROR ROW:", err);
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
          console.error("💥 STREAM ERROR:", err);
          reject(err);
        });
    });
  },
};