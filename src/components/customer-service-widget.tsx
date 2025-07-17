/**
 * @fileoverview Componente del widget de chat de servicio al cliente.
 * Muestra un botón flotante que abre un popover con una interfaz de chat.
 * Utiliza un flujo de Genkit para proporcionar respuestas generadas por IA a las
 * consultas de los usuarios en tiempo real.
 */
"use client";

import { useState } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { customerService } from '@/ai/flows/customer-service-flow';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function CustomerServiceWidget() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await customerService(input);
            const assistantMessage: Message = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error calling customer service AI:", error);
            const errorMessage: Message = { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button 
                    size="icon" 
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
                    aria-label="Open customer service chat"
                >
                    <MessageSquare className="h-7 w-7" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 h-96 flex flex-col p-0 mr-4" align="end">
                <div className="p-4 bg-primary text-primary-foreground rounded-t-md">
                    <h3 className="font-semibold">Customer Service</h3>
                    <p className="text-xs text-primary-foreground/80">Powered by AI</p>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className={cn(
                                "flex items-start gap-2",
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}>
                                {message.role === 'assistant' && (
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}>
                                    {message.content}
                                </div>
                                {message.role === 'user' && (
                                     <Avatar className="h-6 w-6">
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                         {loading && (
                            <div className="flex items-start gap-2 justify-start">
                                 <Avatar className="h-6 w-6">
                                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                                    <div className="flex items-center space-x-1">
                                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSubmit} className="p-4 border-t">
                    <div className="relative">
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            disabled={loading}
                        />
                        <Button type="submit" size="icon" variant="ghost" className="absolute top-0 right-0 h-full" disabled={loading}>
                            <Send className="h-4 w-4"/>
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}
