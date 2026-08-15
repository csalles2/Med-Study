// medstudy-frontend/src/utils/guestId.ts
const CHAVE = 'medstudy_guest_id';

export function getGuestId(): string {
  let id = localStorage.getItem(CHAVE);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CHAVE, id);
  }
  return id;
}
