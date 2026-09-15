import React from 'react';
import { PageContainer, PageHeader } from '../components/ui/PageContainer';
import EmptyState from '../components/ui/EmptyState';
import { Building2 } from 'lucide-react';

const TheaterList = () => {
  return (
    <PageContainer>
      <PageHeader title="Cơ Sở Rạp Chiếu" subtitle="Danh sách tất cả cụm rạp CineMind trên toàn quốc" />
      <EmptyState
        title="Danh Sách Rạp Chiếu"
        description="Giao diện danh sách rạp và xem suất chiếu theo rạp sẽ hoàn thiện ở Sprint 5."
        icon={Building2}
      />
    </PageContainer>
  );
};

export default TheaterList;
