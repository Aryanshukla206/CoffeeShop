export const UserSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'string', // e.g. firebase uid or email
    name: 'string?',
    email: 'string?',
    iconLink: 'string?',
    bio: 'string?',
    coffees: { type: 'list', objectType: 'Coffee' }, // 1-to-many relation
  },
};
