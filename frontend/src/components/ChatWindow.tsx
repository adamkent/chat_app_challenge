import { useState, useEffect, useRef, FormEvent } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';

/**
 * Props for ChatWindow component.
 */
interface ChatWindowProps {
  threadId: number;
}

/**
 * Chat window component displaying messages and input.
 * Automatically scrolls to bottom when new messages arrive.
 * 
 * @param props - Component props
 * @returns Chat window component
 */
export function ChatWindow({ threadId }: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: messages, isLoading } = trpc.message.list.useQuery({ threadId });
  const sendMessageMutation = trpc.message.create.useMutation();

  const utils = trpc.useUtils();

  // Subscribe to new messages in this thread
  trpc.message.onNew.useSubscription(
    { threadId },
    {
      onData: () => {
        // Force refetch messages when new message arrives
        utils.message.list.refetch({ threadId });
      },
    }
  );

  /**
   * Scrolls to the bottom of the message list.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handles sending a new message.
   * 
   * @param e - Form event
   */
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText('');

    try {
      await sendMessageMutation.mutateAsync({
        threadId,
        content,
      });
      
      // Refetch messages to show the new one
      await utils.message.list.invalidate({ threadId });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(content); // Restore message on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-centre justify-centre text-slate-400">
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages && messages.length === 0 ? (
          <div className="text-centre text-slate-400 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages?.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {message.sender.username}
                  </div>
                  <div className="break-words">{message.content}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sendMessageMutation.isPending}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colours"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
