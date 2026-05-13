import { Request, Response } from "express";
import { campaignService } from "../services/campaign.service";

export const campaignController = {
  async getAll(_req: Request, res: Response) {
    const campaigns = await campaignService.getAllCampaigns();
    res.json(campaigns);
  },

  async getById(req: Request, res: Response) {
    const campaign = await campaignService.getCampaignById(req.params.id as string);
    res.json(campaign);
  },

  async create(req: Request, res: Response) {
    const campaign = await campaignService.createNewCampaign(req.body);
    res.status(201).json(campaign);
  },

  async update(req: Request, res: Response) {
    const campaign = await campaignService.updateCampaign(req.params.id as string, req.body);
    res.json(campaign);
  },

  async remove(req: Request, res: Response) {
    await campaignService.deleteCampaign(req.params.id as string);
    res.status(204).send();
  },

  async registerDonor(req: Request, res: Response) {
    const { campaignId } = req.params;
    const result = await campaignService.registerDonor(campaignId as string, req.body);
    res.status(201).json(result);
  },

  async removeDonor(req: Request, res: Response) {
    const { campaignId, nationalId } = req.params;
    const result = await campaignService.removeDonor(campaignId as string, nationalId as string);
    res.json(result);
  },

  async exportDonorsCsv(req: Request, res: Response) {
    const { campaignId } = req.params;
    const { bloodType } = req.query;

   const csvData = await campaignService.generateCampaignCsv(
      campaignId as string,
      bloodType as string | undefined
    );
   const buffer = Buffer.concat([
      Buffer.from('\uFEFF', 'utf-8'),
      Buffer.from(csvData, 'utf-8')
    ]);
    const bom = '\uFEFF';
    const campaign = await campaignService.getCampaignById(campaignId as string);
    const fileName = `campaign_${campaign.campaignNumber}_donors.csv`;
res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
res.setHeader("Content-Disposition", `attachment; filename="campaign_${campaign.campaignNumber}_donors.csv"`);
res.status(200).send(buffer);
  },
  async getDonorsforCampaign(req: Request, res: Response) {
    const { campaignId } = req.params;
    const { bloodType } = req.query;
    const donors = await campaignService.getCampaignDonors(campaignId as string, bloodType as string | undefined);
   res.json({
  success: true,
  count: donors.length,
  data: donors
});
  },
};