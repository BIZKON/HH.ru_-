import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core"

// ==================== АВТОРИЗАЦИЯ ====================

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
}))

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("idx_sessions_user_id").on(table.userId),
  expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
}))

export const userApiTokens = sqliteTable("user_api_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  encryptedToken: text("encrypted_token").notNull(),
  provider: text("provider").notNull().default("hh.ru"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
}, (table) => ({
  userIdIdx: index("idx_user_api_tokens_user_id").on(table.userId),
  providerIdx: index("idx_user_api_tokens_provider").on(table.provider),
}))

// ==================== ОСНОВНЫЕ ТАБЛИЦЫ ====================

export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  externalId: text("external_id").notNull(),
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  middleName: text("middle_name"),
  email: text("email"),
  phone: text("phone"),
  currentPosition: text("current_position"),
  currentCompany: text("current_company"),
  location: text("location"),
  experienceYears: integer("experience_years"),
  skills: text("skills"), // JSON array as text
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"),
  summary: text("summary"),
  source: text("source").notNull().default("hh.ru"),
  companyId: text("company_id"),
  status: text("status").default("new"),
  paidAccess: integer("paid_access", { mode: "boolean" }).default(false),
  accessPaidAt: integer("access_paid_at", { mode: "timestamp" }),
  notes: text("notes"),
  tags: text("tags"), // JSON array as text
  rating: integer("rating"), // 1-5
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  externalIdIdx: index("idx_candidates_external_id").on(table.externalId),
  statusIdx: index("idx_candidates_status").on(table.status),
  emailIdx: index("idx_candidates_email").on(table.email),
  phoneIdx: index("idx_candidates_phone").on(table.phone),
  paidAccessIdx: index("idx_candidates_paid_access").on(table.paidAccess),
}))

export const vacancies = sqliteTable("vacancies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  externalId: text("external_id"),
  title: text("title").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  location: text("location"),
  employmentType: text("employment_type"),
  experienceLevel: text("experience_level"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  skills: text("skills"), // JSON array as text
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("hh.ru"),
  companyId: text("company_id"),
  createdBy: text("created_by"),
  responsesCount: integer("responses_count").default(0),
  invitationsCount: integer("invitations_count").default(0),
  viewsCount: integer("views_count").default(0),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  isPublished: integer("is_published", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  externalIdIdx: index("idx_vacancies_external_id").on(table.externalId),
  statusIdx: index("idx_vacancies_status").on(table.status),
  publishedIdx: index("idx_vacancies_published").on(table.isPublished),
  publishedAtIdx: index("idx_vacancies_published_at").on(table.publishedAt),
}))

export const searchSessions = sqliteTable("search_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "cascade" }),
  searchText: text("search_text").notNull(),
  searchArea: text("search_area"),
  searchExperience: text("search_experience"),
  searchEmployment: text("search_employment"),
  searchSchedule: text("search_schedule"),
  searchSalaryFrom: integer("search_salary_from"),
  searchOrderBy: text("search_order_by"),
  searchParams: text("search_params"), // JSON as text
  totalFound: integer("total_found").notNull().default(0),
  totalScored: integer("total_scored").notNull().default(0),
  avgScore: real("avg_score"),
  minScore: integer("min_score"),
  maxScore: integer("max_score"),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  vacancyIdIdx: index("idx_search_sessions_vacancy").on(table.vacancyId),
  createdAtIdx: index("idx_search_sessions_created").on(table.createdAt),
}))

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  searchSessionId: text("search_session_id").references(() => searchSessions.id, { onDelete: "set null" }),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("new"),
  score: integer("score").notNull(),
  scoreBreakdown: text("score_breakdown"), // JSON as text
  rating: text("rating"),
  notes: text("notes"),
  assignedTo: text("assigned_to"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  searchSessionIdIdx: index("idx_applications_search_session").on(table.searchSessionId),
  candidateIdIdx: index("idx_applications_candidate").on(table.candidateId),
  vacancyIdIdx: index("idx_applications_vacancy").on(table.vacancyId),
  scoreIdx: index("idx_applications_score_desc").on(table.score),
  uniqueSessionCandidate: uniqueIndex("unique_session_candidate").on(table.searchSessionId, table.candidateId),
}))

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: text("application_id").references(() => applications.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),
  message: text("message"),
  hhInvitationId: text("hh_invitation_id"),
  status: text("status").notNull().default("sent"),
  sentBy: text("sent_by"),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  responseText: text("response_text"),
}, (table) => ({
  applicationIdIdx: index("idx_invitations_application").on(table.applicationId),
  candidateIdIdx: index("idx_invitations_candidate").on(table.candidateId),
  statusIdx: index("idx_invitations_status").on(table.status),
}))

