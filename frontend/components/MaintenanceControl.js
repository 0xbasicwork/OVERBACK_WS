'use client';

const MaintenanceControl = () => {
    const toggleMaintenance = async (enabled) => {
        try {
            const response = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            if (response.ok) {
                // Reload page to show/hide maintenance mode
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to toggle maintenance mode:', error);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => toggleMaintenance(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg shadow-lg"
            >
                Enable Maintenance Mode
            </button>
        </div>
    );
};

export default MaintenanceControl; 