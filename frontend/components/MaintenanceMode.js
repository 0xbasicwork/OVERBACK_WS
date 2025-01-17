const MaintenanceMode = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-95 z-50">
            <div className="text-center p-8 rounded-lg bg-gray-800 border-2 border-yellow-500 max-w-lg mx-4">
                <div className="flex justify-center mb-6">
                    <svg className="w-16 h-16 text-yellow-500 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                        <path className="opacity-75" fill="currentColor" d="M4 4h16v16H4z"/>
                        <path className="opacity-25" fill="currentColor" d="M12 2a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z"/>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Under Maintenance</h2>
                <p className="text-gray-300 mb-6">
                    We&apos;re currently updating the OVER/BACK Index to serve you better.
                    Please check back soon.
                </p>
                <div className="text-sm text-gray-400">
                    Estimated completion: ~15 minutes
                </div>
            </div>
        </div>
    );
};

export default MaintenanceMode; 