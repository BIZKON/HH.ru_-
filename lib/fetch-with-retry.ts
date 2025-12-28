/**
 * Утилита для выполнения fetch запросов с автоматическими повторными попытками
 * при ошибках сети и rate limiting (429)
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatuses?: number[]
}

export interface FetchWithRetryResult<T = any> {
  data: T | null
  error: Error | null
  attempts: number
  success: boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 секунда
  maxDelay: 30000, // 30 секунд
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Коды, при которых делаем retry
}

/**
 * Выполняет fetch с автоматическими повторными попытками
 * @param url - URL для запроса
 * @param options - Опции fetch
 * @param retryOptions - Опции повторных попыток
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions }
  let lastError: Error | null = null
  let delay = config.initialDelay

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Успешный ответ - возвращаем сразу
      if (response.ok) {
        return response
      }

      // Проверяем, нужно ли делать retry для этого статус-кода
      if (!config.retryableStatuses.includes(response.status)) {
        // Не retryable ошибка - возвращаем как есть
        return response
      }

      // Обработка 429 (Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After")
        if (retryAfter) {
          // Если есть заголовок Retry-After, используем его значение
          const retryDelay = Number.isNaN(Number(retryAfter))
            ? new Date(retryAfter).getTime() - Date.now()
            : Number(retryAfter) * 1000

          delay = Math.min(Math.max(retryDelay, config.initialDelay), config.maxDelay)
        }

        console.warn(`[Fetch Retry] Rate limited (429). Waiting ${delay}ms before retry ${attempt + 1}/${config.maxRetries}`)
      } else {
        console.warn(
          `[Fetch Retry] Request failed with status ${response.status}. Retry ${attempt + 1}/${config.maxRetries}`,
        )
      }

      // Если это последняя попытка, возвращаем ответ как есть
      if (attempt === config.maxRetries) {
        return response
      }

      // Ждем перед следующей попыткой
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Увеличиваем задержку для следующей попытки (exponential backoff)
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      console.warn(`[Fetch Retry] Network error on attempt ${attempt + 1}/${config.maxRetries + 1}:`, lastError.message)

      // Если это последняя попытка, выбрасываем ошибку
      if (attempt === config.maxRetries) {
        throw lastError
      }

      // Ждем перед следующей попыткой
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Увеличиваем задержку для следующей попытки
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
    }
  }

  // На всякий случай
  throw lastError || new Error("Max retries exceeded")
}

/**
 * Вспомогательная функция для fetch с автоматическим парсингом JSON
 */
export async function fetchJSONWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<FetchWithRetryResult<T>> {
  let attempts = 0

  try {
    const response = await fetchWithRetry(url, options, retryOptions)
    attempts = Number(response.headers.get("X-Retry-Attempts") || "1")

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: new Error(errorData.message || errorData.description || `HTTP ${response.status}`),
        attempts,
        success: false,
      }
    }

    const data = await response.json()
    return {
      data,
      error: null,
      attempts,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      attempts,
      success: false,
    }
  }
}
