import React from 'react';
import { PageContainer, PageHeader } from '../components/ui/PageContainer';
import EmptyState from '../components/ui/EmptyState';
import { Popcorn } from 'lucide-react';

const FoodPreview = () => {
  return (
    <PageContainer>
      <PageHeader title="Bắp & Nước F&B" subtitle="Thực đơn bắp nước và các combo khuyến mãi tại rạp" />
      <EmptyState
        title="Thực Đơn F&B"
        description="Giao diện xem trước Bắp & Nước sẽ hoàn thiện ở Sprint 8."
        icon={Popcorn}
      />
    </PageContainer>
  );
};

export default FoodPreview;
