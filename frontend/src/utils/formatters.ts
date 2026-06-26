export function formatDate(str?: string): string {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('pt-BR')
}

export function formatGrade(value: string | number): string {
  return Number(value).toFixed(1).replace('.', ',')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
