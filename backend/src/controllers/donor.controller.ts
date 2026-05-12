import { Request, Response } from "express";
import { donorService } from "../services/donor.service";

export const donorController = {
 async getAll(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const bloodType = req.query.bloodType as string;
    const gender = req.query.gender as string;
    const includeStats = req.query.includeStats === 'true';
    const result = await donorService.getAllDonors(page, limit, search, bloodType, gender, includeStats);

    res.json({ success: true, data: result.data, meta: result.meta ,stats: result.stats});
  },

  async getById(req: Request, res: Response) {
    const donor = await donorService.getDonorById(req.params.id as string);
    res.json(donor);
  },

  async create(req: Request, res: Response) {
    const donor = await donorService.createDonor(req.body);
    res.status(201).json(donor);
  },

  async update(req: Request, res: Response) {
    const donor = await donorService.updateDonor(req.params.id as string, req.body);
    res.json(donor);
  },

  async remove(req: Request, res: Response) {
    await donorService.deleteDonor(req.params.id as string);
    res.status(204).send();
  },

  async search(req: Request, res: Response) {
    const query = req.query.q as string;
    const donors = await donorService.searchDonors(query);
    res.json({ success: true, data: donors });
  },
};
