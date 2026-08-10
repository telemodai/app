export type AuditDecisionItem = {
  _id?: string;
  chat_id: number;
  chat_name?: string | null;
  user_id: number;
  user_username?: string | null;
  user_first_name?: string | null;
  message_text: string;
  violation_detected: boolean;
  rule_violated?: string;
  rule_name?: string | null;
  ai_confidence: number;
  ai_reasoning: string;
  timestamp: string;
};
