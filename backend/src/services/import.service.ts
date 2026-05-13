import { Readable } from "stream";
import csv from "csv-parser";
import prisma from "../config/prisma";
import { BloodType } from "@prisma/client";

// ============================================================================
// HELPERS
// ============================================================================

function normalizeKeyForMatch(key: string) {
  if (!key) return "";
  return key.replace(/[\s\u200B-\uFEFF_.-]/g, "").toLowerCase();
}

function normalizeRow(row: any) {
  const cleaned: any = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.replace(/^\uFEFF/, "").trim();
    const value = row[key];
    cleaned[cleanKey] = typeof value === "string" ? value.trim() : value;
  }
  return cleaned;
}

const isValidBloodType = (type: string): type is BloodType => {
  const validTypes: BloodType[] = [
    "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG",
  ];
  return validTypes.includes(type as BloodType);
};

function mapLegacyBloodType(raw: string | undefined): BloodType | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-" || trimmed.includes("ـ")) return null;
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
      if (isValidBloodType(normalized)) return normalized as BloodType;
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
  const knownHeaders = ["gender", "النوع", "الجنس", "Gender", "النوع "];
  for (const header of knownHeaders) {
    if (row[header]) {
      const mapped = mapLegacyGender(row[header]);
      if (mapped) return mapped;
    }
  }
  for (const key of Object.keys(row)) {
    const mapped = mapLegacyGender(row[key]);
    if (mapped) return mapped;
  }
  return undefined;
}

function cleanNumber(val: any) {
  if (!val) return null;

  let str = String(val).replace(/[\s\u200B-\uFEFF\-_]/g, '');

  if (str.toLowerCase().includes('e')) {
    const num = Number(str);
    if (!isNaN(num)) {
      str = num.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 });
    }
  }

  if (str.includes('.')) {
    str = str.split('.')[0];
  }

  if (str.length === 10 && str.startsWith('1')) {
    str = '0' + str;
  }

  if (str === "") return null;
  return str;
}