export const exports = sqliteTable("exports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  searchSessionId: text("search_session_id").references(() => searchSessions.id, { onDelete: "set null" }),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  candidatesCount: integer("candidates_count").notNull(),
  format: text("format").notNull().default("csv"),
  fileName: text("file_name"),
  appliedFilters: text("applied_filters"), // JSON as text
  scoreRangeMin: integer("score_range_min"),
  scoreRangeMax: integer("score_range_max"),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  searchSessionIdIdx: index("idx_exports_session").on(table.searchSessionId),
  createdAtIdx: index("idx_exports_created").on(table.createdAt),
}))

// ==================== CRM EXTENDED TABLES ====================

// Pipeline stages (Kanban board)
export const pipelineStages = sqliteTable("pipeline_stages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(), // sourcing, screening, contacted, interview_scheduled, interview_passed, offer, hired, rejected
  position: integer("position").notNull(), // порядок внутри колонки
  assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  movedAt: integer("moved_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  movedBy: text("moved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  vacancyIdIdx: index("idx_pipeline_vacancy").on(table.vacancyId),
  candidateIdIdx: index("idx_pipeline_candidate").on(table.candidateId),
  stageIdx: index("idx_pipeline_stage").on(table.stage),
  assignedToIdx: index("idx_pipeline_assigned").on(table.assignedTo),
}))

// Tasks for recruiters
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type"), // call, interview, send_test, feedback, offer, follow_up
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  dueDate: integer("due_date", { mode: "timestamp" }),
  assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  candidateId: text("candidate_id").references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  assignedToIdx: index("idx_tasks_assigned").on(table.assignedTo),
  dueDateIdx: index("idx_tasks_due").on(table.dueDate),
  candidateIdIdx: index("idx_tasks_candidate").on(table.candidateId),
  statusIdx: index("idx_tasks_status").on(table.status),
}))

// Task comments
export const taskComments = sqliteTable("task_comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  taskIdIdx: index("idx_task_comments_task").on(table.taskId),
}))

// Candidate notes
export const candidateNotes = sqliteTable("candidate_notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  note: text("note").notNull(),
  isImportant: integer("is_important", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  candidateIdIdx: index("idx_candidate_notes_candidate").on(table.candidateId),
  createdAtIdx: index("idx_candidate_notes_created").on(table.createdAt),
}))

// Candidate evaluations (after interviews)
export const candidateEvaluations = sqliteTable("candidate_evaluations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  evaluatorId: text("evaluator_id").references(() => users.id, { onDelete: "set null" }),
  interviewType: text("interview_type"), // screening, technical, hr, final
  technicalSkills: integer("technical_skills"), // 1-5
  softSkills: integer("soft_skills"), // 1-5
  culturalFit: integer("cultural_fit"), // 1-5
  overallRating: integer("overall_rating"), // 1-5
  notes: text("notes"),
  recommendation: text("recommendation"), // hire, maybe, reject
  evaluatedAt: integer("evaluated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  candidateIdIdx: index("idx_evaluations_candidate").on(table.candidateId),
  vacancyIdIdx: index("idx_evaluations_vacancy").on(table.vacancyId),
  evaluatorIdIdx: index("idx_evaluations_evaluator").on(table.evaluatorId),
}))

