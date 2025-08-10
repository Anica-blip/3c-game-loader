// main.js
// Shared utilities can go here later.
// Example helper exports could be added and imported by game modules.
export function formatSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

