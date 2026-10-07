import React from 'react';
import { EmptyState, PageTransition } from '../components/ui';
import { Construction } from 'lucide-react';

export default function ComingSoon({ title = "Coming Soon" }) {
  return (
    <PageTransition>
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState 
          icon={<Construction size={64} className="text-gray-300" />} 
          title={title} 
          description="This page is currently under development. Please check back later!" 
        />
      </div>
    </PageTransition>
  );
}