// Communication log (all channels)
export const communications = sqliteTable("communications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // hh, email, sms, call, whatsapp
  direction: text("direction").notNull(), // inbound, outbound
  subject: text("subject"),
  body: text("body"),
  status: text("status").notNull().default("sent"), // sent, delivered, read, failed
  sentBy: text("sent_by").references(() => users.id, { onDelete: "set null" }),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  readAt: integer("read_at", { mode: "timestamp" }),
  metadata: text("metadata"), // JSON with channel-specific data
}, (table) => ({
  candidateIdIdx: index("idx_communications_candidate").on(table.candidateId),
  channelIdx: index("idx_communications_channel").on(table.channel),
  sentAtIdx: index("idx_communications_sent").on(table.sentAt),
}))

// Message templates
export const messageTemplates = sqliteTable("message_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  category: text("category"), // invitation, rejection, interview_confirm, offer, follow_up
  subject: text("subject"),
  body: text("body").notNull(),
  variables: text("variables"), // JSON array of available variables
  channel: text("channel").notNull().default("email"), // email, sms, hh
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  categoryIdx: index("idx_templates_category").on(table.category),
  channelIdx: index("idx_templates_channel").on(table.channel),
}))

// Sync status tracking
export const syncStatus = sqliteTable("sync_status", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(), // negotiations, messages, vacancies
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  status: text("status").notNull(), // success, error, in_progress
  itemsSynced: integer("items_synced").notNull().default(0),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON with sync details
}, (table) => ({
  entityTypeIdx: index("idx_sync_status_entity").on(table.entityType),
  lastSyncedIdx: index("idx_sync_status_last_synced").on(table.lastSyncedAt),
}))

// Automation rules
export const automationRules = sqliteTable("automation_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // stage_entered, time_elapsed, score_threshold, status_changed
  triggerConditions: text("trigger_conditions"), // JSON
  actions: text("actions").notNull(), // JSON array of actions
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  triggerTypeIdx: index("idx_automation_trigger").on(table.triggerType),
  enabledIdx: index("idx_automation_enabled").on(table.enabled),
}))

// Automation execution log
export const automationExecutions = sqliteTable("automation_executions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ruleId: text("rule_id").notNull().references(() => automationRules.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").references(() => candidates.id, { onDelete: "set null" }),
  executedAt: integer("executed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  success: integer("success", { mode: "boolean" }).notNull(),
  result: text("result"),
  error: text("error"),
}, (table) => ({
  ruleIdIdx: index("idx_automation_exec_rule").on(table.ruleId),
  candidateIdIdx: index("idx_automation_exec_candidate").on(table.candidateId),
  executedAtIdx: index("idx_automation_exec_time").on(table.executedAt),
}))

// User roles and permissions
export const userRoles = sqliteTable("user_roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // admin, hr_manager, recruiter, viewer
  scope: text("scope"), // JSON: vacancy_ids array or 'all'
  grantedBy: text("granted_by").references(() => users.id, { onDelete: "set null" }),
  grantedAt: integer("granted_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("idx_user_roles_user").on(table.userId),
  roleIdx: index("idx_user_roles_role").on(table.role),
}))

// ==================== CRM ТАБЛИЦЫ ====================

