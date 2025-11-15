import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThreadList } from '../components/ThreadList';
import { ChatWindow } from '../components/ChatWindow';
import { NewThreadModal } from '../components/NewThreadModal';

/**
 * Main messaging page component.
 * Displays thread list on the left and chat window on the right.
 * 
 * @returns Messaging page component
 */
export function MessagingPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Handles user logout.
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Handles thread creation success.
   * 
   * @param threadId - ID of the newly created thread
   */
  const handleThreadCreated = (threadId: number) => {
    setSelectedThreadId(threadId);
    setIsNewThreadModalOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-centre justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Legora Chat</h1>
        <div className="flex items-centre gap-4">
          <span className="text-sm text-slate-600">
            Logged in as <span className="font-medium">{user?.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-800 transition-colours"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread list sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => setIsNewThreadModalOpen(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colours"
            >
              New Conversation
            </button>
          </div>
          
          <ThreadList
            selectedThreadId={selectedThreadId}
            onSelectThread={setSelectedThreadId}
          />
        </aside>

        {/* Chat window */}
        <main className="flex-1 flex flex-col">
          {selectedThreadId ? (
            <ChatWindow threadId={selectedThreadId} />
          ) : (
            <div className="flex-1 flex items-centre justify-centre text-slate-400">
              <div className="text-centre">
                <p className="text-lg mb-2">No conversation selected</p>
                <p className="text-sm">
                  Choose a conversation or start a new one
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New thread modal */}
      {isNewThreadModalOpen && (
        <NewThreadModal
          onClose={() => setIsNewThreadModalOpen(false)}
          onThreadCreated={handleThreadCreated}
        />
      )}
    </div>
  );
}
