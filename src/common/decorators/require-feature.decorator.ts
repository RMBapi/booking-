import { SetMetadata } from '@nestjs/common';
import { FeatureCode } from '../constants/permissions';

export const FEATURE_KEY = 'features';
export const RequireFeature = (...features: FeatureCode[]) =>
  SetMetadata(FEATURE_KEY, features);
