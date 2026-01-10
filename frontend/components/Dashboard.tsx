'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Expense {
  _id?: string;
  id?: string;
  title: string;
  amount: number;
  category: string;
  paymentMode: string;
  date: string;
  note?: string;
}

export function Dashboard() {
  const { user, token, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'food',
    paymentMode: 'cash',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchExpenses = async () => {
    if (!token) return;
    try {
      const data = await api.expenses.list(token);
      if (Array.isArray(data)) {
         setExpenses(data);
      } else if (data.expenses && Array.isArray(data.expenses)) {
         setExpenses(data.expenses);
      } else {
         setExpenses([]); 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingId(expense.id || expense._id || null);
      setFormData({
        title: expense.title,
        amount: String(expense.amount),
        category: expense.category,
        paymentMode: expense.paymentMode,
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        note: expense.note || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        amount: '',
        category: 'food',
        paymentMode: 'cash',
        date: new Date().toISOString().split('T')[0],
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      const payload = {
        title: formData.title,
        amount: Number(formData.amount),
        category: formData.category,
        paymentMode: formData.paymentMode,
        date: new Date(formData.date).toISOString(),
        note: formData.note
      };

      if (editingId) {
        await api.expenses.update(token, editingId, payload);
      } else {
        await api.expenses.create(token, payload);
      }

      await fetchExpenses();
      setIsModalOpen(false);
    } catch {
      alert('Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        await api.expenses.delete(token, id);
        setExpenses(prev => prev.filter(ex => (ex.id !== id && ex._id !== id)));
    } catch {
        alert('Failed to delete');
    }
  };

  const getCategoryIcon = (cat: string) => {
    // Map backend response 'utilities' to a visible icon, e.g., 'Bills'
    const overrides: Record<string, string> = {
        utilities: 'Bills'
    };
    const key = Object.keys(Icons).find(k => k.toLowerCase() === (overrides[cat.toLowerCase()] || cat.toLowerCase()));
    // @ts-expect-error key might not be in Icons
    const IconComponent = Icons[key || 'Other'];
    return <IconComponent className="w-5 h-5 text-white" />;
  };

  const getCategoryColor = (cat: string) => {
    const colors: {[key: string]: string} = {
      food: 'bg-orange-500 shadow-orange-500/20',
      transport: 'bg-blue-500 shadow-blue-500/20',
      utilities: 'bg-red-500 shadow-red-500/20',
      shopping: 'bg-pink-500 shadow-pink-500/20',
      bills: 'bg-red-500 shadow-red-500/20',
      entertainment: 'bg-purple-500 shadow-purple-500/20',
      health: 'bg-emerald-500 shadow-emerald-500/20',
      other: 'bg-slate-500 shadow-slate-500/20'
    };
    return colors[cat.toLowerCase()] || 'bg-slate-500 shadow-slate-500/20';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-8 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden"> 
             <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[120px]" />
             <div className="absolute bottom-[20%] left-[-5%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px]" />
        </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/50 border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-500 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">D</div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 hidden md:block">Daily Spend</h1>
            </div>
            <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden md:block">Welcome, {user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="hover:bg-destructive/10 hover:text-destructive">
                <Icons.LogOut className="w-5 h-5" />
            </Button>
            </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 relative z-10">
        
        {/* Overview Card */}
        <div className="grid md:grid-cols-2 gap-4">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
             >
                <Card className="bg-gradient-to-br from-primary via-blue-900 to-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                    <CardContent className="p-8 relative z-10">
                        <h3 className="text-primary-foreground/80 text-sm font-medium mb-1 uppercase tracking-wider">Total balance</h3>
                        <div className="text-5xl font-bold tracking-tight mb-2">
                            ₹{calculateTotal().toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                            <span className="bg-white/20 px-2 py-0.5 rounded text-white text-xs font-semibold">+2.4%</span>
                            <span>from last month</span>
                        </div>
                    </CardContent>
                </Card>
             </motion.div>

             <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
             >
                <Card className="h-full flex flex-col justify-center items-center bg-card/50 backdrop-blur-sm border-border">
                    <CardContent className="flex flex-col items-center text-center p-6">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <p className="text-foreground font-medium mb-1">Financial Health</p>
                        <p className="text-sm text-muted-foreground">&quot;A penny saved is a penny earned.&quot;</p>
                    </CardContent>
                </Card>
             </motion.div>
        </div>

        {/* Transactions List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight">Recent Transactions</h2>
            <span className="text-sm text-muted-foreground px-3 py-1 bg-secondary rounded-full">{expenses.length} records</span>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {isLoading ? (
               <div className="text-center py-20 text-muted-foreground animate-pulse">Loading amazing data...</div>
            ) : expenses.length === 0 ? (
               <motion.div variants={itemVariants} className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border">
                  <p className="text-muted-foreground">No expenses yet. Start tracking!</p>
               </motion.div>
            ) : (
                <AnimatePresence mode='popLayout'>
                {expenses.map((expense) => (
                    <motion.div 
                        key={expense.id || expense._id}
                        variants={itemVariants}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleOpenModal(expense)}
                        className="group bg-card/80 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 ${getCategoryColor(expense.category)}`}>
                                {getCategoryIcon(expense.category)}
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground text-lg">{expense.title}</h4>
                                <div className="flex gap-2 text-xs text-muted-foreground font-medium">
                                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="capitalize">{expense.category}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                             <div className="text-right">
                                <div className="font-bold text-foreground text-lg">-₹{Number(expense.amount).toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded-full inline-block">{expense.paymentMode}</div>
                             </div>
                             <button
                                onClick={(e) => handleDelete(expense.id || expense._id!, e)}
                                className="transition-all p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                             >
                                <Icons.Trash className="w-5 h-5" />
                             </button>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            )}
          </motion.div>
        </div>
      </main>

      {/* Floating Add Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleOpenModal()}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-16 h-16 bg-primary text-primary-foreground rounded-[20px] shadow-2xl shadow-primary/40 flex items-center justify-center z-30"
      >
        <Icons.Plus className="w-8 h-8" />
      </motion.button>

      {/* Modal Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Expense" : "New Expense"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <Input 
                label="Expense Title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="What did you spend on?"
                required
                className="bg-secondary/50"
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Amount (₹)" 
                    type="number"
                    step="0.01"
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                    className="bg-secondary/50 font-mono"
                />
                 <Input 
                    label="Date" 
                    type="date"
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    className="bg-secondary/50"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/90">Category</label>
                    <div className="relative">
                        <select 
                            className="w-full h-11 px-3 py-2 bg-secondary/50 border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none appearance-none text-sm text-foreground"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="food" className="bg-slate-950 text-white">Food</option>
                            <option value="transport" className="bg-slate-950 text-white">Transport</option>
                            <option value="utilities" className="bg-slate-950 text-white">Utilities</option>
                            <option value="entertainment" className="bg-slate-950 text-white">Entertainment</option>
                            <option value="other" className="bg-slate-950 text-white">Other</option>
                        </select>
                         <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/90">Payment Mode</label>
                    <div className="relative">
                        <select 
                            className="w-full h-11 px-3 py-2 bg-secondary/50 border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none appearance-none text-sm text-foreground"
                            value={formData.paymentMode}
                            onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                        >
                            <option value="cash" className="bg-slate-950 text-white">Cash</option>
                            <option value="card" className="bg-slate-950 text-white">Card</option>
                            <option value="UPI" className="bg-slate-950 text-white">UPI</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

             <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/90">Note</label>
                    <textarea 
                        className="w-full p-3 bg-secondary/50 border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none min-h-[80px] text-sm resize-none placeholder:text-muted-foreground text-foreground"
                        value={formData.note}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                        placeholder="Add any extra details..."
                    />
            </div>
            
            <div className="pt-2 flex gap-3">
                 <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                    Cancel
                 </Button>
                 <Button type="submit" isLoading={isSaving} className="flex-1" variant="default">
                    {editingId ? 'Update Changes' : 'Save Expense'}
                 </Button>
            </div>
        </form>
      </Modal>    

    </div>
  );
}
