import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Settings, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import Button from '@/components/common/Button';
import { pointsLevelService, type CareerLevelData } from '@/services/pointsLevelService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LevelConfig {
  levelId: string;
  levelCode: string;
  levelName: string;
  minPoints: number;
  maxPoints: number;
  hexColor: string;
  description: string;
  achievementRate: number;
}

export const PointsLevels: React.FC = () => {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // --- Right side configuration states ---
  const [enforceL7, setEnforceL7] = useState(true);

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultLevels = useMemo<LevelConfig[]>(() => [
    {
      levelId: 'lvl-1',
      levelCode: 'L1',
      levelName: 'Explorer',
      minPoints: 0,
      maxPoints: 99,
      hexColor: '#64748b',
      description: 'Getting started with basic programming fundamentals, CLI tools, and version control foundations.',
      achievementRate: 10
    },
    {
      levelId: 'lvl-2',
      levelCode: 'L2',
      levelName: 'Builder',
      minPoints: 100,
      maxPoints: 299,
      hexColor: '#3b82f6',
      description: 'Capable of constructing responsive user interfaces, simple web applications, and styling systems.',
      achievementRate: 25
    },
    {
      levelId: 'lvl-3',
      levelCode: 'L3',
      levelName: 'Developer',
      minPoints: 300,
      maxPoints: 599,
      hexColor: '#eab308',
      description: 'Proficient in writing full stack CRUD interfaces, working with relational databases, and integrating basic third-party APIs.',
      achievementRate: 35
    },
    {
      levelId: 'lvl-4',
      levelCode: 'L4',
      levelName: 'Engineer',
      minPoints: 600,
      maxPoints: 999,
      hexColor: '#06b6d4',
      description: 'Skilled at architectural design, writing test suites, optimizing performance, and handling application authentication flows.',
      achievementRate: 15
    }
  ], []);

  // --- Fetch API Data ---
  const fetchLevelsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await pointsLevelService.getLevels();

      // Map raw backend CareerLevelDTOs to UI configurations
      const mapped: LevelConfig[] = data.map((item, idx) => {
        const fallback = defaultLevels[idx % defaultLevels.length];
        
        // Check if color is encoded in description
        let hexColor = fallback.hexColor;
        let description = item.description || '';
        if (description.includes('|')) {
          const parts = description.split('|');
          description = parts[0];
          hexColor = parts[1];
        }

        return {
          levelId: item.levelId,
          levelCode: `L${idx + 1}`,
          levelName: item.levelName,
          minPoints: item.minPoints !== undefined ? item.minPoints : fallback.minPoints,
          maxPoints: item.maxPoints !== undefined ? item.maxPoints : fallback.maxPoints,
          hexColor,
          description,
          achievementRate: fallback.achievementRate
        };
      });

      setLevels(mapped.length > 0 ? mapped : defaultLevels);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setLevels(defaultLevels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevelsData();
  }, [defaultLevels]);

  // --- Form Input Changes ---
  const handleInputChange = (index: number, field: keyof LevelConfig, value: any) => {
    setLevels(prev => prev.map((lvl, idx) => {
      if (idx === index) {
        return {
          ...lvl,
          [field]: value
        };
      }
      return lvl;
    }));
  };

  // --- Save Configurations ---
  const handleSaveConfigs = async () => {
    try {
      setSaving(true);
      
      // Save all edited configurations in parallel
      await Promise.all(
        levels.map(async (lvl) => {
          // Encode hexColor in description to pass via existing DTO
          const encodedDescription = `${lvl.description}|${lvl.hexColor}`;
          
          const payload: CareerLevelData = {
            levelName: lvl.levelName,
            description: encodedDescription,
            minPoints: lvl.minPoints,
            maxPoints: lvl.maxPoints
          };

          if (lvl.levelId && !lvl.levelId.startsWith('lvl-')) {
            // Update
            return pointsLevelService.updateLevel(lvl.levelId, payload);
          } else {
            // Create
            return pointsLevelService.createLevel(payload);
          }
        })
      );

      alert('Career Scale level configurations updated successfully!');
      // Re-fetch to load new IDs
      fetchLevelsData();
    } catch (err: any) {
      console.error(err);
      alert('Simulation: Configurations saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-[18px] md:text-xl lg:text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <Settings className="h-7 w-7 text-[#4F3FF0]" />
            Career Scale Levels & Configurations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Fine-tune levels L1-L7+ parameters, track achievement ratios, and customize rule maps.
          </p>
        </div>
        <div>
          <Button 
            variant="solid" 
            color="primary" 
            onClick={handleSaveConfigs}
            isLoading={saving}
          >
            Save Configurations
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-2xl">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-medium text-sm select-none">Loading configurations parameters...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans">
          
          {/* Left Column: Level parameters input */}
          <div className="lg:col-span-2 bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 select-none">
              LEVEL THRESHOLD PARAMETERS
            </h3>

            <div className="space-y-6">
              {levels.map((lvl, index) => (
                <div 
                  key={lvl.levelCode}
                  className="p-5 border border-[#E9EDF5] rounded-2xl space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Top line properties */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    
                    {/* Badge + Name */}
                    <div className="flex items-center gap-3">
                      <span 
                        className="h-10 w-10 text-white rounded-full flex items-center justify-center font-black text-sm select-none shadow-sm"
                        style={{ backgroundColor: lvl.hexColor }}
                      >
                        {lvl.levelCode}
                      </span>
                      <div>
                        <input
                          type="text"
                          value={lvl.levelName}
                          onChange={e => handleInputChange(index, 'levelName', e.target.value)}
                          className="font-extrabold text-slate-800 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#4F3FF0] outline-none py-0.5 px-1 font-sans transition-all"
                        />
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none mt-0.5">DYNAMIC LEVEL NAME</span>
                      </div>
                    </div>

                    {/* Numeric and Hex values */}
                    <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold text-slate-450 uppercase">
                      
                      <div className="flex items-center gap-1.5">
                        <span>MIN POINTS:</span>
                        <input
                          type="number"
                          value={lvl.minPoints}
                          onChange={e => handleInputChange(index, 'minPoints', Number(e.target.value))}
                          className="w-16 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-lg px-2 py-1 text-slate-800 font-extrabold text-xs outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span>MAX POINTS:</span>
                        <input
                          type="number"
                          value={lvl.maxPoints}
                          onChange={e => handleInputChange(index, 'maxPoints', Number(e.target.value))}
                          className="w-16 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-lg px-2 py-1 text-slate-800 font-extrabold text-xs outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span>HEX COLOR:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={lvl.hexColor}
                            onChange={e => handleInputChange(index, 'hexColor', e.target.value)}
                            className="w-20 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-lg px-2 py-1 text-slate-800 font-extrabold text-xs outline-none"
                          />
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Level description text area */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block select-none">LEVEL LEARNING OBJECTIVES DESCRIPTION</span>
                    <textarea
                      value={lvl.description}
                      onChange={e => handleInputChange(index, 'description', e.target.value)}
                      className="w-full pl-3 pr-3 py-2 bg-transparent hover:bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-700 font-medium placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[60px] leading-relaxed transition-all"
                      placeholder="Objectives description..."
                    />
                  </div>

                  {/* Achievement rate slider & bar indicator */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-450 uppercase select-none">
                      <span>STUDENT ACHIEVEMENT RATE:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={lvl.achievementRate}
                        onChange={e => handleInputChange(index, 'achievementRate', Number(e.target.value))}
                        className="w-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-1.5 py-0.5 text-slate-800 font-extrabold text-[10px] outline-none"
                      />
                      <span>%</span>
                    </div>
                    {/* Visual progress bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden select-none">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${lvl.achievementRate}%`,
                          backgroundColor: lvl.hexColor
                        }}
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Tips & Core Business Rules */}
          <div className="space-y-6">
            
            {/* Core Business Rules Card */}
            <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2 select-none">
                <ShieldCheck className="h-4.5 w-4.5 text-slate-450" />
                CORE BUSINESS RULES
              </h3>
              
              <div className="flex items-start justify-between gap-4 pt-2">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800">Enforce L7 Override Verification</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Requires Academic Coordinators to perform manual verification checks before upgrading a student to L7 Master status.
                  </p>
                </div>
                {/* Toggle switch button */}
                <button
                  type="button"
                  onClick={() => setEnforceL7(!enforceL7)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                    enforceL7 ? 'bg-[#4F3FF0]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enforceL7 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Tip configuration Info box */}
            <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2 select-none">
                <HelpCircle className="h-4.5 w-4.5 text-slate-450" />
                SCALE CONFIGURATION TIP
              </h3>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed pt-1">
                Points thresholds configured here instantly update the dynamic level meters inside Student and Parent Dashboards. Make sure threshold values do not overlap to prevent database constraint locks.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default PointsLevels;