export const negotiations = sqliteTable("negotiations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),
  applicationId: text("application_id").references(() => applications.id, { onDelete: "set null" }),
  hhNegotiationId: text("hh_negotiation_id").unique(),
  externalResumeId: text("external_resume_id"),
  externalVacancyId: text("external_vacancy_id"),
  state: text("state").notNull().default("new"),
  source: text("source").notNull().default("employer"),
  initialMessage: text("initial_message"),
  hasUpdates: integer("has_updates", { mode: "boolean" }).default(false),
  messagesCount: integer("messages_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  viewedAt: integer("viewed_at", { mode: "timestamp" }),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  topics: text("topics"), // JSON array as text
  actions: text("actions"), // JSON object as text
}, (table) => ({
  candidateIdIdx: index("idx_negotiations_candidate").on(table.candidateId),
  vacancyIdIdx: index("idx_negotiations_vacancy").on(table.vacancyId),
  stateIdx: index("idx_negotiations_state").on(table.state),
  hhIdIdx: index("idx_negotiations_hh_id").on(table.hhNegotiationId),
  createdAtIdx: index("idx_negotiations_created").on(table.createdAt),
  updatedAtIdx: index("idx_negotiations_updated").on(table.updatedAt),
}))

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  negotiationId: text("negotiation_id").notNull().references(() => negotiations.id, { onDelete: "cascade" }),
  hhMessageId: text("hh_message_id").unique(),
  author: text("author").notNull(), // 'employer' or 'applicant'
  text: text("text").notNull(),
  readByApplicant: integer("read_by_applicant", { mode: "boolean" }).default(false),
  readByEmployer: integer("read_by_employer", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  readAt: integer("read_at", { mode: "timestamp" }),
  attachments: text("attachments"), // JSON array as text
}, (table) => ({
  negotiationIdIdx: index("idx_messages_negotiation").on(table.negotiationId),
  createdAtIdx: index("idx_messages_created").on(table.createdAt),
  hhIdIdx: index("idx_messages_hh_id").on(table.hhMessageId),
}))

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "cascade" }),
  negotiationId: text("negotiation_id").references(() => negotiations.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON object as text
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  candidateIdIdx: index("idx_activities_candidate").on(table.candidateId),
  vacancyIdIdx: index("idx_activities_vacancy").on(table.vacancyId),
  negotiationIdIdx: index("idx_activities_negotiation").on(table.negotiationId),
  actionTypeIdx: index("idx_activities_type").on(table.actionType),
  createdAtIdx: index("idx_activities_created").on(table.createdAt),
}))

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  action: text("action").notNull(), // 'INSERT', 'UPDATE', 'DELETE'
  oldValue: text("old_value"), // JSON as text
  newValue: text("new_value"), // JSON as text
  changedFields: text("changed_fields"), // JSON array as text
  changedBy: text("changed_by"),
  changedAt: integer("changed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  tableNameIdx: index("idx_audit_table").on(table.tableName),
  recordIdIdx: index("idx_audit_record").on(table.recordId),
  changedAtIdx: index("idx_audit_changed_at").on(table.changedAt),
}))

// Типы для экспорта
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type UserApiToken = typeof userApiTokens.$inferSelect
export type NewUserApiToken = typeof userApiTokens.$inferInsert
export type Candidate = typeof candidates.$inferSelect
export type NewCandidate = typeof candidates.$inferInsert
export type Vacancy = typeof vacancies.$inferSelect
export type NewVacancy = typeof vacancies.$inferInsert
export type SearchSession = typeof searchSessions.$inferSelect
export type NewSearchSession = typeof searchSessions.$inferInsert
export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
export type Export = typeof exports.$inferSelect
export type NewExport = typeof exports.$inferInsert
export type Negotiation = typeof negotiations.$inferSelect
export type NewNegotiation = typeof negotiations.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert

// CRM Extended Types
export type PipelineStage = typeof pipelineStages.$inferSelect
export type NewPipelineStage = typeof pipelineStages.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type TaskComment = typeof taskComments.$inferSelect
export type NewTaskComment = typeof taskComments.$inferInsert
export type CandidateNote = typeof candidateNotes.$inferSelect
export type NewCandidateNote = typeof candidateNotes.$inferInsert
export type CandidateEvaluation = typeof candidateEvaluations.$inferSelect
export type NewCandidateEvaluation = typeof candidateEvaluations.$inferInsert
export type Communication = typeof communications.$inferSelect
export type NewCommunication = typeof communications.$inferInsert
export type MessageTemplate = typeof messageTemplates.$inferSelect
export type NewMessageTemplate = typeof messageTemplates.$inferInsert
export type SyncStatus = typeof syncStatus.$inferSelect
export type NewSyncStatus = typeof syncStatus.$inferInsert
export type AutomationRule = typeof automationRules.$inferSelect
export type NewAutomationRule = typeof automationRules.$inferInsert
export type AutomationExecution = typeof automationExecutions.$inferSelect
export type NewAutomationExecution = typeof automationExecutions.$inferInsert
export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert

