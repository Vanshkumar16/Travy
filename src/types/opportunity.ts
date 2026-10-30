export type OpportunityKind = "hackathon" | "competition";
export type OpportunityStatus = "upcoming" | "open" | "ended";

export interface Opportunity {
  id: string;
  kind: OpportunityKind;
  title: string;
  organizer: string;
  description: string;
  starts_on: string;
  ends_on: string;
  format: string;
  prize?: string | null;
  tags: string[];
  provider: string;
  source_url: string;
  status: OpportunityStatus;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  count: number;
  automatic_sync_enabled: boolean;
  sync: {
    provider: string;
    enabled: boolean;
    interval_hours: number;
    last_attempt_at: string | null;
    last_success_at: string | null;
    last_error: string | null;
  };
}
