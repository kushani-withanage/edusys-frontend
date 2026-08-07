import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Trophy, 
  Plus, 
  Edit2, 
  Check, 
  X,
  AlertTriangle
} from 'lucide-react';
import { pointsLevelService, type CareerLevelData } from '@/services/pointsLevelService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/utils/toast';

export const PointsLevels: React.FC = () => {
  const [levels, setLevels] = useState<CareerLevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CareerLevelData | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    title: '',
    description: '',
    pointsRequired: 100
  });

  const fetchLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pointsLevelService.getLevels();
      setLevels(data || []);
    } catch (err: any) {
      console.error(err);
      setError('Could not fetch career levels from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  // Compute highest active level
  const highestActiveLevel = useMemo(() => {
    const activeOnes = levels.filter(l => l.isActive);
    if (activeOnes.length === 0) return null;
    return activeOnes.reduce((max, curr) => curr.levelNumber > max.levelNumber ? curr : max, activeOnes[0]);
  }, [levels]);

  // Open modal for add
  const handleAddClick = () => {
    const maxNum = levels.length > 0 ? Math.max(...levels.map(l => l.levelNumber)) : 0;
    setLevelForm({
      levelNumber: maxNum + 1,
      title: '',
      description: '',
      pointsRequired: 100
    });
    setEditingLevel(null);
    setFormError('');
    setShowModal(true);
  };

  // Open modal for edit
  const handleEditClick = (level: CareerLevelData) => {
    setEditingLevel(level);
    setLevelForm({
      levelNumber: level.levelNumber,
      title: level.title,
      description: level.description,
      pointsRequired: level.pointsRequired
    });
    setFormError('');
    setShowModal(true);
  };

  // Toggle active status
  const handleToggleActive = async (level: CareerLevelData) => {
    try {
      const updated = {
        ...level,
        isActive: !level.isActive
      };
      await pointsLevelService.updateLevel(level.id!, updated);
      toast.success(`Level L${level.levelNumber} status updated.`);
      fetchLevels();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update level status.');
    }
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Simple validation
    if (levelForm.levelNumber < 1) {
      setFormError('Level number must be at least 1.');
      return;
    }

    if (!editingLevel) {
      // Validate unique
      const exists = levels.some(l => l.levelNumber === levelForm.levelNumber);
      if (exists) {
        setFormError(`Level L${levelForm.levelNumber} already exists.`);
        return;
      }
      // Validate sequential (no gaps)
      if (levelForm.levelNumber > 1) {
        const prevExists = levels.some(l => l.levelNumber === levelForm.levelNumber - 1);
        if (!prevExists) {
          setFormError(`Cannot create Level L${levelForm.levelNumber} before Level L${levelForm.levelNumber - 1} exists.`);
          return;
        }
      }
    }

    try {
      setFormSubmitting(true);
      const payload: CareerLevelData = {
        levelNumber: levelForm.levelNumber,
        title: levelForm.title,
        description: levelForm.description,
        pointsRequired: Number(levelForm.pointsRequired),
        isActive: editingLevel ? editingLevel.isActive : true
      };

      if (editingLevel) {
        await pointsLevelService.updateLevel(editingLevel.id!, payload);
        toast.success('Level updated successfully!');
      } else {
        await pointsLevelService.createLevel(payload);
        toast.success('Level created successfully!');
      }
      setShowModal(false);
      fetchLevels();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save career level.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto font-sans pb-10 select-none">
      {error && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#4F3FF0]" />
            Career Levels Configuration
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Define career stages, set points advancement thresholds, and manage active levels.
          </p>
        </div>
        <div>
          <button
            onClick={handleAddClick}
            className="px-4.5 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#4F3FF0]/10"
          >
            <Plus className="h-4 w-4" /> Add New Level
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading career levels...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Highlight Card */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute -right-10 -bottom-10 opacity-5">
              <Trophy className="h-40 w-40" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                Career Ladder Status
              </span>
              <h2 className="text-lg md:text-xl font-black">
                {highestActiveLevel ? (
                  <>
                    Current Top Level: <span className="text-indigo-400">L{highestActiveLevel.levelNumber}</span> — {highestActiveLevel.title}
                  </>
                ) : (
                  'No active levels configured yet'
                )}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {highestActiveLevel 
                  ? `Students require a minimum of ${highestActiveLevel.pointsRequired} points to clear this final level.`
                  : 'Add active levels below to map student career scale progression paths.'
                }
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-400 select-none">
                <Check className="h-3.5 w-3.5" /> Ladder Sync Active
              </span>
            </div>
          </div>

          {/* Levels Table */}
          <div className="bg-white border border-[#E9EDF5] rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold text-slate-700 border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-455 uppercase border-b border-slate-150 select-none">
                    <th className="p-4 text-left w-24">Level</th>
                    <th className="p-4 text-left">Level Title</th>
                    <th className="p-4 text-left">Description</th>
                    <th className="p-4 text-left w-40">Points Required</th>
                    <th className="p-4 text-left w-32">Status</th>
                    <th className="p-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {levels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">
                        No levels configured. Click "Add New Level" to start defining the ladder.
                      </td>
                    </tr>
                  ) : (
                    levels.map((level) => (
                      <tr key={level.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-[#4F3FF0] rounded-lg font-black text-xs">
                            L{level.levelNumber}
                          </span>
                        </td>
                        <td className="p-4 text-slate-900 font-extrabold">{level.title}</td>
                        <td className="p-4 text-slate-500 max-w-sm truncate" title={level.description}>
                          {level.description || 'No description provided.'}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800">
                          {level.pointsRequired} pts
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(level)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase transition-colors cursor-pointer select-none border ${
                              level.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {level.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleEditClick(level)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#4F3FF0] rounded-lg transition-colors cursor-pointer"
                            title="Edit Level"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  {editingLevel ? 'Edit Career Level' : 'Add New Level'}
                </h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">
                  Configure leveling details for student career progression.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Level Number</label>
                  <input 
                    type="number"
                    min="1"
                    value={levelForm.levelNumber}
                    disabled={!!editingLevel}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, levelNumber: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Points Required</label>
                  <input 
                    type="number"
                    min="1"
                    value={levelForm.pointsRequired}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, pointsRequired: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Level Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Enterprise Readiness"
                  value={levelForm.title}
                  onChange={(e) => setLevelForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the skill requirements for this level..."
                  value={levelForm.description}
                  onChange={(e) => setLevelForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center justify-center gap-1.5"
                >
                  {formSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    editingLevel ? 'Save Changes' : 'Create Level'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsLevels;
