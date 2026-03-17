export function matchPermission(userPerm: string, required: string): boolean {
  if (userPerm === '*') return true;
  if (userPerm === required) return true;
  const [resource, action] = userPerm.split(':');
  const [reqResource] = required.split(':');
  if (action === '*' && resource === reqResource) return true;
  return false;
}

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.some(p => matchPermission(p, required));
}
