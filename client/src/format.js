// Il server manda le date in UTC (es. "2026-11-01T06:00:00.000Z"):
// toLocaleString le mostra nell'ora italiana, ora legale compresa.
// Risultato: "domenica 1 novembre alle ore 07:00"
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
