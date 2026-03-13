"use client"

import { useState } from "react"
import { Search, Bot, User, Archive, MessageSquare } from "lucide-react"
import { useDataFetch } from "@/lib/hooks"

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: convs, loading: loadingConvs } = useDataFetch<any[]>('/api/conversations')
  const { data: detail, loading: loadingDetail } = useDataFetch<any>(selectedId ? `/api/conversations/${selectedId}/messages` : null)

  const activeConv = convs?.find(c => c.id === selectedId)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Conversation Archive</h1>
        <p className="text-muted-foreground">View and search through past AI transcripts and semantic summaries.</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex bg-card items-center rounded-xl px-4 py-3 w-full max-w-md border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all">
          <Search className="w-4 h-4 text-muted-foreground mr-3" />
          <input 
            type="text" 
            placeholder="Search by client ID..." 
            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        
        {/* Sidebar List */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border font-semibold text-foreground flex items-center gap-2">
            <Archive className="w-4 h-4 text-primary" /> Transcripts
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConvs ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : convs && convs.length > 0 ? (
              convs.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedId(c.id)}
                  className={`p-4 rounded-xl cursor-pointer border ${selectedId === c.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'} transition-colors`}
                >
                  <h4 className="font-semibold text-foreground text-sm">Client {c.userId}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(c.startTime).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground p-8">No conversations found.</p>
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p>Select a conversation to view transcript</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detail ? (
            <>
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-foreground">Transcript: Client {detail.userId}</h3>
                <p className="text-xs text-muted-foreground mt-1">{detail.summary}</p>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {detail.messages?.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`
                      px-4 py-3 rounded-2xl text-sm shadow-sm max-w-[80%] border
                      ${msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground border-transparent rounded-tr-sm' 
                        : 'bg-muted text-foreground border-border rounded-tl-sm'}
                    `}>
                      {msg.text}
                      <span className="block text-[10px] opacity-50 mt-1 uppercase font-bold">{msg.time}</span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Could not load transcript</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
