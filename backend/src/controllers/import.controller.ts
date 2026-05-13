// import { Request, Response, NextFunction } from "express";
// import { importService } from "../services/import.service";
// import { AppError } from "../middlewares/errorHandler";
// import * as csvParse from "csv-parse/sync";

// export const importController = {
//   // Blood Bank Import
//   async importBloodBank(req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) {
//     try {
//       if (!req.file) {
//       }

//       if (!req.file.mimetype.includes("csv") && !req.file.originalname.endsWith(".csv")) {
//       }

//       // Parse CSV with relaxed column validation
//       const csvContent = req.file.buffer.toString("utf-8");
//       const records = csvParse.parse(csvContent, {
//         columns: true,
//         skip_empty_lines: true,
//         trim: true,
//         relax_column_count: true, // Allow variable column count
//       });

//       if (records.length === 0) {
//       }

//       // Import donors
//       const result = await importService.importBloodBankDonors(records);

//       res.status(200).json({
//         success: true,
//         data: result,
//         error: null,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },

//   // Legacy Import
//   async importLegacy(req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) {
//     try {
//       if (!req.file) {
//         throw new AppError(400, "No file uploaded");
//       }

//       const { successCount, failedCount } = await importService.importLegacyDonors(
//         req.file.buffer
//       );

//       res.json({
//         success: true,
//         successCount,
//         failedCount,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// };

import { Request, Response, NextFunction } from "express";
import { importService } from "../services/import.service";
import { AppError } from "../middlewares/errorHandler";
import * as csvParse from "csv-parse/sync";

export const importController = {
  async importBloodBank(req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError(400, "لم يتم تحميل ملف CSV");

      const csvContent = req.file.buffer.toString("utf-8").replace(/^\uFEFF/, "");

      const records = csvParse.parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });

      if (!records.length) throw new AppError(400, "ملف CSV فارغ");

      const result = await importService.importBloodBankDonors(records);

      res.status(200).json({
        success: true,
        message: "تم الاستيراد بنجاح",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async importLegacy(req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError(400, "No file uploaded");

      const result = await importService.importLegacyDonors(req.file.buffer);

      res.status(200).json({
        success: true,
        message: "Legacy import completed",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};