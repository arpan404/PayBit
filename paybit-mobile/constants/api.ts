export const apiEndpoint = "http://192.168.45.95:8000"

// Helper function to get complete image URL
export const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;

    // If it's already a complete URL, return it as is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Remove any leading slash for consistent formatting
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    // Create URL with proper path structure
    return `${apiEndpoint}/upload/${cleanPath}`;
};