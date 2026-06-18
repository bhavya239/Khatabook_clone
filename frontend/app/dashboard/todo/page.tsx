'use client';

import { useState, useEffect } from 'react';
import { todoAPI, contactAPI } from '@/lib/api';

type Todo = {
  _id: string;
  title: string;
  amount: number;
  type: 'collect' | 'give' | 'other';
  dueDate: string;
  status: 'pending' | 'completed';
  contact?: { _id: string; name: string };
};

type Contact = {
  _id: string;
  name: string;
};

export default function TodoPage() {
  const [filter, setFilter] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Add Todo Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'collect' | 'give' | 'other'>('collect');
  const [newContact, setNewContact] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await todoAPI.getAll(filter);
      setTodos(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await contactAPI.getAll();
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setContacts([]);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [filter]);

  useEffect(() => {
    fetchContacts();
    // Default the date input to today
    setNewDueDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      // Optimistic update
      setTodos(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      await todoAPI.updateStatus(id, newStatus);
    } catch (err) {
      console.error('Failed to update status', err);
      fetchTodos(); // revert on fail
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setTodos(prev => prev.filter(t => t._id !== id));
      await todoAPI.delete(id);
    } catch (err) {
      console.error('Failed to delete', err);
      fetchTodos(); // revert on fail
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await todoAPI.create({
        title: newTitle,
        amount: newAmount ? Number(newAmount) : undefined,
        type: newType,
        contact: newContact || undefined,
        dueDate: newDueDate,
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewAmount('');
      setNewType('other');
      setNewContact('');
      setNewDueDate(new Date().toISOString().split('T')[0]);
      fetchTodos();
    } catch (err) {
      console.error('Failed to create todo', err);
      alert('Failed to create task.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">To-Do Reminders</h1>
          <p className="text-gray-400 text-sm mt-1">Manage tasks and money collection reminders.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>➕</span> Add Task
        </button>
      </div>

      <div className="flex bg-gray-900 rounded-xl p-1 mb-6 max-w-sm">
        {['yesterday', 'today', 'tomorrow'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading tasks...</div>
      ) : todos.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-medium text-white">All caught up!</h3>
          <p className="text-gray-400 text-sm mt-1">No tasks scheduled for {filter}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo._id}
              className={`flex items-start sm:items-center gap-4 bg-gray-900 border ${
                todo.status === 'completed' ? 'border-green-500/30 bg-green-900/10' : 'border-gray-800'
              } p-4 rounded-xl transition-all`}
            >
              <button
                onClick={() => handleToggleStatus(todo._id, todo.status)}
                className={`mt-1 sm:mt-0 w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                  todo.status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : 'bg-transparent border-gray-600 hover:border-indigo-500'
                }`}
              >
                {todo.status === 'completed' && <span className="text-white text-xs">✓</span>}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                  {todo.title}
                </p>
                {todo.contact && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    👤 {todo.contact.name}
                  </p>
                )}
              </div>

              {todo.amount && todo.amount > 0 && (
                <div className={`text-right ${todo.status === 'completed' ? 'opacity-50' : ''}`}>
                  <p className={`font-bold ${todo.type === 'collect' ? 'text-green-400' : todo.type === 'give' ? 'text-rose-400' : 'text-white'}`}>
                    {todo.type === 'give' ? '-' : ''}₹{todo.amount}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {todo.type}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleDelete(todo._id)}
                className="text-gray-500 hover:text-red-400 ml-2"
                title="Delete task"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Add New Task</h2>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Collect pending amount"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white target:outline-none focus:border-indigo-500"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="₹ 0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white target:outline-none focus:border-indigo-500"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white target:outline-none focus:border-indigo-500"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                  >
                    <option value="collect">Collect (Get)</option>
                    <option value="give">Give (Pay)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Related Contact (Optional)</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white target:outline-none focus:border-indigo-500"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                >
                  <option value="">-- No Contact --</option>
                  {(contacts || []).map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white target:outline-none focus:border-indigo-500"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-medium transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
