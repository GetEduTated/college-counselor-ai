

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, Role, TimelineSection, TimelineItem, TodoItem, Subtask, TimelineEvent, TimelineEventCategory } from './types';
import { getChatSession, getUpdatedTimeline, getMotivationalQuote } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { BotIcon, CalendarIcon, CheckCircleIcon, ListIcon, TimelineIcon, SendIcon, HomeIcon, SignOutIcon, UserIcon, PlusIcon, SubtaskIcon, NotesIcon, ChevronDownIcon, EditIcon, TrashIcon, FlagIcon, PencilRulerIcon, BuildingIcon, ClipboardCheckIcon, TagIcon } from './components/icons';

declare global {
  interface Window {
    google: any;
  }
}

// --- THEME DEFINITIONS ---

export interface Theme {
  name: string;
  colors: {
    [key: string]: string;
  };
}

export const counselorTheme: Theme = {
  name: 'Counselor',
  colors: {
    '--color-bg-primary': '#1A362E', // Deep Forest Green
    '--color-bg-secondary': '#F8F9FA', // Very light grey, almost white
    '--color-bg-muted': '#E9ECEF',    // Lighter Gray for hover on light elements
    '--color-text-primary': '#212529', // Dark text for light backgrounds
    '--color-text-secondary': '#F8F9FA', // Light text for dark backgrounds
    '--color-text-muted': '#6C757D',   // Muted gray text
    '--color-accent-primary': '#FFBF00', // Golden Amber
    '--color-accent-secondary': '#2C5A4B', // Lighter, solid green for user chat bubbles etc.
    '--color-accent-primary-hover': '#E6AC00', // Darker Amber
    '--color-border-primary': '#DEE2E6', // Border on light bg
    '--color-border-on-dark': 'rgba(248, 249, 250, 0.25)', // Border on dark bg (Header, Nav)
    '--color-status-done': '#198754',
    '--color-status-inprogress': '#FFBF00',
    '--font-heading': "'Poppins', sans-serif",
  },
};


// --- INITIAL DATA ---
const initialTimelineData: TimelineSection[] = [
    {
        id: 'jr-spring', title: 'Junior Year - Spring',
        items: [
            { id: 'jrs-1', title: 'Standardized Testing (SAT/ACT)', date: 'March - May', 
              description: 'Prepare for and take the SAT or ACT. Many students take it for the first time in the spring.', 
              todos: [
                {id: 'jrs-1-t1', text: 'Register for SAT/ACT', isCompleted: false, priority: 'High', dueDate: '2025-03-15'}, 
                {id: 'jrs-1-t2', text: 'Study for test', isCompleted: false, priority: 'Medium'}, 
                {id: 'jrs-1-t3', text: 'Take SAT/ACT', isCompleted: false, priority: 'High', dueDate: '2025-05-03', notes: "Don't forget photo ID and admission ticket."}
              ], 
              status: 'todo' 
            },
            { id: 'jrs-2', title: 'Start College Research', date: 'April - June', 
              description: 'Begin researching colleges that interest you. Think about size, location, majors, and campus culture.', 
              todos: [
                {id: 'jrs-2-t1', text: 'Make a list of 15-20 potential colleges', isCompleted: true, priority: 'Medium', subtasks: [{id: 'jrs-2-t1-s1', text: 'Research 5 safety schools', isCompleted: true}, {id: 'jrs-2-t1-s2', text: 'Research 10 match schools', isCompleted: true}]}
              ], 
              status: 'done' 
            },
        ]
    },
    {
        id: 'sr-summer', title: 'Summer Before Senior Year',
        items: [
            { id: 'srs-1', title: 'Brainstorm & Draft Essays', date: 'July - August', description: 'Start working on your main college essay (like the Common App essay).', todos: [{id: 'srs-1-t1', text: 'Brainstorm essay topics', isCompleted: false, priority: 'High'}, {id: 'srs-1-t2', text: 'Write first draft of main essay', isCompleted: false, priority: 'Medium', dueDate: '2024-08-31'}], status: 'todo' },
            { id: 'srs-2', title: 'Create a Common App Account', date: 'August 1st', description: 'The Common Application opens. Create your account and start filling out the basic sections.', todos: [{id: 'srs-2-t1', text: 'Create Common App account', isCompleted: false, priority: 'High', dueDate: '2024-08-01'}], status: 'todo' },
        ]
    },
    {
        id: 'sr-fall', title: 'Senior Year - Fall',
        items: [
            { id: 'srf-1', title: 'Finalize College List', date: 'September', description: 'Narrow your list down to 8-12 colleges, including a mix of safety, match, and reach schools.', todos: [{id: 'srf-1-t1', text: 'Finalize list of colleges to apply to', isCompleted: false, priority: 'High'}], status: 'todo' },
            { id: 'srf-2', title: 'Request Letters of Recommendation', date: 'September - October', description: 'Ask teachers and your counselor for letters of recommendation. Give them plenty of notice!', todos: [{id: 'srf-2-t1', text: 'Ask 2-3 teachers for recommendations', isCompleted: false, priority: 'High', notes: 'Provide them with my resume and a list of colleges.'}], status: 'todo' },
            { id: 'srf-3', title: 'Early Application Deadlines', date: 'Nov 1 / Nov 15', description: 'Deadlines for Early Decision (ED) and Early Action (EA) are typically in November.', todos: [{id: 'srf-3-t1', text: 'Submit Early Decision/Action applications', isCompleted: false, priority: 'High'}], status: 'todo' },
            { id: 'srf-4', title: 'FAFSA Opens', date: 'October 1st', description: 'The Free Application for Federal Student Aid (FAFSA) opens. Submit it as early as possible.', todos: [{id: 'srf-4-t1', text: 'Complete and submit FAFSA', isCompleted: false, priority: 'High'}], status: 'todo' },
        ]
    },
    {
        id: 'sr-winter', title: 'Senior Year - Winter',
        items: [
            { id: 'srw-1', title: 'Regular Decision Deadlines', date: 'Jan 1 / Jan 15', description: 'Most regular decision application deadlines are in early to mid-January.', todos: [{id: 'srw-1-t1', text: 'Submit all remaining applications', isCompleted: false}], status: 'todo' },
            { id: 'srw-2', title: 'Submit Mid-Year Reports', date: 'February', description: 'Your counselor will need to send your first semester senior year grades to colleges.', todos: [{id: 'srw-2-t1', text: 'Confirm counselor sent mid-year report', isCompleted: false}], status: 'todo' },
        ]
    }
];

