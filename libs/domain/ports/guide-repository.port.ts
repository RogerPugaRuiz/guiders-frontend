import { GuideEntity } from '../entities/guide.entity';

export interface GuideRepository {
  getGuides(): Promise<GuideEntity[]>;
  getGuideById(id: string | number): Promise<GuideEntity>;
  saveGuide(guide: GuideEntity): Promise<GuideEntity>;
  deleteGuide(id: string | number): Promise<boolean>;
}