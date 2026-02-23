import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function NewStoreButton() {
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate('/wizard')}>
      <Plus className="h-4 w-4 mr-2" />
      New Store
    </Button>
  );
}
