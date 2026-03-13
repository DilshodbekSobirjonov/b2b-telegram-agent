"use client"

import { Search, Bot, User, Archive } from "lucide-react"

export default function ConversationsPage() {
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
            placeholder="Search by client name, ID, or phone..." 
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
            {[1, 2, 3].map(i => (
              <div key={i} className={`p-4 rounded-xl cursor-pointer border ${i === 1 ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'} transition-colors`}>
                <h4 className="font-semibold text-foreground text-sm">Alice Smith</h4>
                <p className="text-xs text-muted-foreground mt-1">Today at 14:05 • Booking Intent</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
          
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-foreground">Detailed Transcript: Alice Smith</h3>
            <p className="text-xs text-muted-foreground mt-1">AI Summary: Client successfully booked a consultation for May 1st at 14:00.</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            <div className="flex justify-end gap-3">
              <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[80%]">
                I would like to book an appointment please.
              </div>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[80%] border border-border">
                Вы записаны:<br/><br/>Дата: 2024-05-01<br/>Время: 14:00<br/><br/>Подтвердить?
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[80%]">
                Да
              </div>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[80%] border border-border">
                Отлично! Ваша запись подтверждена.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
