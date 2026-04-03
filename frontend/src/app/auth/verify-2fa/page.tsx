import { Suspense } from 'react';
import Verify2FA from './Verify2FA';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Verify2FA />
    </Suspense>
  );
}
