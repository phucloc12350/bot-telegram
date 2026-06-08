import { FuelDashboard } from './fuel-dashboard';

export const metadata = { title: 'Thống kê giá xăng' };
export const dynamic = 'force-dynamic';

export default function FuelPage() {
  return <FuelDashboard />;
}
