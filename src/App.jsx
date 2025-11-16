import { Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

export default function App() {
  return (
    <MainLayout className="container-fluid p-0 m-0 text-center mx-auto">
      <Outlet />
    </MainLayout>
  );
}
