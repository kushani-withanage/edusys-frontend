import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm max-w-2xl">
      <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
        Welcome Admin.
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        You have successfully logged into the iCET EduSys administrative portal. Use the navigation to manage the system.
      </p>
    </div>
  );
};

export default Dashboard;
