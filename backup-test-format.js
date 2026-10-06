export function diagnosticData(amountCents) {
  if (![12345, 54321].includes(amountCents)) throw new Error('Importe ficticio inválido.');
  return { operations: [{ id: 'diagnostic-only', amountCents }], cases: [], templates: [] };
}
export async function checksum(data) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data)));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export async function validateDiagnosticBackup(backup) {
  if (backup?.format !== 'control-gastos-backup' || backup.schemaVersion !== 1 || backup.mode !== 'diagnostic-only' || backup.complete !== true || backup.source !== 'firestore' || backup.timeZone !== 'America/Argentina/Buenos_Aires' || !Number.isSafeInteger(backup.revision) || backup.revision < 1 || typeof backup.snapshotId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(backup.snapshotId) || !Number.isFinite(Date.parse(backup.createdAt))) throw new Error('La copia no corresponde a esta prueba.');
  const data = backup.data;
  if (!data || !Array.isArray(data.operations) || data.operations.length !== 1 || data.operations[0]?.id !== 'diagnostic-only' || !Array.isArray(data.cases) || data.cases.length || !Array.isArray(data.templates) || data.templates.length) throw new Error('Copia ficticia incompleta.');
  const expected = diagnosticData(data.operations[0].amountCents);
  if (JSON.stringify(data) !== JSON.stringify(expected) || backup.checksum !== await checksum(data)) throw new Error('La integridad de la copia no coincide.');
  return data.operations[0].amountCents;
}
