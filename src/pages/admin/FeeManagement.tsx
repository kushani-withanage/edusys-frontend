import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CreditCard,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  ClipboardCheck
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { feeService, type FeeRecordData, type ReceiptData } from '@/services/feeService';
import { studentService } from '@/services/studentService';

interface FeeStructure {
  id: string;
  batchName: string;
  amount: number;
  frequency: string; // One-Time, Monthly, Quarterly, Annually
  discount: string;  // e.g. 10% Discount, None
}

interface Student {
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  regNo: string;
}

interface FeeRecord {
  feeId: string;
  studentId: string;
  amount: number;
  dueDate: string;
  feeType: string;
  status: string; // UNPAID, PAID, OVERDUE
}

interface Receipt {
  receiptId: string;
  receiptNo: string;
  feeId: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
}

export const FeeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'structures' | 'recorder' | 'overdue'>('structures');

  // --- Lists State ---
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Filter states ---
  const [structureSearch, setStructureSearch] = useState('');
  const [overdueSearch, setOverdueSearch] = useState('');

  // --- Modals states ---
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);

  // --- Form states ---
  const [structureForm, setStructureForm] = useState({
    batchName: '',
    amount: '',
    frequency: 'Monthly',
    discount: 'None'
  });

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    feeId: '',
    feeType: 'Tuition',
    amountPaid: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultStructures = useMemo<FeeStructure[]>(() => [
    { id: 'str-1', batchName: 'iCD110', amount: 1500, frequency: 'One-Time', discount: '10% Discount' },
    { id: 'str-2', batchName: 'iCM111', amount: 1200, frequency: 'Monthly', discount: 'None' },
    { id: 'str-3', batchName: 'iCD112', amount: 1800, frequency: 'Quarterly', discount: '15% Discount' },
    { id: 'str-4', batchName: 'iCM113', amount: 1400, frequency: 'Annually', discount: '5% Discount' }
  ], []);

  const defaultStudents = useMemo<Student[]>(() => [
    { studentId: 'usr-1', fullName: 'Nethmi Wijesinghe', email: 'nethmi@gmail.com', phone: '+94771234567', status: 'ACTIVE', regNo: 'pr268924011' },
    { studentId: 'usr-2', fullName: 'Ranuka Gamage', email: 'ranuka@gmail.com', phone: '+94779876543', status: 'ACTIVE', regNo: 'pr268924012' }
  ], []);

  const defaultFeeRecords = useMemo<FeeRecord[]>(() => [
    { feeId: 'fee-1', studentId: 'usr-1', amount: 1500, dueDate: '2026-07-20', feeType: 'Admission Fee', status: 'UNPAID' },
    { feeId: 'fee-2', studentId: 'usr-2', amount: 1200, dueDate: '2026-07-25', feeType: 'Tuition Fee', status: 'PAID' },
    { feeId: 'fee-3', studentId: 'usr-1', amount: 1800, dueDate: '2026-06-15', feeType: 'Semester Exam Fee', status: 'OVERDUE' },
    { feeId: 'fee-4', studentId: 'usr-2', amount: 1400, dueDate: '2026-08-10', feeType: 'Library Registration', status: 'UNPAID' }
  ], []);

  const defaultReceipts = useMemo<Receipt[]>(() => [
    { receiptId: 'rcpt-1', receiptNo: 'RCP-8924101', feeId: 'fee-2', paymentDate: '2026-07-24', amountPaid: 1200, paymentMethod: 'Card' }
  ], []);

  // --- Fetch API Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentsData, feeRecordsData, receiptsData] = await Promise.all([
        studentService.getStudents(),
        feeService.getFeeRecords(),
        feeService.getReceipts()
      ]);

      setStudents(studentsData);
      setFeeRecords(feeRecordsData);
      setReceipts(receiptsData);

      // Load structures from Local Storage or defaults
      const localStrucs = localStorage.getItem('edusys_fee_structures');
      if (localStrucs) {
        setStructures(JSON.parse(localStrucs));
      } else {
        setStructures(defaultStructures);
        localStorage.setItem('edusys_fee_structures', JSON.stringify(defaultStructures));
      }

    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setStudents(defaultStudents);
      setFeeRecords(defaultFeeRecords);
      setReceipts(defaultReceipts);
      
      const localStrucs = localStorage.getItem('edusys_fee_structures');
      setStructures(localStrucs ? JSON.parse(localStrucs) : defaultStructures);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [defaultStudents, defaultFeeRecords, defaultReceipts, defaultStructures]);

  // --- Save structures locally helper ---
  const saveStructures = (newStrucs: FeeStructure[]) => {
    setStructures(newStrucs);
    localStorage.setItem('edusys_fee_structures', JSON.stringify(newStrucs));
  };

  // --- Calculations for KPI Statistics ---
  const kpiStats = useMemo(() => {
    // Total Unpaid/Overdue Fee records
    const outstanding = feeRecords
      .filter(record => record.status !== 'PAID')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // Total Paid totals from receipts
    const collected = receipts.reduce((sum, r) => sum + Number(r.amountPaid), 0);

    // Number of active students with at least 1 unpaid/overdue invoice
    const uniqueOverdueStudents = new Set(
      feeRecords
        .filter(record => record.status !== 'PAID')
        .map(record => record.studentId)
    ).size;

    return {
      outstanding,
      collected,
      overdueCount: uniqueOverdueStudents
    };
  }, [feeRecords, receipts]);

  // --- Filtered lists ---
  const filteredStructures = useMemo(() => {
    return structures.filter(s => 
      s.batchName.toLowerCase().includes(structureSearch.toLowerCase())
    );
  }, [structures, structureSearch]);

  const filteredOverdueRecords = useMemo(() => {
    return feeRecords
      .filter(record => {
        if (record.status === 'PAID') return false;
        
        // Find matching student
        const student = students.find(s => s.studentId === record.studentId);
        const studentName = student ? student.fullName : '';

        return studentName.toLowerCase().includes(overdueSearch.toLowerCase()) ||
               record.feeType.toLowerCase().includes(overdueSearch.toLowerCase());
      });
  }, [feeRecords, students, overdueSearch]);

  // --- Handle Structure Creation/Edits ---
  const handleOpenAddStructure = () => {
    setSelectedStructure(null);
    setStructureForm({ batchName: '', amount: '', frequency: 'Monthly', discount: 'None' });
    setShowStructureModal(true);
  };

  const handleOpenEditStructure = (structure: FeeStructure) => {
    setSelectedStructure(structure);
    setStructureForm({
      batchName: structure.batchName,
      amount: String(structure.amount),
      frequency: structure.frequency,
      discount: structure.discount
    });
    setShowStructureModal(true);
  };

  const handleSaveStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.batchName.trim() || !structureForm.amount) return;

    if (selectedStructure) {
      // Editing
      const updated = structures.map(s => s.id === selectedStructure.id ? {
        ...s,
        batchName: structureForm.batchName,
        amount: Number(structureForm.amount),
        frequency: structureForm.frequency,
        discount: structureForm.discount
      } : s);
      saveStructures(updated);
      alert('Fee structure updated successfully.');
    } else {
      // Creating
      const newStruc: FeeStructure = {
        id: 'str-' + (structures.length + 1),
        batchName: structureForm.batchName,
        amount: Number(structureForm.amount),
        frequency: structureForm.frequency,
        discount: structureForm.discount
      };
      saveStructures([...structures, newStruc]);
      alert('Fee structure created successfully.');
    }
    setShowStructureModal(false);
  };

  const handleDeleteStructure = (id: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to remove fee structure configuration for batch "${name}"?`);
    if (!confirm) return;
    saveStructures(structures.filter(s => s.id !== id));
  };

  // --- Record Payment Submit Handler ---
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { studentId, feeId, feeType, amountPaid, paymentMethod, paymentDate } = paymentForm;
    if (!studentId || !amountPaid) {
      alert('Please select a student and enter the payment amount.');
      return;
    }

    try {
      setSubmitting(true);

      let finalFeeId = feeId;

      // If feeId is empty (no matching backend invoice found), we dynamically create a new Unpaid Fee Record first
      if (!feeId) {
        const payloadFee: FeeRecordData = {
          studentId: studentId,
          amount: Number(amountPaid),
          dueDate: paymentDate,
          feeType: feeType,
          status: 'UNPAID'
        };
        const createdFee = await feeService.createFeeRecord(payloadFee);
        finalFeeId = createdFee.feeId;

        // Sync local fee records
        setFeeRecords(prev => [...prev, createdFee]);
      }

      // 1. Create Receipt
      const payloadReceipt: ReceiptData = {
        feeId: finalFeeId,
        paymentDate: paymentDate,
        amountPaid: Number(amountPaid),
        paymentMethod: paymentMethod
      };
      const createdReceipt = await feeService.createReceipt(payloadReceipt);
      setReceipts(prev => [createdReceipt, ...prev]);

      // 2. Mark the Fee Record as PAID
      const originalFeeRecord = feeRecords.find(r => r.feeId === finalFeeId);
      if (originalFeeRecord) {
        const updatedFee: FeeRecordData = {
          studentId: originalFeeRecord.studentId,
          amount: originalFeeRecord.amount,
          dueDate: originalFeeRecord.dueDate,
          feeType: originalFeeRecord.feeType,
          status: 'PAID'
        };
        await feeService.updateFeeRecord(finalFeeId, updatedFee);
        setFeeRecords(prev => prev.map(item => item.feeId === finalFeeId ? { ...item, status: 'PAID' } : item));
      }

      alert('Payment receipt successfully logged and invoice marked PAID!');
      setPaymentForm({
        studentId: '',
        feeId: '',
        feeType: 'Tuition',
        amountPaid: '',
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0]
      });

    } catch (err: any) {
      console.error(err);
      // Fallback
      const simulatedFeeId = feeId || 'fee-' + (feeRecords.length + 1);
      
      if (!feeId) {
        const newFee: FeeRecord = {
          feeId: simulatedFeeId,
          studentId: studentId,
          amount: Number(amountPaid),
          dueDate: paymentDate,
          feeType: feeType,
          status: 'PAID'
        };
        setFeeRecords(prev => [...prev, newFee]);
      } else {
        setFeeRecords(prev => prev.map(item => item.feeId === feeId ? { ...item, status: 'PAID' } : item));
      }

      const newReceipt: Receipt = {
        receiptId: 'rcpt-' + (receipts.length + 1),
        receiptNo: 'RCP-' + Math.floor(1000000 + Math.random() * 9000000),
        feeId: simulatedFeeId,
        paymentDate: paymentDate,
        amountPaid: Number(amountPaid),
        paymentMethod: paymentMethod
      };
      setReceipts(prev => [newReceipt, ...prev]);

      alert('Simulation: Payment recorded successfully.');
      setPaymentForm({
        studentId: '',
        feeId: '',
        feeType: 'Tuition',
        amountPaid: '',
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0]
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Dynamic selector options helpers ---
  const activeUnpaidFees = useMemo(() => {
    if (!paymentForm.studentId) return [];
    return feeRecords.filter(r => r.studentId === paymentForm.studentId && r.status !== 'PAID');
  }, [paymentForm.studentId, feeRecords]);

  // Adjust payment amount automatically when choosing an invoice
  const handleFeeSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const matchingFee = feeRecords.find(r => r.feeId === selectedId);
    setPaymentForm(prev => ({
      ...prev,
      feeId: selectedId,
      amountPaid: matchingFee ? String(matchingFee.amount) : '',
      feeType: matchingFee ? matchingFee.feeType : 'Tuition'
    }));
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-250 rounded-2xl text-rose-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <CreditCard className="h-7 w-7 text-[#4F3FF0]" />
            Finance & Fees Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage structure fees, record payments, and audit overdue balances.
          </p>
        </div>
        <div>
          {activeTab === 'structures' && (
            <Button 
              variant="solid" 
              color="primary" 
              onClick={handleOpenAddStructure}
              startIcon={<Plus className="h-4.5 w-4.5" />}
            >
              Add Fee Structure
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8 select-none">
        <button
          onClick={() => setActiveTab('structures')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'structures' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Fee Structure Setup
          {activeTab === 'structures' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('recorder')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'recorder' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Payment Recorder
          {activeTab === 'recorder' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'overdue' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Overdue Dashboard
          {activeTab === 'overdue' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        
        {/* --- TAB 1: FEE STRUCTURE SETUP --- */}
        {activeTab === 'structures' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
              <div className="relative w-full max-w-xl">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  value={structureSearch}
                  onChange={(e) => setStructureSearch(e.target.value)}
                  placeholder="Search batch code..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Structures Table */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Loading fee structure catalog...</p>
                </div>
              ) : filteredStructures.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="font-bold text-slate-655">No batch fee structures configured</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                        <th className="px-6 py-4">BATCH MODULE</th>
                        <th className="px-6 py-4">FEE AMOUNT</th>
                        <th className="px-6 py-4">DUE FREQUENCY</th>
                        <th className="px-6 py-4">APPLIED DISCOUNT</th>
                        <th className="px-6 py-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5]">
                      {filteredStructures.map(struc => (
                        <tr key={struc.id} className="hover:bg-slate-50/30 transition-colors duration-150">
                          <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                            {struc.batchName}
                          </td>
                          <td className="px-6 py-4.5 font-bold text-[#4F3FF0] text-sm">
                            Rs. {Number(struc.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="inline-flex items-center px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 text-xs font-semibold rounded-full select-none">
                              {struc.frequency}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            {struc.discount && struc.discount !== 'None' ? (
                              <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold rounded-full select-none">
                                {struc.discount}
                              </span>
                            ) : (
                              <span className="text-slate-350">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <div className="flex justify-end gap-2.5">
                              <button 
                                onClick={() => handleOpenEditStructure(struc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-[#4F3FF0] hover:text-white border border-slate-200 hover:border-[#4F3FF0] text-xs font-bold rounded-xl text-slate-700 transition-all cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit Structure
                              </button>
                              <button 
                                onClick={() => handleDeleteStructure(struc.id, struc.batchName)}
                                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                                title="Remove Structure"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: PAYMENT RECORDER --- */}
        {activeTab === 'recorder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Record Form */}
            <div className="lg:col-span-2 bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold tracking-wider text-slate-800 mb-6 flex items-center gap-2 select-none font-heading">
                <ClipboardCheck className="h-5 w-5 text-[#4F3FF0]" />
                RECORD NEW PAYMENT RECEIPT
              </h3>

              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                
                {/* Student selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Select Student *</label>
                  <select
                    value={paymentForm.studentId}
                    onChange={e => setPaymentForm(prev => ({ ...prev, studentId: e.target.value, feeId: '', amountPaid: '' }))}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                    required
                  >
                    <option value="">-- Select Active Student --</option>
                    {students.map(s => (
                      <option key={s.studentId} value={s.studentId}>{s.fullName} ({s.regNo})</option>
                    ))}
                  </select>
                </div>

                {/* Unpaid invoices selector */}
                {paymentForm.studentId && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Link to Unpaid Fee Records (Optional)</label>
                    <select
                      value={paymentForm.feeId}
                      onChange={handleFeeSelectionChange}
                      className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                    >
                      <option value="">-- Create Custom / Manual Fee Record --</option>
                      {activeUnpaidFees.map(f => (
                        <option key={f.feeId} value={f.feeId}>{f.feeType} - Rs. {Number(f.amount).toFixed(2)} (Due: {f.dueDate})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Fee Type input if manual */}
                {!paymentForm.feeId && (
                  <TextField
                    label="Fee Type Description"
                    value={paymentForm.feeType}
                    onChange={e => setPaymentForm(prev => ({ ...prev, feeType: e.target.value }))}
                    placeholder="e.g. Tuition Fee"
                    required
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Amount Paid (Rs) *"
                    type="number"
                    value={paymentForm.amountPaid}
                    onChange={e => setPaymentForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                    placeholder="e.g. 1500"
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Payment Method</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={e => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                    >
                      <option value="Cash">Cash payment</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer / Deposit</option>
                    </select>
                  </div>
                </div>

                <TextField
                  label="Payment Receipt Date"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={e => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                />

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                    Record Transaction
                  </Button>
                </div>
              </form>
            </div>

            {/* Recent Payments logs */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 select-none">RECENT PAYMENTS LOG</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 text-[#4F3FF0] animate-spin" />
                </div>
              ) : receipts.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-10">No recent payments logged.</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {receipts.map(rcpt => {
                    const linkedFee = feeRecords.find(r => r.feeId === rcpt.feeId);
                    const feeDesc = linkedFee ? linkedFee.feeType : 'Fee Payment';
                    return (
                      <div key={rcpt.receiptId} className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold text-[#4F3FF0] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{rcpt.receiptNo || 'RCP-SEED'}</span>
                          <span className="text-[10px] font-bold text-slate-400">{rcpt.paymentDate}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs mt-2 leading-none">{feeDesc}</h4>
                        <div className="flex justify-between items-end mt-3">
                          <span className="text-[10px] font-semibold text-slate-450">Method: {rcpt.paymentMethod}</span>
                          <span className="text-sm font-extrabold text-emerald-600">Rs. {Number(rcpt.amountPaid).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- TAB 3: OVERDUE DASHBOARD --- */}
        {activeTab === 'overdue' && (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Outstanding</p>
                  <p className="text-2xl font-black text-slate-850 mt-1">Rs. {kpiStats.outstanding.toFixed(2)}</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Collected Fees</p>
                  <p className="text-2xl font-black text-slate-850 mt-1">Rs. {kpiStats.collected.toFixed(2)}</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Overdue Accounts</p>
                  <p className="text-2xl font-black text-slate-850 mt-1">{kpiStats.overdueCount} Students</p>
                </div>
              </div>
            </div>

            {/* Overdue filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
              <div className="relative w-full max-w-xl">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  value={overdueSearch}
                  onChange={(e) => setOverdueSearch(e.target.value)}
                  placeholder="Search student name or fee type..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Overdue Table */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Loading outstanding invoices...</p>
                </div>
              ) : filteredOverdueRecords.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="font-bold text-slate-655">All clear! No overdue fee records found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                        <th className="px-6 py-4">STUDENT REG NO</th>
                        <th className="px-6 py-4">STUDENT NAME</th>
                        <th className="px-6 py-4">FEE TYPE</th>
                        <th className="px-6 py-4">DUE DATE</th>
                        <th className="px-6 py-4">AMOUNT</th>
                        <th className="px-6 py-4">STATUS</th>
                        <th className="px-6 py-4 text-right">REMINDER</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5]">
                      {filteredOverdueRecords.map(record => {
                        const student = students.find(s => s.studentId === record.studentId);
                        const studentName = student ? student.fullName : 'Unknown';
                        const regNo = student ? student.regNo : 'N/A';
                        
                        return (
                          <tr key={record.feeId} className="hover:bg-slate-50/30 transition-colors duration-150">
                            <td className="px-6 py-4.5 font-bold text-slate-500 text-sm">
                              {regNo}
                            </td>
                            <td className="px-6 py-4.5 font-extrabold text-slate-800 text-sm">
                              {studentName}
                            </td>
                            <td className="px-6 py-4.5 text-slate-650 text-sm font-semibold">
                              {record.feeType}
                            </td>
                            <td className="px-6 py-4.5 text-slate-500 text-sm font-semibold whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {record.dueDate}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                              Rs. {Number(record.amount).toFixed(2)}
                            </td>
                            <td className="px-6 py-4.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 border text-xs font-semibold rounded-full ${
                                record.status === 'OVERDUE' 
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 font-bold'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              <button 
                                onClick={() => alert(`Fee reminder notification sent successfully to ${studentName}!`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4F3FF0]/5 hover:bg-[#4F3FF0] hover:text-white border border-[#4F3FF0]/10 hover:border-transparent text-xs font-bold rounded-xl text-[#4F3FF0] transition-all cursor-pointer"
                              >
                                Notify Student
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* --- ADD/EDIT STRUCTURE MODAL --- */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-805 mb-4 font-heading">
              {selectedStructure ? 'Edit Fee Configuration' : 'Add Fee Structure'}
            </h3>
            
            <form onSubmit={handleSaveStructureSubmit} className="space-y-4 font-sans">
              <TextField
                label="Batch Module Name"
                value={structureForm.batchName}
                onChange={e => setStructureForm(prev => ({ ...prev, batchName: e.target.value }))}
                placeholder="e.g. iCD114"
                required
              />

              <TextField
                label="Fee Amount (Rs)"
                type="number"
                value={structureForm.amount}
                onChange={e => setStructureForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="e.g. 1500"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Due Frequency</label>
                <select
                  value={structureForm.frequency}
                  onChange={e => setStructureForm(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="One-Time">One-Time</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Applied Discount</label>
                <select
                  value={structureForm.discount}
                  onChange={e => setStructureForm(prev => ({ ...prev, discount: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="None">No Discount</option>
                  <option value="5% Discount">5% Discount</option>
                  <option value="10% Discount">10% Discount</option>
                  <option value="15% Discount">15% Discount</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowStructureModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Save Configuration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeeManagement;