const initialEventsData: TimelineEvent[] = [
  { id: 'evt-1', title: 'SAT Test Date', date: '2025-05-03', category: 'Testing', description: 'Test center is at Northwood High.' },
  { id: 'evt-2', title: 'Common App Opens', date: '2024-08-01', category: 'Deadline', description: 'Start filling out the main sections.' },
  { id: 'evt-3', title: 'Campus Visit: State University', date: '2025-04-12', category: 'Visit' },
  { id: 'evt-4', title: 'FAFSA Opens', date: '2024-10-01', category: 'Deadline' },
  { id: 'evt-5', title: 'Request Letters of Rec', date: '2024-09-15', category: 'To-Do', description: 'Ask Mr. Smith and Ms. Jones.' },
  { id: 'evt-6', title: 'Early Action Deadline', date: '2024-11-01', category: 'Deadline' },
];

// --- LOGIN VIEW ---
const LoginView: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
    
    useEffect(() => {
        const handleCredentialResponse = (response: any) => {
            try {
                const idToken = response.credential;
                const payload = JSON.parse(atob(idToken.split('.')[1]));
                onLogin(payload.email);
            } catch (error) {
                console.error("Error decoding JWT or handling login:", error);
            }
        };

        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: '276279127971-mlu1k007a6vgpt55e5v1of7eapnrm2i5.apps.googleusercontent.com',
                callback: handleCredentialResponse,
                use_fedcm_for_prompt: false
            });
            window.google.accounts.id.renderButton(
                document.getElementById('googleSignInButton'),
                { theme: 'outline', size: 'large', width: '300' }
            );
        }
    }, [onLogin]);


    return (
        <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg text-center">
                <div>
                    <h1 className="text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">Hi, I'm Vanessa!</h1>
                    <p className="mt-2 text-[var(--color-text-muted)]">Your AI sidekick for the college quest.</p>
                </div>
                <div className="flex justify-center pt-4">
                     <div id="googleSignInButton"></div>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[var(--color-border-primary)]"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400 uppercase">Or</span>
                    <div className="flex-grow border-t border-[var(--color-border-primary)]"></div>
                </div>

                <div>
                    <button
                        onClick={() => onLogin('Guest')}
                        className="text-sm font-semibold text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary-hover)] transition-colors"
                    >
                        Continue as Guest
                    </button>
                </div>
                
                <div className="pt-2">
                    <p className="text-xs text-gray-400">
                        Disclaimer: This app is for informational purposes and is currently in testing. It should not be used as a replacement for meeting with your college counselor or conducting your own research.
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                        Developed by EduTate
                    </p>
                </div>
            </div>
        </div>
    );
};


