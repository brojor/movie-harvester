interface Client { id: string, write: (data: string) => void }
const clients = new Set<Client>()

export function addClient(id: string, write: Client['write']): () => boolean {
  const c = { id, write }
  clients.add(c)
  return () => clients.delete(c) // unsubscribe
}

export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const c of clients) c.write(payload)
}
