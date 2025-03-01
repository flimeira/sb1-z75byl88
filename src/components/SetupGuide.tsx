import React from 'react';
import { AlertCircle } from 'lucide-react';

export function SetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8">
        <div className="flex items-center justify-center mb-8 text-amber-500">
          <AlertCircle className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Supabase Setup Required</h2>
        <div className="space-y-4">
          <p className="text-gray-600">To use this application, you need to set up Supabase:</p>
          <ol className="list-decimal list-inside space-y-3 text-gray-600">
            <li>Click the <strong>"Connect to Supabase"</strong> button in the top right corner</li>
            <li>Create a new Supabase project or select an existing one</li>
            <li>The environment variables will be automatically added to your project</li>
            <li>Refresh the page to start using the application</li>
          </ol>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> After connecting to Supabase, you'll be able to:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-blue-600">
              <li>Create a new account</li>
              <li>Sign in with your credentials</li>
              <li>Access the protected dashboard</li>
              <li>Manage your profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}