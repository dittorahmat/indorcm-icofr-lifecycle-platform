import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, RCM, Control, CSARecord, TestRecord, Deficiency, ActionPlan } from "@shared/types";
import { MOCK_USERS, MOCK_CHATS, MOCK_CHAT_MESSAGES, MOCK_RCM, MOCK_CONTROLS, MOCK_DEFICIENCIES, MOCK_ACTION_PLANS } from "@shared/mock-data";
// --- ICOFR Entities ---
export class RCMEntity extends IndexedEntity<RCM> {
  static readonly entityName = "rcm";
  static readonly indexName = "rcms";
  static readonly initialState: RCM = { id: "", process: "", subProcess: "", riskDescription: "", controls: [] };
  static seedData = MOCK_RCM;
}
export class ControlEntity extends IndexedEntity<Control> {
  static readonly entityName = "control";
  static readonly indexName = "controls";
  static readonly initialState: Control = { id: "", rcmId: "", name: "", description: "", ownerId: "", type: "Preventive", nature: "Manual", assertions: [], materiality: "Low" };
  static seedData = MOCK_CONTROLS;
}
export class CSAEntity extends IndexedEntity<CSARecord> {
  static readonly entityName = "csa";
  static readonly indexName = "csas";
  static readonly initialState: CSARecord = { id: "", controlId: "", assessmentDate: 0, assessedBy: "", result: "N/A", comments: "" };
}
export class TestEntity extends IndexedEntity<TestRecord> {
  static readonly entityName = "test";
  static readonly indexName = "tests";
  static readonly initialState: TestRecord = { id: "", controlId: "", testType: "TOD", testDate: 0, testedBy: "", result: "Fail", comments: "" };
}
export class DeficiencyEntity extends IndexedEntity<Deficiency> {
  static readonly entityName = "deficiency";
  static readonly indexName = "deficiencies";
  static readonly initialState: Deficiency = { id: "", controlId: "", description: "", severity: "Control Deficiency", identifiedDate: 0, identifiedBy: "", status: "Open" };
  static seedData = MOCK_DEFICIENCIES;
}
export class ActionPlanEntity extends IndexedEntity<ActionPlan> {
  static readonly entityName = "actionplan";
  static readonly indexName = "actionplans";
  static readonly initialState: ActionPlan = { id: "", deficiencyId: "", description: "", ownerId: "", dueDate: 0, status: "Draft" };
  static seedData = MOCK_ACTION_PLANS;
}
// --- Original Demo Entities ---
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}