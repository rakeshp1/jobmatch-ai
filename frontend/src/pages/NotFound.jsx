import { Link } from 'react-router-dom';
import { PageHeader } from '../components/Feedback';

export function NotFound() {
  return (
    <section>
      <PageHeader eyebrow="404" title="That page is not on the board" subtitle="Head back to the dashboard and pick up the search from there." />
      <Link className="btn" to="/">Go to dashboard</Link>
    </section>
  );
}
