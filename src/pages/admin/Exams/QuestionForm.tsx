import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';
import type { QuestionFormProps } from './types';

export const QuestionForm: React.FC<QuestionFormProps> = ({
  question: initialData,
  onSave: onSubmit,
  onCancel
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [courseId, setCourseId] = useState(initialData?.courseId || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'EASY');
  const [questionType, setQuestionType] = useState(initialData?.questionType || 'SINGLE_CHOICE');
  const [defaultMarks, setDefaultMarks] = useState(initialData?.defaultMarks?.toString() || '5');
  const [submitting, setSubmitting] = useState(false);

  // Options list state
  const [options, setOptions] = useState<any[]>(
    initialData?.options?.map((o: any) => ({
      id: o.id || '',
      optionText: o.optionText || '',
      isCorrect: !!o.isCorrect,
      orderIndex: o.orderIndex ?? 0
    })) || [
      { id: '', optionText: '', isCorrect: true, orderIndex: 0 },
      { id: '', optionText: '', isCorrect: false, orderIndex: 1 }
    ]
  );

  useEffect(() => {
    // Load courses to populate module dropdown
    api.get<any[]>('/api/v1/exam-courses')
      .then(data => {
        setCourses(data);
        if (!courseId && data.length > 0) {
          setCourseId(data[0].courseId);
        }
      })
      .catch(err => console.error('Failed to load courses', err));
  }, []);

  const handleAddOption = () => {
    setOptions(prev => [
      ...prev,
      { id: '', optionText: '', isCorrect: false, orderIndex: prev.length }
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('A question must have at least 2 options.');
      return;
    }
    setOptions(prev => 
      prev.filter((_, i) => i !== index).map((opt, i) => ({ ...opt, orderIndex: i }))
    );
  };

  const handleOptionTextChange = (index: number, val: string) => {
    setOptions(prev => {
      const copy = [...prev];
      copy[index].optionText = val;
      return copy;
    });
  };

  const handleCorrectToggle = (index: number) => {
    setOptions(prev => {
      return prev.map((opt, i) => {
        if (questionType === 'SINGLE_CHOICE') {
          return { ...opt, isCorrect: i === index };
        } else {
          return { ...opt, isCorrect: i === index ? !opt.isCorrect : opt.isCorrect };
        }
      });
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast.error('Question text is required.');
      return;
    }
    if (!courseId) {
      toast.error('Course module is required.');
      return;
    }
    const marksNum = parseInt(defaultMarks);
    if (isNaN(marksNum) || marksNum <= 0) {
      toast.error('Default marks must be a positive integer.');
      return;
    }

    // Validate options
    const nonEmptyOptions = options.filter(o => o.optionText.trim() !== '');
    if (nonEmptyOptions.length < 2) {
      toast.error('Please fill in at least 2 options.');
      return;
    }

    const correctCount = nonEmptyOptions.filter(o => o.isCorrect).length;
    if (correctCount === 0) {
      toast.error('Please select at least one correct option.');
      return;
    }

    if (questionType === 'SINGLE_CHOICE' && correctCount > 1) {
      toast.error('Single choice questions can only have exactly one correct option.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        id: initialData?.id || undefined,
        courseId,
        questionText,
        questionType,
        difficulty,
        defaultMarks: marksNum,
        options: nonEmptyOptions
      };
      await onSubmit(payload);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit question.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 text-left font-sans max-w-2xl mx-auto">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Question Prompt</label>
        <textarea
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter question text here..."
          className="w-full px-4 py-3 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Course Module</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
          >
            {courses.map(c => (
              <option key={c.courseId} value={c.courseId}>{c.courseName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Question Type</label>
          <select
            value={questionType}
            onChange={(e) => {
              setQuestionType(e.target.value);
              // reset options check state for single-choice to prevent multiple checks
              if (e.target.value === 'SINGLE_CHOICE') {
                setOptions(prev => prev.map((o, idx) => ({ ...o, isCorrect: idx === 0 })));
              }
            }}
            className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
          >
            <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
            <option value="MULTI_CHOICE">Multiple Choice (Checkboxes)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Default Marks</label>
          <input
            type="number"
            value={defaultMarks}
            onChange={(e) => setDefaultMarks(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
            placeholder="Marks (e.g. 5)"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Answer Options</h4>
          <button
            type="button"
            onClick={handleAddOption}
            className="px-3 py-1.5 text-[9.5px] font-black rounded-lg border border-dashed border-[#4F3FF0]/30 hover:border-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[#4F3FF0] transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Option
          </button>
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <input
                type={questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                name="correct-option"
                checked={opt.isCorrect}
                onChange={() => handleCorrectToggle(idx)}
                className="h-4 w-4 rounded-full text-[#4F3FF0] focus:ring-[#4F3FF0]"
                title="Mark as correct option"
              />
              <input
                type="text"
                value={opt.optionText}
                onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 px-3 py-1.5 border border-slate-200/80 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold bg-white text-slate-800"
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(idx)}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center justify-center gap-1.5"
        >
          {submitting ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </form>
  );
};
