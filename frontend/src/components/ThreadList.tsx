import { trpc } from '../lib/trpc';

/**
 * Props for ThreadList component.
 */
interface ThreadListProps {
  selectedThreadId: number | null;
  onSelectThread: (threadId: number) => void;
}

/**
 * Thread list component displaying all conversations.
 * Shows other participant's name and last message preview.
 * 
 * @param props - Component props
 * @returns Thread list component
 */
export function ThreadList({ selectedThreadId, onSelectThread }: ThreadListProps) {
  const { data, isLoading, error } = trpc.thread.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-centre justify-centre text-slate-400">
        <p>Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-centre justify-centre text-red-400 p-4">
        <p className="text-sm">Error loading conversations: {error.message}</p>
      </div>
    );
  }

  const threads = data || [];

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex items-centre justify-centre text-slate-400 p-4">
        <p className="text-sm text-centre">
          No conversations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelectThread(thread.id)}
          className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colours ${
            selectedThreadId === thread.id ? 'bg-blue-50 hover:bg-blue-50' : ''
          }`}
        >
          <div className="font-medium text-slate-800 mb-1">
            {thread.otherUser?.username || 'Unknown User'}
          </div>
          {thread.lastMessage && (
            <div className="text-sm text-slate-500 truncate">
              {thread.lastMessage.content}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
