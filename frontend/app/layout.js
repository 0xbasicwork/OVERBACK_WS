import MaintenanceMode from '@/components/MaintenanceMode';
import MaintenanceControl from '@/components/MaintenanceControl';

export default function RootLayout({ children }) {
    // You can control this with an environment variable or API endpoint
    const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    const isDev = process.env.NODE_ENV === 'development';

    return (
        <html lang="en">
            <body>
                {MAINTENANCE_MODE ? (
                    <MaintenanceMode />
                ) : (
                    children
                )}
                {isDev && <MaintenanceControl />}
            </body>
        </html>
    );
} 