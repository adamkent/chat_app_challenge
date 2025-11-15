import { useState, FormEvent } from 'react';
import { trpc } from '../lib/trpc';

/**
 * Props for NewThreadModal component.
 */
interface NewThreadModalProps {
  onClose: () => void;
  onThreadCreated: (threadId: number) => void;
}

/**
 * Modal for creating a new thread with another user.
 * 
 * @param props - Component props
 * @returns New thread modal component
 */
export function NewThreadModal({ onClose, onThreadCreated }: NewThreadModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const createThreadMutation = trpc.thread.create.useMutation({
    onSuccess: (data) => {
      onThreadCreated(data.id);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * Handles form submission to create a new thread.
   * 
   * @param e - Form event
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    createThreadMutation.mutate({ otherUsername: username.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-centre justify-centre z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">
          New Conversation
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={createThreadMutation.isPending}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colours"
              disabled={createThreadMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createThreadMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colours"
            >
              {createThreadMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
