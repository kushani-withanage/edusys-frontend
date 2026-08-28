import React from 'react';
import { User, FileText, ExternalLink } from 'lucide-react';

interface StudentRow {
  userId: string;
  fullName: string;
  email: string;
}

interface SubmissionRow {
  id?: string;
  studentId?: string;
  status: string;
  submitDate?: string;
  submittedAt?: string; // Career Scale
  marks?: number; // Assignments
  pointsAwarded?: number; // Career Scale
  feedback?: string; // Assignments
  reviewerComment?: string; // Career Scale
  submittedFile?: string; // Assignments
  filePath?: string; // Career Scale file
  submissionUrl?: string; // Career Scale link
  submissionType?: string; // Career Scale type
}

interface SubmissionsTableProps {
  title: string;
  subtitle: string;
  students: StudentRow[];
  submissions: SubmissionRow[];
  isCareerScale?: boolean;
  onReview: (student: StudentRow, submission: any) => void;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  title,
  subtitle,
  students,
  submissions,
  isCareerScale = false,
  onReview
}) => {
  return (
    <div className="space-y-4 text-left font-sans select-none flex flex-col h-full w-full">
      <div>
        <h3 className="font-extrabold text-slate-800 text-sm font-heading">{title}</h3>
        <p className="text-slate-455 text-[10px] font-semibold mt-0.5">{subtitle}</p>
      </div>

      <div className="overflow-x-auto flex-1 border border-[#E9EDF5] rounded-2xl">
        <table className="w-full text-xs font-semibold text-slate-700 border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-455 uppercase border-b border-slate-150 select-none">
              <th className="p-3 text-left w-12"><input type="checkbox" className="rounded text-[#4F3FF0]" /></th>
              <th className="p-3 text-left w-14">User picture</th>
              <th className="p-3 text-left">First name / Last name</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Email address</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left w-36">{isCareerScale ? 'Points' : 'Grade'}</th>
              <th className="p-3 text-left w-14">Edit</th>
              <th className="p-3 text-left">Last modified (submission)</th>
              <th className="p-3 text-left">Deliverables / Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-10 text-center text-slate-400 font-bold">
                  No students found in this batch.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const sub = submissions.find(s => s.studentId === student.userId);
                
                // Determine if work is submitted
                const isSubmitted = sub && (
                  (sub.submittedFile && sub.submittedFile !== '[]') || 
                  sub.filePath || 
                  sub.submissionUrl
                );

                const dateText = sub?.submitDate || sub?.submittedAt;

                return (
                  <tr key={student.userId} className="hover:bg-slate-50/50 align-middle">
                    <td className="p-3"><input type="checkbox" className="rounded text-[#4F3FF0]" /></td>
                    <td className="p-3">
                      <div className="h-8 w-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border border-slate-200">
                        <User className="h-4 w-4" />
                      </div>
                    </td>
                    <td className="p-3 font-extrabold text-[#4F3FF0] hover:underline cursor-pointer">{student.fullName}</td>
                    <td className="p-3 text-slate-500 font-mono text-[10.5px]">{student.userId}</td>
                    <td className="p-3 text-slate-600 font-mono text-[10.5px]">{student.email}</td>
                    <td className="p-3">
                      {isSubmitted ? (
                        <div className={`p-2 rounded-xl text-[10.5px] border ${
                          sub.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : sub.status === 'REVISION_REQUESTED'
                            ? 'bg-amber-50 text-amber-800 border-amber-100'
                            : sub.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-100'
                            : 'bg-[#EBF7EE] text-emerald-800 border-emerald-100'
                        }`}>
                          <p className="font-extrabold">
                            {sub.status === 'APPROVED' ? 'Approved' :
                             sub.status === 'REVISION_REQUESTED' ? 'Revision Requested' :
                             sub.status === 'REJECTED' ? 'Rejected' : 'Submitted for review'}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-rose-50/50 text-rose-900 border border-rose-100/50 p-2 rounded-xl text-[10.5px]">
                          <p className="font-extrabold text-rose-800">No submission</p>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        {isSubmitted ? (
                          <button
                            onClick={() => onReview(student, sub)}
                            className="px-3 py-1 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-[9.5px] font-black rounded-lg transition-colors cursor-pointer"
                          >
                            {isCareerScale ? 'Review' : 'Grade'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold select-none">No Submission</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold">
                          {isCareerScale ? (
                            <>
                              {sub?.pointsAwarded !== undefined && sub?.pointsAwarded !== null ? `${sub.pointsAwarded}` : '-'} pts
                            </>
                          ) : (
                            <>
                              {sub?.marks !== undefined && sub?.marks !== null ? `${sub.marks.toFixed(2)}` : '-'} / 100.00
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-[#4F3FF0] hover:underline cursor-pointer text-[10.5px] font-black select-none">Edit ▾</td>
                    <td className="p-3 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                      {dateText ? new Date(dateText).toLocaleString() : '-'}
                    </td>
                    <td className="p-3">
                      {/* Assignment File submissions parsing */}
                      {!isCareerScale && (() => {
                        if (sub?.submittedFile && sub.submittedFile.startsWith('[')) {
                          try {
                            const files = JSON.parse(sub.submittedFile);
                            return (
                              <div className="space-y-1 max-w-[200px]">
                                {files.map((file: any, fidx: number) => (
                                  <div key={fidx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-200/55 rounded-lg truncate text-[10px] font-extrabold">
                                    <FileText className="h-3 w-3 text-rose-500 shrink-0" />
                                    <a 
                                      href={file.url.startsWith('data:') ? file.url : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${file.url}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-[#4F3FF0] hover:underline truncate"
                                      title={file.name}
                                    >
                                      {file.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {}
                        }
                        return sub?.submittedFile ? (
                          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-200/55 rounded-lg truncate text-[10px] font-extrabold max-w-[200px]">
                            <FileText className="h-3 w-3 text-rose-550 shrink-0" />
                            <a 
                              href={sub.submittedFile.startsWith('data:') ? sub.submittedFile : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${sub.submittedFile}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[#4F3FF0] hover:underline truncate"
                            >
                              {sub.submittedFile.substring(sub.submittedFile.indexOf('_') + 1)}
                            </a>
                          </div>
                        ) : '-';
                      })()}

                      {/* Career Scale Submissions rendering */}
                      {isCareerScale && (() => {
                        if (sub?.filePath) {
                          const filename = sub.filePath.substring(sub.filePath.lastIndexOf('/') + 1);
                          const readableName = filename.substring(filename.indexOf('_') + 1);
                          return (
                            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-200/55 rounded-lg truncate text-[10px] font-extrabold max-w-[200px]">
                              <FileText className="h-3 w-3 text-rose-500 shrink-0" />
                              <a 
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${sub.filePath}`}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#4F3FF0] hover:underline truncate"
                              >
                                {readableName}
                              </a>
                            </div>
                          );
                        }
                        if (sub?.submissionUrl) {
                          return (
                            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-200/55 rounded-lg truncate text-[10px] font-extrabold max-w-[200px]">
                              <ExternalLink className="h-3 w-3 text-sky-500 shrink-0" />
                              <a 
                                href={sub.submissionUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#4F3FF0] hover:underline truncate"
                              >
                                {sub.submissionUrl}
                              </a>
                            </div>
                          );
                        }
                        return '-';
                      })()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionsTable;
