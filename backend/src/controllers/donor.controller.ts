import { Request, Response } from "express";
import { donorService } from "../services/donor.service";

export const donorController = {
  async getAll(_req: Request, res: Response) {
    const donors = await donorService.getAllDonors();
    res.json(donors);
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
};
