// The ledger array is the persisted entry order. Editing replaces an entry in place;
// new movements append, including backdated entries and linked transfers.
export function orderedMovementItems(operations, month) {
  return operations.flatMap((op, position) => {
    const first = op.legs.find(leg => leg.date.slice(0, 7) === month);
    return first ? [{op, first, date:first.date, position}] : [];
  }).sort((a, b) => b.date.localeCompare(a.date) || a.position - b.position);
}
