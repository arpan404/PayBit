import axios from 'axios';
import { Platform } from 'react-native';
import { apiEndpoint } from '../../constants/api';
import { useStore } from '../store';

// Function to update profile image
export const updateProfileImage = async (imageUri: string) => {
    try {
        const userData = useStore.getState().user;
        const token = userData.token;

        if (!token) {
            throw new Error('User not authenticated');
        }

        // Create form data for image upload
        const formData = new FormData();

        // Get filename from the URI
        const uriParts = imageUri.split('/');
        const fileName = uriParts[uriParts.length - 1];

        // Get file extension
        const fileExtension = fileName.split('.').pop();

        // Append the image to the form data
        formData.append('profileImage', {
            uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
            name: fileName,
            type: `image/${fileExtension}`,
        } as any);

        // Add user's name if available
        if (userData.userFullName) {
            formData.append('fullname', userData.userFullName);
        }

        // Make the API request
        const response = await axios.put(`${apiEndpoint}/api/user/profile`, formData, {
            headers: {
                "x-auth-token": `${userData.token}`,
                'Content-Type': 'multipart/form-data',
            }
        });

        if (response.data.success) {
            // Store the image path exactly as returned from the backend
            const profileImagePath = response.data.data.profileImage;

            // Update the user profile in the local store
            useStore.getState().setUser({
                userProfileImage: profileImagePath
            });

            return {
                success: true,
                profileImage: profileImagePath
            };
        } else {
            throw new Error(response.data.message || 'Failed to update profile image');
        }
    } catch (error: any) {
        console.error('Error updating profile image:', error);
        return {
            success: false,
            error: error.message || 'Failed to update profile image'
        };
    }
}; 