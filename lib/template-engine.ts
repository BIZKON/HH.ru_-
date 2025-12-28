/**
 * Template Engine для замены переменных в шаблонах сообщений
 * Поддерживает переменные в формате {{variable_name}}
 */

export interface TemplateVariables {
  candidate_name?: string
  candidate_first_name?: string
  candidate_last_name?: string
  candidate_email?: string
  candidate_phone?: string
  candidate_position?: string
  vacancy_title?: string
  vacancy_location?: string
  company_name?: string
  recruiter_name?: string
  recruiter_email?: string
  current_date?: string
  interview_date?: string
  interview_time?: string
  interview_location?: string
  salary_range?: string
  [key: string]: string | undefined
}

/**
 * Заменяет переменные в тексте шаблона
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let result = template

  // Заменяем все переменные в формате {{variable_name}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
      result = result.replace(regex, value)
    }
  })

  // Удаляем незамененные переменные
  result = result.replace(/{{.*?}}/g, "")

  return result
}

/**
 * Извлекает список переменных из шаблона
 */
export function extractVariables(template: string): string[] {
  const regex = /{{\\s*([a-z_]+)\\s*}}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }

  return variables
}

/**
 * Валидация шаблона
 */
export function validateTemplate(template: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Проверка на незакрытые скобки
  const openBraces = (template.match(/{{/g) || []).length
  const closeBraces = (template.match(/}}/g) || []).length

  if (openBraces !== closeBraces) {
    errors.push("Неправильное количество скобок в шаблоне")
  }

  // Проверка на пустые переменные
  const emptyVars = template.match(/{{\s*}}/g)
  if (emptyVars) {
    errors.push("Найдены пустые переменные в шаблоне")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Получить переменные из данных кандидата и вакансии
 */
export function buildTemplateVariables(data: {
  candidate?: {
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    currentPosition?: string | null
  }
  vacancy?: {
    title?: string | null
    location?: string | null
  }
  recruiter?: {
    name?: string | null
    email?: string | null
  }
  custom?: Record<string, string>
}): TemplateVariables {
  const variables: TemplateVariables = {}

  // Candidate variables
  if (data.candidate) {
    variables.candidate_name = data.candidate.fullName || undefined
    variables.candidate_first_name = data.candidate.firstName || undefined
    variables.candidate_last_name = data.candidate.lastName || undefined
    variables.candidate_email = data.candidate.email || undefined
    variables.candidate_phone = data.candidate.phone || undefined
    variables.candidate_position = data.candidate.currentPosition || undefined
  }

  // Vacancy variables
  if (data.vacancy) {
    variables.vacancy_title = data.vacancy.title || undefined
    variables.vacancy_location = data.vacancy.location || undefined
  }

  // Recruiter variables
  if (data.recruiter) {
    variables.recruiter_name = data.recruiter.name || undefined
    variables.recruiter_email = data.recruiter.email || undefined
  }

  // Current date
  variables.current_date = new Date().toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Custom variables
  if (data.custom) {
    Object.assign(variables, data.custom)
  }

  return variables
}

/**
 * Предопределенные шаблоны
 */
export const DEFAULT_TEMPLATES = [
  {
    name: "Приглашение на интервью",
    category: "invitation",
    subject: "Приглашение на собеседование - {{vacancy_title}}",
    body: `Здравствуйте, {{candidate_name}}!

Благодарим вас за интерес к вакансии "{{vacancy_title}}".

Мы рады пригласить вас на собеседование.

Дата: {{interview_date}}
Время: {{interview_time}}
Место: {{interview_location}}

С уважением,
{{recruiter_name}}
{{recruiter_email}}`,
    variables: [
      "candidate_name",
      "vacancy_title",
      "interview_date",
      "interview_time",
      "interview_location",
      "recruiter_name",
      "recruiter_email",
    ],
  },
  {
    name: "Подтверждение получения резюме",
    category: "confirmation",
    subject: "Получено резюме на вакансию {{vacancy_title}}",
    body: `Здравствуйте, {{candidate_name}}!

Мы получили ваше резюме на вакансию "{{vacancy_title}}".

Ваша кандидатура находится на рассмотрении. Мы свяжемся с вами в ближайшее время.

С уважением,
{{recruiter_name}}`,
    variables: ["candidate_name", "vacancy_title", "recruiter_name"],
  },
  {
    name: "Отказ после рассмотрения",
    category: "rejection",
    subject: "Решение по вакансии {{vacancy_title}}",
    body: `Здравствуйте, {{candidate_name}}!

Благодарим вас за интерес к нашей компании и за время, уделенное процессу отбора.

К сожалению, после тщательного рассмотрения мы приняли решение продолжить поиск кандидата с другим профилем опыта для вакансии "{{vacancy_title}}".

Мы ценим ваш интерес и будем рады рассмотреть вашу кандидатуру на другие вакансии в будущем.

Желаем вам успехов в карьере!

С уважением,
{{recruiter_name}}`,
    variables: ["candidate_name", "vacancy_title", "recruiter_name"],
  },
  {
    name: "Оффер",
    category: "offer",
    subject: "Предложение о работе - {{vacancy_title}}",
    body: `Здравствуйте, {{candidate_name}}!

Рады сообщить, что по итогам собеседования мы готовы предложить вам позицию "{{vacancy_title}}"!

Условия:
- Локация: {{vacancy_location}}
- Зарплата: {{salary_range}}

Ждем вашего решения.

С уважением,
{{recruiter_name}}
{{recruiter_email}}`,
    variables: [
      "candidate_name",
      "vacancy_title",
      "vacancy_location",
      "salary_range",
      "recruiter_name",
      "recruiter_email",
    ],
  },
  {
    name: "Напоминание о собеседовании",
    category: "reminder",
    subject: "Напоминание о собеседовании завтра",
    body: `Здравствуйте, {{candidate_name}}!

Напоминаем о собеседовании на позицию "{{vacancy_title}}".

Завтра, {{interview_date}}, в {{interview_time}}
Место: {{interview_location}}

Пожалуйста, подтвердите ваше участие.

С уважением,
{{recruiter_name}}`,
    variables: [
      "candidate_name",
      "vacancy_title",
      "interview_date",
      "interview_time",
      "interview_location",
      "recruiter_name",
    ],
  },
]
