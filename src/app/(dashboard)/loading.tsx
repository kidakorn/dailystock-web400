import { ConveyorLoader } from '@/components/ui/conveyor-loader';
import ui from '@/components/ui/ui.module.css';

export default function Loading() {
  return (
    <div className={ui.card} role="status">
      <ConveyorLoader />
    </div>
  );
}
