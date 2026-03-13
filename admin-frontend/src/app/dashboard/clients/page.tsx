"use client"

import { useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { MessageSquare, ChevronRight, Clock, Search, X, Loader2 } from "lucide-react"

interface Client {
  id: string
  name: string
  lastSeen: string
  convCount: number
  status: string
}

interface Conversation {
  id: string
  date: string
  summary: string
}

interface Message {
  role: string
  text: string
  time: string
}

interface TranscriptData {
  conversationId: string
  userId: string
  summary: string
  messages: Message[]
}

export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // Real API fetches
  const { data: clients, isLoading: clientsLoading } = useSWR<Client[]>(
    '/api/clients', api.fetcher
  )
  const { data: conversations, isLoading: convsLoading } = useSWR<Conversation[]>(
    selectedClient ? `/api/clients/${encodeURIComponent(selectedClient.id)}/conversations` : null,
    api.fetcher
  )
  const { data: transcript, isLoading: transcriptLoading } = useSWR<TranscriptData>(
    selectedConvId ? `/api/conversations/${selectedConvId}/messages` : null,
    api.fetcher
  )

  const filtered = (clients || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden animate-in fade-in duration-500">

      {/* Client List */}
      <div className={`flex flex-col bg-card border border-border rounded-xl overflow-hidden transition-all ${selectedClient ? 'w-64 min-w-[16rem]' : 'flex-1 max-w-sm'}`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-3">Clients</h2>
          <div className="flex items-center bg-background rounded-lg px-3 py-2 border border-border gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="bg-transparent outline-none text-sm w-full text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {clientsLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading clients...</span>
            </div>
          )}
          {!clientsLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">
              {clients?.length === 0 ? 'No clients yet.' : 'No results found.'}
            </p>
          )}
          {filtered.map(c => (
            <button key={c.id} onClick={() => { setSelectedClient(c); setSelectedConvId(null); }}
              className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/40 transition-colors flex items-start gap-3 ${selectedClient?.id === c.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.convCount} conversation{c.convCount !== 1 ? 's' : ''}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{c.lastSeen}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      {selectedClient && !selectedConvId && (
        <div className="flex flex-col w-64 min-w-[16rem] bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-foreground text-sm">{selectedClient.name}</h2>
              <p className="text-xs text-muted-foreground">{conversations?.length ?? '...'} conversation{(conversations?.length ?? 0) !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setSelectedClient(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {convsLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading...</span>
              </div>
            )}
            {!convsLoading && conversations?.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">No conversations found.</p>
            )}
            {conversations?.map(c => (
              <button key={c.id} onClick={() => setSelectedConvId(c.id)}
                className="w-full text-left p-4 border-b border-border/50 hover:bg-muted/40 transition-colors">
                <p className="text-sm font-medium text-foreground">{c.date}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.summary}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Viewer */}
      {selectedConvId && (
        <div className="flex flex-col flex-1 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-primary" />
                Transcript — {selectedClient?.name}
              </h2>
              {transcript && <p className="text-xs text-muted-foreground mt-0.5 italic">📝 {transcript.summary}</p>}
            </div>
            <button onClick={() => setSelectedConvId(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcriptLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading messages...</span>
              </div>
            )}
            {transcript?.messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">
                    AI
                  </div>
                )}
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm border border-border'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground'}`}>{msg.time}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">
                    U
                  </div>
                )}
              </div>
            ))}
            {transcript?.messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No messages in this conversation.</p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedClient && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-3">
            <MessageSquare className="w-12 h-12 mx-auto opacity-20" />
            <p className="text-sm">Select a client to view their conversations</p>
          </div>
        </div>
      )}
    </div>
  )
}