// --- NAVIGATION COMPONENT ---
type Tab = 'Home' | 'My Timeline' | 'Task List' | 'Vanessa';

const Navigation: React.FC<{ activeTab: Tab; setActiveTab: (tab: Tab) => void; taskCount: number; }> = ({ activeTab, setActiveTab, taskCount }) => {
  const getButtonClasses = (tabName: Tab) => {
    const baseClasses = "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 flex-grow md:flex-grow-0 whitespace-nowrap font-medium transition-colors md:px-6 md:py-4 md:border-b-2 pt-3 pb-2 text-xs md:text-sm";
    const activeClasses = "text-[var(--color-accent-primary)] md:border-[var(--color-accent-primary)]";
    const inactiveClasses = "text-[var(--color-text-secondary)]/70 hover:text-[var(--color-text-secondary)] md:border-transparent md:hover:border-[var(--color-text-secondary)]/30";
    return `${baseClasses} ${activeTab === tabName ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="bg-[var(--color-bg-primary)]/95 backdrop-blur-sm md:shadow-sm fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--color-border-on-dark)] md:sticky md:top-[76px] md:z-10 md:border-t-0">
      <nav className="flex justify-around md:justify-center md:-mb-px max-w-5xl mx-auto">
        <button onClick={() => setActiveTab('Home')} className={getButtonClasses('Home')}>
          <HomeIcon className="w-6 h-6 md:w-5 md:h-5" />
          <span>Home</span>
        </button>
        <button onClick={() => setActiveTab('My Timeline')} className={getButtonClasses('My Timeline')}>
          <TimelineIcon className="w-6 h-6 md:w-5 md:h-5" />
          <span>Timeline</span>
        </button>
        <button onClick={() => setActiveTab('Task List')} className={getButtonClasses('Task List')}>
          <div className="relative">
            <ListIcon className="w-6 h-6 md:w-5 md:h-5" />
            {taskCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[var(--color-bg-primary)]">
                {taskCount}
              </span>
            )}
          </div>
          <span>Tasks</span>
        </button>
        <button onClick={() => setActiveTab('Vanessa')} className={getButtonClasses('Vanessa')}>
          <BotIcon className="w-6 h-6 md:w-5 md:h-5" />
          <span>Vanessa</span>
        </button>
      </nav>
    </div>
  );
};


// --- HOME PAGE VIEW ---
const HomeView: React.FC<{ onSendMessage: (message: string) => void }> = ({ onSendMessage }) => {
    const [customMood, setCustomMood] = useState<string>('');
    const [quote, setQuote] = useState<string>("The future belongs to those who believe in the beauty of their dreams.");
    const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [homeInput, setHomeInput] = useState('');

    const handleFetchQuote = async (selectedMood: string) => {
        setIsQuoteLoading(true);
        setError(null);
        try {
            const newQuote = await getMotivationalQuote(selectedMood);
            setQuote(newQuote);
        } catch (err) {
            console.error(err);
            setError("Couldn't fetch a quote right now.");
        } finally {
            setIsQuoteLoading(false);
        }
    };

    const handleCustomMoodSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(customMood.trim()) {
            handleFetchQuote(customMood);
            setCustomMood('');
        }
    };
    
    const handleHomeChatSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (homeInput.trim()) {
        onSendMessage(homeInput.trim());
        setHomeInput('');
      }
    };
    
    const moodButtons = ['Stressed', 'Tired', 'Excited', 'Overwhelmed', 'Proud', 'Unsure'];

    return (
        <div className="flex flex-col h-full">
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto text-center bg-[var(--color-bg-secondary)] p-8 rounded-2xl shadow-lg">
                    <h1 className="text-4xl text-[var(--color-text-primary)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Welcome!</h1>
                    <p className="text-lg text-[var(--color-text-muted)] mb-6">How are you feeling about your college journey today?</p>
                    <div className="flex justify-center flex-wrap gap-3 mb-6">
                        {moodButtons.map((label) => (
                           <button key={label} onClick={() => handleFetchQuote(label)} className="px-4 py-2 text-sm font-semibold rounded-full bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-primary)] hover:text-[var(--color-text-secondary)] transition-colors">{label}</button>
                        ))}
                    </div>
                    <form onSubmit={handleCustomMoodSubmit} className="mb-8">
                        <label htmlFor="custom-mood" className="sr-only">Describe your mood</label>
                        <input type="text" id="custom-mood" value={customMood} onChange={(e) => setCustomMood(e.target.value)} placeholder="Or, tell me more about how you feel..." className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-full focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:outline-none"/>
                    </form>
                    
                    <div className="min-h-[100px] flex items-center justify-center p-6 bg-[var(--color-bg-muted)] rounded-lg border border-[var(--color-border-primary)]">
                        {isQuoteLoading ? <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-[var(--color-accent-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-3 h-3 bg-[var(--color-accent-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-3 h-3 bg-[var(--color-accent-primary)] rounded-full animate-bounce"></div></div>
                         : error ? <p className="text-red-600">{error}</p>
                         : <blockquote className="text-xl italic text-[var(--color-text-primary)]">"{quote}"</blockquote>}
                    </div>
                </div>
            </main>
            <footer className="p-4 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm border-t border-[var(--color-border-on-dark)]">
                <form onSubmit={handleHomeChatSubmit} className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={homeInput}
                        onChange={(e) => setHomeInput(e.target.value)}
                        placeholder="Have a quick question for Vanessa?"
                        className="w-full pl-4 pr-12 py-3 border border-[var(--color-border-primary)] rounded-full focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:outline-none bg-[var(--color-bg-muted)]"
                    />
                    <button
                        type="submit"
                        disabled={!homeInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--color-text-secondary)] bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message to Vanessa"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

// --- VANESSA CHAT VIEW ---
const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-3 my-4 justify-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white"><BotIcon className="w-5 h-5" /></div>
        <div className="max-w-xs px-4 py-3 rounded-2xl shadow bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-bl-none">
            <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div></div>
        </div>
    </div>
);

interface VanessaViewProps {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
}
const VanessaView: React.FC<VanessaViewProps> = ({ messages, isLoading, onSendMessage }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                    {isLoading && <TypingIndicator />}
                </div>
            </main>
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </div>
    );
};

// --- TASK LIST VIEW & COMPONENTS ---
type SortType = 'default' | 'priority' | 'dueDate';
type FlatTask = TodoItem & { parent: TimelineItem };

// --- Add/Edit Task Modal ---
interface AddEditTaskModalProps {
    task: FlatTask | null;
    timelineItems: TimelineItem[];
    onSave: (taskData: Omit<TodoItem, 'id' | 'isCompleted' | 'subtasks'>, parentId: string, taskId?: string) => void;
    onClose: () => void;
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({ task, timelineItems, onSave, onClose }) => {
    const [text, setText] = useState(task?.text || '');
    const [priority, setPriority] = useState(task?.priority || 'Medium');
    const [dueDate, setDueDate] = useState(task?.dueDate || '');
    const [notes, setNotes] = useState(task?.notes || '');
    const [parentId, setParentId] = useState(task?.parent.id || (timelineItems[0]?.id ?? ''));
    const modalRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ text, priority, dueDate, notes }, parentId, task?.id);
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">{task ? 'Edit Task' : 'Add New Task'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="task-text" className="block text-sm font-medium text-[var(--color-text-muted)]">Task</label>
                        <input type="text" id="task-text" value={text} onChange={e => setText(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="task-parent" className="block text-sm font-medium text-[var(--color-text-muted)]">Goal / Parent Item</label>
                        <select 
                            id="task-parent" 
                            value={parentId} 
                            onChange={e => setParentId(e.target.value)} 
                            disabled={!!task} // Disable if editing
                            className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm disabled:bg-gray-100"
                        >
                            {timelineItems.map(item => (
                                <option key={item.id} value={item.id}>{item.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="task-priority" className="block text-sm font-medium text-[var(--color-text-muted)]">Priority</label>
                        <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as 'High' | 'Medium' | 'Low')} className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="task-duedate" className="block text-sm font-medium text-[var(--color-text-muted)]">Due Date</label>
                        <input type="date" id="task-duedate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="task-notes" className="block text-sm font-medium text-[var(--color-text-muted)]">Notes</label>
                        <textarea id="task-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-primary)]">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent-secondary)] border border-transparent rounded-md shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-secondary)]">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TaskCard: React.FC<{ task: FlatTask; onUpdate: (updatedTask: TodoItem) => void; onEdit: (task: FlatTask) => void; }> = ({ task, onUpdate, onEdit }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const priorityStyles = {
        High: 'bg-red-100 text-red-800',
        Medium: 'bg-yellow-100 text-yellow-800',
        Low: 'bg-green-100 text-green-800',
    };

    const handleToggle = () => {
        onUpdate({ ...task, isCompleted: !task.isCompleted });
    };

    const handleSubtaskToggle = (subtaskId: string) => {
        const newSubtasks = (task.subtasks || []).map(st => 
            st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
        );
        onUpdate({ ...task, subtasks: newSubtasks });
    };

    return (
        <div className={`p-4 rounded-lg shadow-sm border transition-all duration-300 ${task.isCompleted ? 'bg-green-50/50 border-green-200 opacity-70' : 'bg-white border-[var(--color-border-primary)]'}`}>
            <div className="flex items-start gap-4">
                <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={handleToggle}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] cursor-pointer"
                />
                <div className="flex-1">
                    <p className={`font-medium text-[var(--color-text-primary)] ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>{task.text}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-1">
                        {task.priority && (
                            <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${priorityStyles[task.priority]}`}>{task.priority}</span>
                        )}
                        {task.dueDate && <span>Due: {new Date(task.dueDate + 'T00:00:00').toLocaleDateString()}</span>}
                        <span>Goal: {task.parent.title}</span>
                    </div>
                </div>
                 <div className="flex items-center">
                    <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-[var(--color-accent-primary)] transition-colors" aria-label="Edit task" title="Edit Task">
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-gray-400 hover:text-[var(--color-accent-primary)] transition-colors" aria-label="Expand task details">
                        <ChevronDownIcon className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 pl-9 space-y-3">
                    {task.notes && (
                        <div className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
                            <NotesIcon className="w-4 h-4 mt-0.5 text-[var(--color-text-muted)] flex-shrink-0" />
                            <p className="whitespace-pre-wrap">{task.notes}</p>
                        </div>
                    )}
                    {(task.subtasks || []).length > 0 && (
                        <div className="space-y-2">
                             <h4 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2"><SubtaskIcon className="w-4 h-4" /> Subtasks</h4>
                             <ul className="space-y-1">
                                {(task.subtasks || []).map(st => (
                                    <li key={st.id} className="flex items-center gap-2">
                                        <input type="checkbox" checked={st.isCompleted} onChange={() => handleSubtaskToggle(st.id)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] cursor-pointer" />
                                        <label className={`text-sm ${st.isCompleted ? 'line-through text-gray-500' : ''}`}>{st.text}</label>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
};

const TaskListView: React.FC<{ timelineData: TimelineSection[], setTimelineData: (data: TimelineSection[]) => void }> = ({ timelineData, setTimelineData }) => {
    const [sortType, setSortType] = useState<SortType>('default');
    const [showCompleted, setShowCompleted] = useState(true);
    const [modalState, setModalState] = useState<{isOpen: boolean, task: FlatTask | null}>({isOpen: false, task: null});

    const flatTasks = useMemo<FlatTask[]>(() => {
        return timelineData.flatMap(section =>
            section.items.flatMap(item =>
                item.todos.map(todo => ({ ...todo, parent: item }))
            )
        );
    }, [timelineData]);

    const timelineItems = useMemo<TimelineItem[]>(() => 
        timelineData.flatMap(section => section.items), 
    [timelineData]);

    const sortedAndFilteredTasks = useMemo(() => {
        const priorityOrder = { High: 1, Medium: 2, Low: 3 };
        
        let sorted = [...flatTasks];

        sorted.sort((a, b) => {
            // Primary sort: move completed tasks to the bottom
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }

            // Secondary sort based on user's choice
            if (sortType === 'priority') {
                return (priorityOrder[a.priority!] || 4) - (priorityOrder[b.priority!] || 4);
            } else if (sortType === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            
            return 0; // Default order
        });
        
        return sorted.filter(task => showCompleted || !task.isCompleted);
    }, [flatTasks, sortType, showCompleted]);

    const handleUpdateTask = (updatedTask: TodoItem) => {
        const newTimelineData = timelineData.map(section => ({
            ...section,
            items: section.items.map(item => ({
                ...item,
                todos: item.todos.map(todo =>
                    todo.id === updatedTask.id ? updatedTask : todo
                )
            }))
        }));
        setTimelineData(newTimelineData);
    };

    const handleSaveTask = (taskData: Omit<TodoItem, 'id' | 'isCompleted' | 'subtasks'>, parentId: string, taskId?: string) => {
        let newTimelineData;

        if (taskId) { // Editing existing task
            newTimelineData = timelineData.map(section => ({
                ...section,
                items: section.items.map(item => ({
                    ...item,
                    todos: item.todos.map(todo =>
                        todo.id === taskId 
                            ? { ...todo, ...taskData } 
                            : todo
                    )
                }))
            }));
        } else { // Adding new task
            const newTask: TodoItem = {
                id: `todo-${Date.now()}`,
                isCompleted: false,
                ...taskData,
            };
            newTimelineData = timelineData.map(section => ({
                ...section,
                items: section.items.map(item => {
                    if (item.id === parentId) {
                        return { ...item, todos: [...item.todos, newTask] };
                    }
                    return item;
                })
            }));
        }

        setTimelineData(newTimelineData);
        setModalState({isOpen: false, task: null}); // Close modal
    };


    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
            <div className="max-w-4xl mx-auto">
                <header className="md:flex justify-between items-center mb-6 space-y-4 md:space-y-0">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">My Tasks</h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value as SortType)}
                            className="border border-[var(--color-border-primary)] rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:outline-none"
                        >
                            <option value="default">Sort by Default</option>
                            <option value="priority">Sort by Priority</option>
                            <option value="dueDate">Sort by Due Date</option>
                        </select>
                        <div className="flex items-center">
                            <input type="checkbox" id="show-completed" checked={showCompleted} onChange={() => setShowCompleted(!showCompleted)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] cursor-pointer" />
                            <label htmlFor="show-completed" className="ml-2 text-sm text-[var(--color-text-primary)]">Show Completed</label>
                        </div>
                    </div>
                </header>
                
                <div className="space-y-3">
                    {sortedAndFilteredTasks.length > 0 ? (
                        sortedAndFilteredTasks.map(task => (
                           <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} onEdit={(taskToEdit) => setModalState({isOpen: true, task: taskToEdit})} />
                        ))
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-[var(--color-border-primary)] rounded-lg">
                            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-400" />
                            <h3 className="mt-2 text-lg font-medium text-[var(--color-text-primary)]">No tasks to show!</h3>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Either everything is done, or you've hidden completed tasks.</p>
                        </div>
                    )}
                </div>
            </div>

            <button 
                onClick={() => setModalState({isOpen: true, task: null})} 
                className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-[var(--color-accent-primary)] text-[var(--color-text-secondary)] rounded-full p-4 shadow-lg hover:bg-[var(--color-accent-primary-hover)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-primary)] z-30"
                aria-label="Add new task"
            >
                <PlusIcon className="w-6 h-6" />
            </button>

            {modalState.isOpen && (
                <AddEditTaskModal 
                    task={modalState.task}
                    timelineItems={timelineItems}
                    onSave={handleSaveTask}
                    onClose={() => setModalState({isOpen: false, task: null})}
                />
            )}
        </main>
    );
};


// --- TIMELINE VIEW & COMPONENTS (REDESIGNED) ---
const categoryStyles: { [key in TimelineEventCategory]: { icon: React.FC<{className?: string}>, color: string, iconBg: string } } = {
    'Deadline': { icon: FlagIcon, color: 'text-red-800', iconBg: 'bg-red-200' },
    'Testing': { icon: PencilRulerIcon, color: 'text-blue-800', iconBg: 'bg-blue-200' },
    'Visit': { icon: BuildingIcon, color: 'text-purple-800', iconBg: 'bg-purple-200' },
    'To-Do': { icon: ClipboardCheckIcon, color: 'text-yellow-800', iconBg: 'bg-yellow-200' },
    'Other': { icon: TagIcon, color: 'text-gray-800', iconBg: 'bg-gray-200' },
};

interface AddEditEventModalProps {
    event: TimelineEvent | null;
    onSave: (event: Omit<TimelineEvent, 'id'>, id?: string) => void;
    onClose: () => void;
}

const AddEditEventModal: React.FC<AddEditEventModalProps> = ({ event, onSave, onClose }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [date, setDate] = useState(event?.date || '');
    const [category, setCategory] = useState<TimelineEventCategory>(event?.category || 'Other');
    const [description, setDescription] = useState(event?.description || '');
    const modalRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return;
        onSave({ title, date, category, description }, event?.id);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">{event ? 'Edit Event' : 'Add New Event'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="event-title" className="block text-sm font-medium text-[var(--color-text-muted)]">Title</label>
                        <input type="text" id="event-title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="event-date" className="block text-sm font-medium text-[var(--color-text-muted)]">Date</label>
                        <input type="date" id="event-date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="event-category" className="block text-sm font-medium text-[var(--color-text-muted)]">Category</label>
                        <select id="event-category" value={category} onChange={e => setCategory(e.target.value as TimelineEventCategory)} className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm">
                            {Object.keys(categoryStyles).map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="event-description" className="block text-sm font-medium text-[var(--color-text-muted)]">Description / Notes</label>
                        <textarea id="event-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] sm:text-sm"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-primary)]">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent-secondary)] border border-transparent rounded-md shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-secondary)]">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TimelineView: React.FC<{ events: TimelineEvent[], setEvents: (events: TimelineEvent[]) => void }> = ({ events, setEvents }) => {
    const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('day');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
    const groupRefs = useRef(new Map<string, HTMLDivElement | null>());
    const hasScrolled = useRef({ day: false, week: false, month: false });

    const handleOpenModal = (event: TimelineEvent | null = null) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleSaveEvent = (eventData: Omit<TimelineEvent, 'id'>, id?: string) => {
        if (id) {
            setEvents(events.map(e => e.id === id ? { ...e, ...eventData } : e));
        } else {
            const newEvent: TimelineEvent = { id: `evt-${Date.now()}`, ...eventData };
            setEvents([...events, newEvent]);
        }
        handleCloseModal();
    };

    const handleDeleteEvent = (id: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
           setEvents(events.filter(e => e.id !== id));
        }
    };
    
    const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [events]);

    const groupedEvents = useMemo(() => {
        const groups: { [key: string]: TimelineEvent[] } = {};
        sortedEvents.forEach(event => {
            const date = new Date(event.date + 'T00:00:00');
            let key = '';
            if (viewType === 'day') {
                key = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            } else if (viewType === 'week') {
                const dayOfWeek = date.getDay();
                const firstDayOfWeek = new Date(date);
                firstDayOfWeek.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust for week start on Monday
                key = `Week of ${firstDayOfWeek.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`;
            } else { // month
                key = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
            }
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(event);
        });
        return groups;
    }, [sortedEvents, viewType]);

     useEffect(() => {
        if (hasScrolled.current[viewType] || Object.keys(groupedEvents).length === 0) return;

        const today = new Date();
        let todayKey = '';

        if (viewType === 'day') {
            todayKey = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else if (viewType === 'week') {
            const dayOfWeek = today.getDay();
            const firstDayOfWeek = new Date(today);
            firstDayOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            todayKey = `Week of ${firstDayOfWeek.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`;
        } else { // month
            todayKey = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
        }
        
        const element = groupRefs.current.get(todayKey);
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                hasScrolled.current[viewType] = true;
            }, 100);
        }
    }, [groupedEvents, viewType]);

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] self-start md:self-center">My Timeline</h2>
                    <div className="w-full md:w-auto flex p-1 bg-[var(--color-bg-muted)] rounded-lg border border-[var(--color-border-primary)]">
                        {(['day', 'week', 'month'] as const).map(v => (
                           <button key={v} onClick={() => setViewType(v)} className={`w-full text-center px-3 py-1.5 text-sm font-semibold rounded-md capitalize transition-colors ${viewType === v ? 'bg-white shadow-sm text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)] hover:bg-white/50'}`}>{v}</button> 
                        ))}
                    </div>
                </header>

                <div className="space-y-8">
                    {Object.keys(groupedEvents).length > 0 ? (
                        Object.entries(groupedEvents).map(([groupTitle, groupEvents]) => (
                            <div key={groupTitle} ref={(el) => { if (el) { groupRefs.current.set(groupTitle, el); } else { groupRefs.current.delete(groupTitle); } }}>
                                <h3 className="text-lg font-bold text-[var(--color-accent-secondary)] mb-4 pb-2 border-b-2 border-[var(--color-border-primary)]">{groupTitle}</h3>
                                <div className="space-y-4">
                                    {groupEvents.map(event => (
                                        <div key={event.id} className="flex gap-4 items-start">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${categoryStyles[event.category].iconBg}`}>
                                                   {React.createElement(categoryStyles[event.category].icon, { className: `w-5 h-5 ${categoryStyles[event.category].color}` })}
                                                </div>
                                                <div className="w-0.5 grow bg-gray-200 mt-2"></div>
                                            </div>
                                            <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-[var(--color-border-primary)] -mt-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
                                                        <p className="text-sm text-[var(--color-text-muted)]">{new Date(event.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleOpenModal(event)} className="p-1 text-gray-400 hover:text-[var(--color-accent-primary)]"><EditIcon className="w-5 h-5"/></button>
                                                        <button onClick={() => handleDeleteEvent(event.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </div>
                                                {event.description && <p className="text-sm text-[var(--color-text-primary)] mt-2 pt-2 border-t border-dashed">{event.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center py-10 border-2 border-dashed border-[var(--color-border-primary)] rounded-lg">
                            <CalendarIcon className="w-12 h-12 mx-auto text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-[var(--color-text-primary)]">No events yet!</h3>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Click "Add Event" to start building your timeline.</p>
                        </div>
                    )}
                </div>
            </div>
             <button 
                onClick={() => handleOpenModal()} 
                className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-[var(--color-accent-primary)] text-[var(--color-text-secondary)] rounded-full p-4 shadow-lg hover:bg-[var(--color-accent-primary-hover)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-primary)] z-30"
                aria-label="Add new event"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
            {isModalOpen && <AddEditEventModal event={editingEvent} onSave={handleSaveEvent} onClose={handleCloseModal} />}
        </main>
    );
};


// --- MAIN APP ---
const App: React.FC = () => {
    const [user, setUser] = useState<string | null>(null);
    const [timelineData, setTimelineData] = useState<TimelineSection[]>(initialTimelineData);
    const [events, setEvents] = useState<TimelineEvent[]>(initialEventsData);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('Home');

     useEffect(() => {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(counselorTheme.colors)) {
            root.style.setProperty(key, value);
        }
    }, []);

    const incompleteTaskCount = useMemo(() => {
      return timelineData.reduce((count, section) => {
          return count + section.items.reduce((itemCount, item) => {
              return itemCount + item.todos.filter(todo => !todo.isCompleted).length;
          }, 0);
      }, 0);
    }, [timelineData]);

    useEffect(() => {
        const savedUser = localStorage.getItem('college-counselor-user');
        if (savedUser) {
            setUser(savedUser);
            const savedData = localStorage.getItem(`timelineData-${savedUser}`);
            setTimelineData(savedData ? JSON.parse(savedData) : initialTimelineData);
            const savedEvents = localStorage.getItem(`timelineEvents-${savedUser}`);
            setEvents(savedEvents ? JSON.parse(savedEvents) : initialEventsData);
            setMessages([{ role: Role.MODEL, text: "Hello! I'm Vanessa. How can I help with your college journey today?" }]);
        }
    }, []);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`timelineData-${user}`, JSON.stringify(timelineData));
            localStorage.setItem(`timelineEvents-${user}`, JSON.stringify(events));
        }
    }, [timelineData, events, user]);
    
    const handleLogin = (email: string) => {
        const sanitizedEmail = email.trim().toLowerCase();
        if (sanitizedEmail) {
            setUser(sanitizedEmail);
            localStorage.setItem('college-counselor-user', sanitizedEmail);
            const savedData = localStorage.getItem(`timelineData-${sanitizedEmail}`);
            setTimelineData(savedData ? JSON.parse(savedData) : initialTimelineData);
            const savedEvents = localStorage.getItem(`timelineEvents-${sanitizedEmail}`);
            setEvents(savedEvents ? JSON.parse(savedEvents) : initialEventsData);
            setMessages([{ role: Role.MODEL, text: "Hello! I'm Vanessa. How can I help with your college journey today?" }]);
        }
    };
    
    const handleLogout = () => {
        if (user) {
            localStorage.removeItem('college-counselor-user');
        }
        setUser(null);
        setTimelineData(initialTimelineData);
        setEvents(initialEventsData);
        setMessages([]);
    };
    
    const handleSendMessage = async (text: string) => {
        const userMessage: Message = { role: Role.USER, text };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setIsChatLoading(true);
    
        try {
            const chat = getChatSession();
            const result = await chat.sendMessageStream({ message: text });
            let modelResponse = '';
            setMessages((prev) => [...prev, { role: Role.MODEL, text: '' }]);
            for await (const chunk of result) {
                modelResponse += chunk.text;
                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: Role.MODEL, text: modelResponse };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === Role.MODEL && lastMessage.text === '') {
                   newMessages[newMessages.length - 1] = { role: Role.MODEL, text: 'Sorry, I had trouble connecting. Please try again.' };
                } else {
                   newMessages.push({ role: Role.MODEL, text: 'Sorry, I had trouble connecting. Please try again.' });
                }
                return newMessages;
            });
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleSendFromHome = (text: string) => {
        handleSendMessage(text);
        setActiveTab('Vanessa');
    };

    if (!user) {
        return <LoginView onLogin={handleLogin} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'Home': return <HomeView onSendMessage={handleSendFromHome} />;
            case 'My Timeline': return <TimelineView events={events} setEvents={setEvents} />;
            case 'Task List': return <TaskListView timelineData={timelineData} setTimelineData={setTimelineData} />;
            case 'Vanessa': return <VanessaView messages={messages} isLoading={isChatLoading} onSendMessage={handleSendMessage} />;
            default: return <HomeView onSendMessage={handleSendFromHome} />;
        }
    };

    return (
      <div className="flex flex-col h-screen bg-[var(--color-bg-secondary)] font-sans">
        <Header userEmail={user} onSignOut={handleLogout} />
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} taskCount={incompleteTaskCount} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {renderContent()}
        </main>
      </div>
    );
};

export default App;