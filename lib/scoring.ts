// Система оценки кандидатов по 100-балльной шкале

export interface ScoringConfig {
  experience: {
    weight: number
    requiredLevel: string
  }
  skills: {
    weight: number
    required: string[]
    bonus: string[]
  }
  salary: {
    weight: number
    optimal: { min: number; max: number }
  }
  education: {
    weight: number
  }
  jobSearchStatus: {
    weight: number
  }
  bonus: {
    weight: number
  }
}

export interface ScoreBreakdown {
  experience: number
  skills: number
  salary: number
  education: number
  jobSearchStatus: number
  bonus: number
}

export interface CandidateScore {
  score: number
  breakdown: ScoreBreakdown
  rating: string
  stars: number
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  experience: {
    weight: 30,
    requiredLevel: "between1And3",
  },
  skills: {
    weight: 25,
    required: ["CRM", "B2B", "продажи", "переговоры"],
    bonus: ["партнерство", "реферральные", "активные продажи"],
  },
  salary: {
    weight: 15,
    optimal: { min: 90000, max: 150000 },
  },
  education: {
    weight: 10,
  },
  jobSearchStatus: {
    weight: 10,
  },
  bonus: {
    weight: 10,
  },
}

interface ResumeForScoring {
  experience?: Array<{
    start: string
    end: string | null
    company: string
    position: string
    description?: string | null
  }>
  skill_set?: string[]
  salary?: {
    from?: number | null
    to?: number | null
    amount?: number | null
  } | null
  education?: {
    primary?: Array<{
      name: string
      organization?: string
    }>
  } | null
  about?: string
}

export function scoreCandidate(
  resume: ResumeForScoring,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): CandidateScore {
  const breakdown: ScoreBreakdown = {
    experience: 0,
    skills: 0,
    salary: 0,
    education: 0,
    jobSearchStatus: 0,
    bonus: 0,
  }

  // 1. Оценка опыта (до 30 баллов)
  breakdown.experience = scoreExperience(resume, config.experience.requiredLevel)

  // 2. Оценка навыков (до 25 баллов)
  breakdown.skills = scoreSkills(resume, config.skills.required, config.skills.bonus)

  // 3. Оценка зарплаты (до 15 баллов)
  breakdown.salary = scoreSalary(resume, config.salary.optimal)

  // 4. Оценка образования (до 10 баллов)
  breakdown.education = scoreEducation(resume)

  // 5. Статус поиска (10 баллов - все найденные активно ищут)
  breakdown.jobSearchStatus = 10

  // 6. Бонусы (до 10 баллов)
  breakdown.bonus = calculateBonus(resume)

  const total = Math.min(
    100,
    breakdown.experience +
      breakdown.skills +
      breakdown.salary +
      breakdown.education +
      breakdown.jobSearchStatus +
      breakdown.bonus,
  )

  const score = Math.round(total)

  return {
    score,
    breakdown,
    rating: getRating(score),
    stars: getStars(score),
  }
}

function calculateTotalExperience(experience: Array<{ start: string; end: string | null }>): number {
  return experience.reduce((total, exp) => {
    const start = new Date(exp.start)
    const end = exp.end ? new Date(exp.end) : new Date()
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    return total + Math.max(0, months)
  }, 0)
}

function scoreExperience(resume: ResumeForScoring, requiredLevel: string): number {
  if (!resume.experience || resume.experience.length === 0) {
    return 5
  }

  const totalMonths = calculateTotalExperience(resume.experience)
  const years = Math.floor(totalMonths / 12)

  if (requiredLevel === "between1And3") {
    if (years >= 1 && years <= 3) return 30
    if (years === 0) return 15
    if (years > 3 && years <= 6) return 25
    if (years > 6) return 20
  } else if (requiredLevel === "between3And6") {
    if (years >= 3 && years <= 6) return 30
    if (years >= 1 && years < 3) return 20
    if (years > 6) return 25
    return 10
  } else if (requiredLevel === "moreThan6") {
    if (years >= 6) return 30
    if (years >= 3) return 25
    if (years >= 1) return 15
    return 5
  } else if (requiredLevel === "noExperience") {
    if (years === 0) return 30
    if (years <= 1) return 25
    return 15
  }

  // Default scoring
  if (years >= 5) return 30
  if (years >= 3) return 25
  if (years >= 1) return 20
  return 10
}

