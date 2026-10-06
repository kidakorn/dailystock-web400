import { ConveyorLoader } from './conveyor-loader';
import ui from './ui.module.css';

/** Static HTML shown until the browser has read the query string and rendered the page. */
export const PageLoading = () => (
  <div className={ui.card} role="status">
    <ConveyorLoader />
  </div>
);
