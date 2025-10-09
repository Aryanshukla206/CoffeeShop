export const CoffeeSchema = {
  name: 'Coffee',
  primaryKey: 'id',
  properties: {
    id: 'string',
    title: 'string?',        // e.g. "Cappuccino"
    size: 'string?',         // e.g. "Large"
    notes: 'string?',
    createdAt: 'date?',
  },
};