function scoreSkills(resume: ResumeForScoring, requiredSkills: string[], bonusSkills: string[]): number {
  let score = 0

  const skillsText = (resume.skill_set || []).map((s) => s.toLowerCase()).join(" ")
  const experienceText = (resume.experience || [])
    .map((e) => `${e.position} ${e.company} ${e.description || ""}`.toLowerCase())
    .join(" ")
  const aboutText = (resume.about || "").toLowerCase()

  const fullText = `${skillsText} ${experienceText} ${aboutText}`

  // Required skills (max 15 points)
  const matchedRequired = requiredSkills.filter((skill) => fullText.includes(skill.toLowerCase())).length
  score += Math.min(15, matchedRequired * 4)

  // Bonus skills (max 10 points)
  const matchedBonus = bonusSkills.filter((skill) => fullText.includes(skill.toLowerCase())).length
  score += Math.min(10, matchedBonus * 3)

  return Math.min(25, score)
}

function scoreSalary(resume: ResumeForScoring, optimal: { min: number; max: number }): number {
  if (!resume.salary) {
    return 8
  }

  const { from, to, amount } = resume.salary
  let avgSalary: number

  if (amount) {
    avgSalary = amount
  } else if (from && to) {
    avgSalary = (from + to) / 2
  } else if (from) {
    avgSalary = from
  } else if (to) {
    avgSalary = to
  } else {
    return 8
  }

  if (avgSalary >= optimal.min && avgSalary <= optimal.max) {
    return 15
  }

  if (avgSalary < optimal.min) {
    return 12
  }

  if (avgSalary > optimal.max && avgSalary <= optimal.max * 1.5) {
    return 10
  }

  return 8
}

function scoreEducation(resume: ResumeForScoring): number {
  if (!resume.education?.primary || resume.education.primary.length === 0) {
    return 5
  }

  const professionKeywords = ["экономика", "менеджмент", "маркетинг", "бизнес", "финан", "управлен", "коммерц"]
  const educationText = resume.education.primary.map((e) => `${e.name} ${e.organization || ""}`.toLowerCase()).join(" ")

  const isProfessional = professionKeywords.some((kw) => educationText.includes(kw))

  return isProfessional ? 10 : 7
}

function calculateBonus(resume: ResumeForScoring): number {
  let bonus = 0

  const knownCompanies = [
    "яндекс",
    "google",
    "microsoft",
    "сбер",
    "банк",
    "альфа",
    "авито",
    "mail.ru",
    "мегафон",
    "билайн",
    "ozon",
    "wildberries",
    "тинькофф",
    "втб",
  ]

  const companyText = (resume.experience || []).map((e) => e.company?.toLowerCase() || "").join(" ")

  if (knownCompanies.some((comp) => companyText.includes(comp))) {
    bonus += 5
  }

  const aboutText = (resume.about || "").toLowerCase()
  const expDescriptions = (resume.experience || [])
    .map((e) => e.description || "")
    .join(" ")
    .toLowerCase()

  const achievementText = `${aboutText} ${expDescriptions}`
  if (/\d+%|\+\d+|увеличил|снизил|рост|план|выполн|перевыполн/.test(achievementText)) {
    bonus += 5
  }

  return Math.min(10, bonus)
}

function getRating(score: number): string {
  if (score >= 85) return "Отличный кандидат"
  if (score >= 75) return "Хороший кандидат"
  if (score >= 65) return "Среднее совпадение"
  if (score >= 50) return "Низкое совпадение"
  return "Очень низкое совпадение"
}

function getStars(score: number): number {
  if (score >= 85) return 5
  if (score >= 75) return 4
  if (score >= 65) return 3
  if (score >= 50) return 2
  return 1
}
