// backend/lib/dbErrors.js
function isDatabaseUnavailable(error) {
  const code = String(error?.code || '').toUpperCase()
  const message = String(error?.message || '').toLowerCase()

  return (
    ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH', 'EAI_AGAIN', '08001', '08004', '08006', '57P03'].includes(code) ||
    message.includes('connect') ||
    message.includes('connection refused') ||
    message.includes('terminat')
  )
}

module.exports = { isDatabaseUnavailable }