function parseDate(raw: any): Date | null {
  if (!raw) return null;
  const str = String(raw).trim();

  if (str.includes("#")) return null;

  const parts = str.match(/\d+/g);
  if (!parts || parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  let year = parseInt(parts[2], 10);

  if (year < 100) year += (year > 30 ? 1900 : 2000);

  const parsedDate = new Date(Date.UTC(year, month, day));
  if (isNaN(parsedDate.getTime())) return null;

  return parsedDate;
}

// ============================================================================
// IMPORT SERVICE
// ============================================================================

export const importService = {
  // ========================================================================
  // BLOOD BANK IMPORT
  // ========================================================================
  async importBloodBankDonors(rows: any[]) {
    const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as any[] };

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = normalizeRow(rows[i]);

      let phone = cleanNumber(row.phone);
      let nationalId = cleanNumber(row.nationalId);
      let name = row.name ? String(row.name).replace(/\s+/g, ' ').trim() : null;

      try {
        if ((!nationalId && !phone && !name) || !row.campaignNumber) {
          result.skipped++;
          continue;
        }

        const campaign = await prisma.campaign.findUnique({
          where: { campaignNumber: Number(row.campaignNumber) },
        });

        if (!campaign) {
          result.skipped++;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          let existingDonor = null;

          if (nationalId) existingDonor = await tx.donor.findFirst({ where: { nationalId: nationalId } });
          if (!existingDonor && phone) existingDonor = await tx.donor.findFirst({ where: { phone: phone } });
          if (!existingDonor && name) existingDonor = await tx.donor.findFirst({ where: { name: name } });

          const validBloodType = mapLegacyBloodType(row.bloodType) || (row.bloodType && isValidBloodType(row.bloodType) ? row.bloodType : null);
          const validGender = mapLegacyGender(row.gender) || (row.gender === "MALE" || row.gender === "FEMALE" ? row.gender : null);
          const validDob = parseDate(row.dateOfBirth || row["تاريخ الميلاد"]);

          let donor;
          if (existingDonor) {
            donor = await tx.donor.update({
              where: { id: existingDonor.id },
              data: {
                bloodType: (!existingDonor.bloodType && validBloodType) ? validBloodType : existingDonor.bloodType,
                gender: (!existingDonor.gender && validGender) ? validGender : existingDonor.gender,
                dateOfBirth: (!existingDonor.dateOfBirth && validDob) ? validDob : existingDonor.dateOfBirth,
              },
            });
          } else {
            const fallbackId = `LEGACY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            donor = await tx.donor.create({
              data: {
                nationalId: nationalId || phone || fallbackId,
                name: name || "Unknown",
                phone: phone || "Unknown",
                address: row.address || null,
                bloodType: validBloodType,
                gender: validGender,
                dateOfBirth: validDob,
              },
            });
          }

          const exists = await tx.donorCampaign.findFirst({
            where: { donorId: donor.id, campaignId: campaign.id },
          });

          if (!exists) {
            await tx.donorCampaign.create({
              data: {
                donorId: donor.id,
                campaignId: campaign.id,
                offlineSyncId: `csv-${donor.id}-${campaign.id}`,
              },
            });
            result.inserted++;
          } else {
            result.updated++;
          }
        });
      } catch (err: any) {
        result.skipped++;
        result.errors.push({ row: rowNumber, reason: err.message });
      }
    }
    return result;
  },

  // ========================================================================
  // LEGACY IMPORT 
  // ========================================================================
  async importLegacyDonors(buffer: Buffer): Promise<{ successCount: number; failedCount: number }> {
    return new Promise((resolve, reject) => {
      let successCount = 0;
      let failedCount = 0;
      const rows: any[] = [];

      console.log("🚀 START LEGACY IMPORT");

      const rawString = buffer.toString("utf-8");
      const csvString = rawString.replace(/^\uFEFF/, "");
      const stream = Readable.from(csvString);

      stream
        .pipe(csv({ mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim() }))
        .on("data", (row) => {
          const normalizedRow = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.trim(), v]));
          rows.push(normalizedRow);
        })
        .on("end", async () => {
          console.log(`✅ TOTAL ROWS TO PROCESS: ${rows.length}`);

          for (const row of rows) {
            try {
              const getValKey = (keys: string[]) => {
                const normalizedExpected = keys.map(normalizeKeyForMatch);
                return Object.keys(row).find(k => {
                  const normK = normalizeKeyForMatch(k);
                  return normalizedExpected.some(expected => normK.includes(expected));
                });
              };

              const nameKey = getValKey(["الاسم", "name", "اسم"]);
              const phoneKey = getValKey(["الموبيل", "موبيل", "موبايل", "الهاتف", "هاتف", "تليفون", "phone", "mobile", "رقم"]);
              const addressKey = getValKey(["العنوان", "عنوان", "address"]);
              const bloodKey = getValKey(["الدم", "blood", "الفصيلة", "فصيلة", "فصيل"]);
              const emailKey = getValKey(["E-mail", "email", "البريد", "بريد", "mail"]);
              const idKey = getValKey(["ID", "National ID", "الرقم القومي", "الرقم القومى", "الرقم", "قومي", "قومى", "national"]);
              const dobKey = getValKey(["تاريخ", "الميلاد", "birth", "dob", "ميلاد"]);
              const genderKey = getValKey(["gender", "النوع", "الجنس", "نوع", "جنس"]);

              const name = nameKey && row[nameKey] ? String(row[nameKey]).trim().replace(/\s+/g, ' ') : null;
              const phone = phoneKey ? cleanNumber(row[phoneKey]) : null;
              let nationalId = idKey ? cleanNumber(row[idKey]) : null;

              if (!name && !phone && !nationalId) continue;

              const newBloodType = bloodKey ? mapLegacyBloodType(row[bloodKey]) : null;
              const newGender = genderKey ? mapLegacyGender(row[genderKey]) : extractGenderFromRow(row);
              const newDob = dobKey ? parseDate(row[dobKey]) : null;

              let existingDonor = null;
              if (nationalId) existingDonor = await prisma.donor.findFirst({ where: { nationalId } });
              if (!existingDonor && phone) existingDonor = await prisma.donor.findFirst({ where: { phone } });
              if (!existingDonor && name) existingDonor = await prisma.donor.findFirst({ where: { name } });

              if (existingDonor) {
                const updates: any = {};
                if (!existingDonor.bloodType && newBloodType) updates.bloodType = newBloodType;
                if (!existingDonor.gender && newGender) updates.gender = newGender;
                if (!existingDonor.dateOfBirth && newDob) updates.dateOfBirth = newDob;
                if (existingDonor.phone === "Unknown" && phone) updates.phone = phone;
                if (existingDonor.name === "Unknown" && name) updates.name = name;

                if (Object.keys(updates).length > 0) {
                  await prisma.donor.update({
                    where: { id: existingDonor.id },
                    data: updates
                  });
                }
                successCount++;
              } else {
                const fallbackId = `LEGACY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                await prisma.donor.create({
                  data: {
                    nationalId: nationalId || phone || fallbackId,
                    name: name || "Unknown",
                    phone: phone || "Unknown",
                    address: addressKey && row[addressKey] ? String(row[addressKey]).trim() : null,
                    bloodType: newBloodType,
                    gender: newGender,
                    dateOfBirth: newDob,
                  }
                });
                successCount++;
              }
            } catch (err) {
              console.error("❌ ERROR ROW:", err);
              failedCount++;
            }
          }

          console.log("🎯 FINAL RESULT:", { successCount, failedCount });
          resolve({ successCount, failedCount });
        })
        .on("error", (err) => {
          console.error("💥 STREAM ERROR:", err);
          reject(err);
        });
    });
  },
};
