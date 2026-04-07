import { CampaignScoringConfigPage } from './TypeSpecificScoringConfig';

// Compatibility shim - re-exports TypeSpecificScoringConfig under old filename
export default function CampaignScoringConfig(props) {
  return <CampaignScoringConfigPage {...props} />;
}

export { CampaignScoringConfig, CampaignScoringConfigPage };
