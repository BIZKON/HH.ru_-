/**
 * HH.ru Sync Engine
 *
 * Автоматическая синхронизация данных с HH.ru API:
 * - Отклики на вакансии (negotiations)
 * - Сообщения в переписках (messages)
 * - Обновления статусов
 */

import { db } from "@/lib/db"
import {
  negotiations,
  messages,
  candidates,
  vacancies,
  syncStatus,
  activities,
  type NewNegotiation,
  type NewMessage,
  type NewCandidate,
  type NewActivity,
} from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getNegotiations, getNegotiationMessages } from "@/lib/hh-api"

export interface SyncResult {
  success: boolean
  itemsSynced: number
  errors: string[]
  syncedAt: Date
}

export interface SyncOptions {
  vacancyId?: string
  force?: boolean // force full sync even if recently synced
  token: string
}

export class HHSyncEngine {
  private static instance: HHSyncEngine
  private syncInProgress = new Set<string>()

  private constructor() {}

  static getInstance(): HHSyncEngine {
    if (!HHSyncEngine.instance) {
      HHSyncEngine.instance = new HHSyncEngine()
    }
    return HHSyncEngine.instance
  }

  /**
   * Синхронизация переговоров (negotiations) с HH.ru
   */
  async syncNegotiations(options: SyncOptions): Promise<SyncResult> {
    const syncKey = `negotiations:${options.vacancyId || "all"}`

    if (this.syncInProgress.has(syncKey)) {
      console.log(`[Sync] Sync already in progress for ${syncKey}`)
      return {
        success: false,
        itemsSynced: 0,
        errors: ["Sync already in progress"],
        syncedAt: new Date(),
      }
    }

    this.syncInProgress.add(syncKey)

    try {
      console.log(`[Sync] Starting negotiations sync for ${syncKey}`)

      // Обновляем статус синхронизации
      await this.updateSyncStatus("negotiations", "in_progress", 0)

      const errors: string[] = []
      let totalSynced = 0

      // Получаем negotiations из HH.ru API
      const hhNegotiations = await getNegotiations(options.token, {
        vacancy_id: options.vacancyId,
      })

      console.log(`[Sync] Received ${hhNegotiations.items.length} negotiations from HH.ru`)

      // Обрабатываем каждый negotiation
      for (const hhNeg of hhNegotiations.items) {
        try {
          // Проверяем, существует ли уже этот negotiation
          const existing = await db
            .select()
            .from(negotiations)
            .where(eq(negotiations.hhNegotiationId, hhNeg.id))
            .limit(1)

          if (existing.length > 0) {
            // Обновляем существующий
            await db
              .update(negotiations)
              .set({
                state: hhNeg.state.id,
                hasUpdates: hhNeg.has_updates,
                messagesCount: hhNeg.messages_url ? 1 : 0,
                updatedAt: new Date(),
                viewedAt: hhNeg.viewed_by_opponent ? new Date(hhNeg.viewed_by_opponent) : null,
              })
              .where(eq(negotiations.id, existing[0].id))

            console.log(`[Sync] Updated negotiation ${hhNeg.id}`)
          } else {
            // Создаем нового candidate если его нет
            const candidateId = await this.ensureCandidate(
              {
                external_id: hhNeg.resume?.id || hhNeg.id,
                full_name: hhNeg.resume?.first_name
                  ? `${hhNeg.resume.last_name || ""} ${hhNeg.resume.first_name} ${hhNeg.resume.middle_name || ""}`.trim()
                  : "Кандидат",
                email: this.extractEmail(hhNeg.resume?.contact),
                phone: this.extractPhone(hhNeg.resume?.contact),
                current_position: hhNeg.resume?.title,
                resume_url: hhNeg.resume?.alternate_url,
                source: "hh.ru",
                status: "new",
              },
              options.token,
            )

            // Создаем vacancy если его нет
            const vacancyId = await this.ensureVacancy({
              external_id: hhNeg.vacancy?.id || options.vacancyId,
              title: hhNeg.vacancy?.name || "Вакансия",
              source: "hh.ru",
              status: "active",
            })

            // Создаем новый negotiation
            const [newNeg] = await db
              .insert(negotiations)
              .values({
                hhNegotiationId: hhNeg.id,
                candidateId,
                vacancyId,
                externalResumeId: hhNeg.resume?.id,
                externalVacancyId: hhNeg.vacancy?.id,
                state: hhNeg.state.id,
                source: hhNeg.source || "employer",
                hasUpdates: hhNeg.has_updates,
                messagesCount: 0,
                viewedAt: hhNeg.viewed_by_opponent ? new Date(hhNeg.viewed_by_opponent) : null,
              })
              .returning()

            // Логируем активность
            await db.insert(activities).values({
              candidateId,
              vacancyId,
              negotiationId: newNeg.id,
              actionType: hhNeg.source === "employer" ? "invitation_sent" : "response_received",
              title: hhNeg.source === "employer" ? "Отправлено приглашение" : "Получен отклик",
              metadata: JSON.stringify({
                hh_negotiation_id: hhNeg.id,
                state: hhNeg.state.id,
              }),
            })

            console.log(`[Sync] Created new negotiation ${hhNeg.id}`)
            totalSynced++
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error(`[Sync] Error syncing negotiation ${hhNeg.id}:`, errorMsg)
          errors.push(`Negotiation ${hhNeg.id}: ${errorMsg}`)
        }
      }

      // Обновляем статус синхронизации
      await this.updateSyncStatus("negotiations", "success", totalSynced)

      console.log(`[Sync] Completed negotiations sync. Synced: ${totalSynced}, Errors: ${errors.length}`)

      return {
        success: errors.length === 0,
        itemsSynced: totalSynced,
        errors,
        syncedAt: new Date(),
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("[Sync] Fatal error during negotiations sync:", errorMsg)

      await this.updateSyncStatus("negotiations", "error", 0, errorMsg)

      return {
        success: false,
        itemsSynced: 0,
        errors: [errorMsg],
        syncedAt: new Date(),
      }
    } finally {
      this.syncInProgress.delete(syncKey)
    }
  }

  /**
   * Синхронизация сообщений в переговорах
   */
  async syncMessages(options: SyncOptions & { negotiationId?: string }): Promise<SyncResult> {
    const syncKey = `messages:${options.negotiationId || "all"}`

    if (this.syncInProgress.has(syncKey)) {
      return {
        success: false,
        itemsSynced: 0,
        errors: ["Sync already in progress"],
        syncedAt: new Date(),
      }
    }

    this.syncInProgress.add(syncKey)

    try {
      console.log(`[Sync] Starting messages sync for ${syncKey}`)

      await this.updateSyncStatus("messages", "in_progress", 0)

      const errors: string[] = []
      let totalSynced = 0

      // Получаем active negotiations из БД
      const activeNegotiations = await db
        .select()
        .from(negotiations)
        .where(options.negotiationId ? eq(negotiations.id, options.negotiationId) : eq(negotiations.hasUpdates, true))
        .limit(50) // ограничиваем чтобы не перегружать API

      console.log(`[Sync] Found ${activeNegotiations.length} active negotiations`)

      for (const neg of activeNegotiations) {
        if (!neg.hhNegotiationId) continue

        try {
          // Получаем сообщения из HH.ru API
          const hhMessages = await getNegotiationMessages(options.token, neg.hhNegotiationId)

          console.log(`[Sync] Received ${hhMessages.items.length} messages for negotiation ${neg.hhNegotiationId}`)

          for (const hhMsg of hhMessages.items) {
            // Проверяем, существует ли уже это сообщение
            const existing = await db
              .select()
              .from(messages)
              .where(eq(messages.hhMessageId, hhMsg.id))
              .limit(1)

            if (existing.length === 0) {
              // Создаем новое сообщение
              await db.insert(messages).values({
                negotiationId: neg.id,
                hhMessageId: hhMsg.id,
                author: hhMsg.author.participant_type,
                text: hhMsg.text,
                readByApplicant: hhMsg.read_by_applicant || false,
                readByEmployer: hhMsg.read_by_employer || false,
                createdAt: new Date(hhMsg.created_at),
                sentAt: new Date(hhMsg.created_at),
              })

              totalSynced++
              console.log(`[Sync] Created new message ${hhMsg.id}`)
            }
          }

          // Обновляем hasUpdates флаг
          await db
            .update(negotiations)
            .set({
              hasUpdates: false,
              messagesCount: hhMessages.items.length,
              updatedAt: new Date(),
            })
            .where(eq(negotiations.id, neg.id))
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error(`[Sync] Error syncing messages for negotiation ${neg.hhNegotiationId}:`, errorMsg)
          errors.push(`Negotiation ${neg.hhNegotiationId}: ${errorMsg}`)
        }
      }

      await this.updateSyncStatus("messages", "success", totalSynced)

      console.log(`[Sync] Completed messages sync. Synced: ${totalSynced}, Errors: ${errors.length}`)

      return {
        success: errors.length === 0,
        itemsSynced: totalSynced,
        errors,
        syncedAt: new Date(),
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("[Sync] Fatal error during messages sync:", errorMsg)

      await this.updateSyncStatus("messages", "error", 0, errorMsg)

      return {
        success: false,
        itemsSynced: 0,
        errors: [errorMsg],
        syncedAt: new Date(),
      }
    } finally {
      this.syncInProgress.delete(syncKey)
    }
  }

  /**
   * Полная синхронизация (negotiations + messages)
   */
  async fullSync(options: SyncOptions): Promise<{
    negotiations: SyncResult
    messages: SyncResult
  }> {
    console.log("[Sync] Starting full sync")

    const negotiationsResult = await this.syncNegotiations(options)
    const messagesResult = await this.syncMessages(options)

    console.log("[Sync] Full sync completed")

    return {
      negotiations: negotiationsResult,
      messages: messagesResult,
    }
  }

  /**
   * Получить статус последней синхронизации
   */
  async getSyncStatus(entityType: string): Promise<{
    lastSyncedAt: Date | null
    status: string
    itemsSynced: number
    errorMessage: string | null
  } | null> {
    const [status] = await db
      .select()
      .from(syncStatus)
      .where(eq(syncStatus.entityType, entityType))
      .orderBy(desc(syncStatus.lastSyncedAt))
      .limit(1)

    if (!status) return null

    return {
      lastSyncedAt: status.lastSyncedAt,
      status: status.status,
      itemsSynced: status.itemsSynced,
      errorMessage: status.errorMessage,
    }
  }

  // ========== PRIVATE HELPERS ==========

  private async updateSyncStatus(
    entityType: string,
    status: string,
    itemsSynced: number,
    errorMessage?: string,
  ): Promise<void> {
    await db.insert(syncStatus).values({
      entityType,
      status,
      itemsSynced,
      errorMessage: errorMessage || null,
      lastSyncedAt: new Date(),
    })
  }

  private async ensureCandidate(candidateData: NewCandidate, token: string): Promise<string> {
    // Проверяем, существует ли кандидат
    const [existing] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.externalId, candidateData.external_id))
      .limit(1)

    if (existing) {
      return existing.id
    }

    // Создаем нового кандидата
    const [newCandidate] = await db.insert(candidates).values(candidateData).returning()

    return newCandidate.id
  }

  private async ensureVacancy(vacancyData: {
    external_id?: string
    title: string
    source: string
    status: string
  }): Promise<string> {
    if (!vacancyData.external_id) {
      // Создаем без external_id
      const [newVacancy] = await db
        .insert(vacancies)
        .values({
          title: vacancyData.title,
          source: vacancyData.source,
          status: vacancyData.status,
        })
        .returning()

      return newVacancy.id
    }

    // Проверяем, существует ли вакансия
    const [existing] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.externalId, vacancyData.external_id))
      .limit(1)

    if (existing) {
      return existing.id
    }

    // Создаем новую вакансию
    const [newVacancy] = await db
      .insert(vacancies)
      .values({
        externalId: vacancyData.external_id,
        title: vacancyData.title,
        source: vacancyData.source,
        status: vacancyData.status,
      })
      .returning()

    return newVacancy.id
  }

  private extractEmail(contacts: any[]): string | undefined {
    if (!contacts) return undefined
    const emailContact = contacts.find((c) => c.type?.id === "email")
    return emailContact?.value
  }

  private extractPhone(contacts: any[]): string | undefined {
    if (!contacts) return undefined
    const phoneContact = contacts.find((c) => c.type?.id === "cell" || c.type?.id === "phone")
    if (phoneContact?.value && typeof phoneContact.value === "object") {
      const phone = phoneContact.value
      return `+${phone.country}${phone.city}${phone.number}`
    }
    return phoneContact?.value
  }
}

// Singleton instance
export const syncEngine = HHSyncEngine.getInstance()
