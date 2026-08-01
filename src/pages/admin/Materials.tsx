import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Upload,
  Eye,
  Trash2,
  FolderOpen,
  Calendar,
  User
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { materialService, type MaterialData } from '@/services/materialService';

interface Material {
  assignmentId: string;
  title: string;       // file name
  description: string; // batch code
  dueDate: string;     // uploaded date
  createdBy: string;   // instructor
}

export const Materials: React.FC = () => {
  // --- States ---
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Modals State ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Form States ---
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: 'ICD110',
    createdBy: 'Mr. Kasun Jayasuriya',
    dueDate: new Date().toISOString().split('T')[0]
  });

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultMaterials = useMemo<Material[]>(() => [
    {
      assignmentId: 'mat-1',
      title: 'Git branching structures roadmap.pdf',
      description: 'ICD110',
      dueDate: '2026-07-10',
      createdBy: 'Mr. Kasun Jayasuriya'
    },
    {
      assignmentId: 'mat-2',
      title: 'Flexbox and responsive UI grid layout guides.zip',
      description: 'ICM111',
      dueDate: '2026-07-08',
      createdBy: 'Mrs. Kushani Withanage'
    }
  ], []);

  // --- Fetch API Data ---
  const fetchMaterialsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await materialService.getMaterials();

      // Map raw backend AssignmentDTOs to our Material representation
      const mapped: Material[] = data.map(item => ({
        assignmentId: item.assignmentId,
        title: item.title,
        description: item.description || 'General',
        dueDate: item.dueDate,
        createdBy: item.createdBy || 'System'
      }));

      setMaterials(mapped.length > 0 ? mapped : defaultMaterials);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setMaterials(defaultMaterials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialsData();
  }, [defaultMaterials]);

  // --- Handlers ---
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) return;

    try {
      setSubmitting(true);
      const payload: MaterialData = {
        title: uploadForm.title,
        description: uploadForm.description,
        dueDate: uploadForm.dueDate,
        createdBy: uploadForm.createdBy
      };

      const created = await materialService.createMaterial(payload);
      
      const newMaterial: Material = {
        assignmentId: created.assignmentId,
        title: created.title,
        description: created.description,
        dueDate: created.dueDate,
        createdBy: created.createdBy
      };

      setMaterials(prev => [newMaterial, ...prev]);
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: 'ICD110',
        createdBy: 'Mr. Kasun Jayasuriya',
        dueDate: new Date().toISOString().split('T')[0]
      });
      alert('Material uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      // Fallback
      const sandboxCreated: Material = {
        assignmentId: 'mat-' + (materials.length + 1),
        title: uploadForm.title,
        description: uploadForm.description,
        dueDate: uploadForm.dueDate,
        createdBy: uploadForm.createdBy
      };
      setMaterials(prev => [sandboxCreated, ...prev]);
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: 'ICD110',
        createdBy: 'Mr. Kasun Jayasuriya',
        dueDate: new Date().toISOString().split('T')[0]
      });
      alert('Simulation: Material uploaded locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: string, title: string) => {
    const confirm = window.confirm(`Are you sure you want to delete material "${title}"?`);
    if (!confirm) return;

    try {
      await materialService.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.assignmentId !== id));
      alert('Material deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setMaterials(prev => prev.filter(m => m.assignmentId !== id));
      alert('Simulation: Material deleted.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-250 rounded-2xl text-rose-800 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <FolderOpen className="h-7 w-7 text-[#4F3FF0]" />
            Academic Panel Desk
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure academic records, grading, class rosters, materials, and testing schedules.
          </p>
        </div>
        <div>
          <Button 
            variant="solid" 
            color="primary" 
            onClick={() => {
              setUploadForm({
                title: '',
                description: 'ICD110',
                createdBy: 'Mr. Kasun Jayasuriya',
                dueDate: new Date().toISOString().split('T')[0]
              });
              setShowUploadModal(true);
            }}
            startIcon={<Upload className="h-4.5 w-4.5" />}
          >
            Upload New Material
          </Button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-medium text-sm select-none">Loading learning materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E9EDF5] rounded-2xl">
          <h3 className="font-bold text-slate-655">No materials or assignments uploaded</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map(mat => (
            <div 
              key={mat.assignmentId}
              className="bg-white border border-[#E9EDF5] hover:border-slate-300 p-5 rounded-2xl shadow-sm transition-all flex items-start justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                  BATCH CODE: {mat.description}
                </span>
                
                <h4 className="text-sm font-extrabold text-slate-800 leading-snug font-sans truncate max-w-[280px]" title={mat.title}>
                  {mat.title}
                </h4>

                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-450 uppercase pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    UPLOADED: {mat.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    BY: {mat.createdBy}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 select-none">
                <button
                  onClick={() => alert(`Opening preview window for resource file: ${mat.title}`)}
                  className="p-2 border border-slate-200 hover:border-[#4F3FF0] hover:text-[#4F3FF0] rounded-xl text-slate-450 transition-all cursor-pointer bg-white"
                  title="View Material"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteMaterial(mat.assignmentId, mat.title)}
                  className="p-2 border border-slate-200 hover:border-rose-500 hover:text-rose-600 rounded-xl text-slate-450 transition-all cursor-pointer bg-white"
                  title="Delete Material"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- UPLOAD MATERIAL MODAL --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-805 mb-4 font-heading flex items-center gap-2 select-none">
              <Upload className="h-5 w-5 text-[#4F3FF0]" />
              Upload Learning Material
            </h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4 font-sans">
              
              <TextField
                label="Resource Filename / Title *"
                value={uploadForm.title}
                onChange={e => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Git branching structures roadmap.pdf"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Target Batch Program</label>
                <select
                  value={uploadForm.description}
                  onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="ICD110">ICD110 (Programming Fundamentals)</option>
                  <option value="ICM111">ICM111 (Database Management System)</option>
                  <option value="ICD112">ICD112 (Object Oriented Programming)</option>
                  <option value="ICM113">ICM113 (Internet Technologies)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Responsible Instructor</label>
                <select
                  value={uploadForm.createdBy}
                  onChange={e => setUploadForm(prev => ({ ...prev, createdBy: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="Mr. Kasun Jayasuriya">Mr. Kasun Jayasuriya</option>
                  <option value="Mrs. Kushani Withanage">Mrs. Kushani Withanage</option>
                </select>
              </div>

              <TextField
                label="Upload Date"
                type="date"
                value={uploadForm.dueDate}
                onChange={e => setUploadForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowUploadModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Upload File
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Materials;
