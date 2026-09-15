// Dynamic API Base URL yang mendukung root host maupun subdirectory Laragon (/belajarceria/public)
const getApiBase = () => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/belajarceria/public')) {
        return '/belajarceria/public/api/v1';
    }
    return '/api/v1';
};

const API_BASE = getApiBase();

export const getAuthToken = () => localStorage.getItem('bc_auth_token');
export const setAuthToken = (token) => localStorage.setItem('bc_auth_token', token);
export const removeAuthToken = () => {
    localStorage.removeItem('bc_auth_token');
    localStorage.removeItem('bc_user');
    localStorage.removeItem('bc_active_child');
};
export const isAuthenticated = () => !!localStorage.getItem('bc_auth_token');
export const setAuthSession = (token, user = null) => {
    setAuthToken(token);
    if (user) {
        localStorage.setItem('bc_user', JSON.stringify(user));
    }
};

export const getActiveChild = () => {
    try {
        const item = localStorage.getItem('bc_active_child');
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

export const setActiveChild = (child) => {
    localStorage.setItem('bc_active_child', JSON.stringify(child));
};

async function request(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || 'Terjadi kesalahan pada server.');
        error.status = response.status;
        error.errors = data.errors || {};
        throw error;
    }

    return data;
}

export const api = {
    // Auth
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    verifyParentalGate: (payload) => request('/auth/parental-gate/verify', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me'),

    // Child Area (/belajarceria)
    getChildHome: (childId) => request(`/children/${childId}/home`),
    getModules: () => request('/modules'),
    getModuleTopics: (code, childId) => request(`/modules/${code}/topics${childId ? `?child_id=${childId}` : ''}`),
    getTopicDetail: (id) => request(`/topics/${id}`),
    getQuestions: (id, limit = 10, random = true) => request(`/topics/${id}/questions?limit=${limit}&random=${random}`),
    getStories: (page = 1, perPage = 10, topicId = null, childId = null) => {
        let url = `/stories?page=${page}&per_page=${perPage}`;
        if (topicId) url += `&topic_id=${topicId}`;
        if (childId) url += `&child_id=${childId}`;
        return request(url);
    },
    getStoryDetail: (id) => request(`/stories/${id}`),
    completeStory: (storyId, childId) => request(`/stories/${storyId}/complete`, { method: 'POST', body: JSON.stringify({ child_id: childId }) }),
    submitQuizAttempt: (payload) => request('/quiz-attempts', { method: 'POST', body: JSON.stringify(payload) }),
    getChildBadges: (childId) => request(`/children/${childId}/badges`),
    getChildSettings: (childId) => request(`/children/${childId}/settings`),
    updateChildSettings: (childId, payload) => request(`/children/${childId}/settings`, { method: 'PUT', body: JSON.stringify(payload) }),

    // Parent Area (/orangtua)
    getParentChildren: () => request('/parent/children'),
    createChild: (payload) => request('/parent/children', { method: 'POST', body: JSON.stringify(payload) }),
    updateChild: (id, payload) => request(`/parent/children/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteChild: (id) => request(`/parent/children/${id}`, { method: 'DELETE' }),
    getChildReport: (id, range = 'week') => request(`/parent/children/${id}/report?range=${range}`),
    getParentAccount: () => request('/parent/account'),
    updateParentAccount: (payload) => request('/parent/account', { method: 'PUT', body: JSON.stringify(payload) }),
    updateParentPin: (pin) => request('/parent/pin', { method: 'PUT', body: JSON.stringify({ pin }) }),

    // Tumbuh Kembang Anak
    getChildGrowth: (childId) => request(`/parent/children/${childId}/growth`),
    createGrowthMeasurement: (childId, payload) => request(`/parent/children/${childId}/growth`, { method: 'POST', body: JSON.stringify(payload) }),
    updateGrowthMeasurement: (id, payload) => request(`/parent/growth/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    toggleChildMilestone: (childId, milestoneKey, tercapai) => request('/parent/milestone_progress', { 
        method: 'POST', 
        body: JSON.stringify({ 
            id_anak: childId, 
            id_item_milestone: milestoneKey, 
            status: tercapai ? 'tercapai' : 'belum', 
            tanggal_tercapai: tercapai ? new Date().toISOString().split('T')[0] : null,
            milestone_key: milestoneKey, 
            tercapai 
        }) 
    }),

    // Admin Area (/admin)
    getAdminSummary: () => request('/admin/dashboard/summary'),
    getAdminModules: () => request('/admin/modules'),
    createAdminModule: (payload) => request('/admin/modules', { method: 'POST', body: JSON.stringify(payload) }),
    updateAdminModule: (id, payload) => request(`/admin/modules/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteAdminModule: (id) => request(`/admin/modules/${id}`, { method: 'DELETE' }),
    
    getAdminTopics: (moduleId, page = 1) => request(`/admin/modules/${moduleId}/topics?page=${page}`),
    generateAiTopic: (payload) => request('/admin/topics/generate-ai', { method: 'POST', body: JSON.stringify(payload) }),
    createAdminTopic: (payload) => request('/admin/topics', { method: 'POST', body: JSON.stringify(payload) }),
    updateAdminTopic: (id, payload) => request(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteAdminTopic: (id) => request(`/admin/topics/${id}`, { method: 'DELETE' }),

    getAdminQuestions: (topicId, page = 1) => request(`/admin/topics/${topicId}/questions?page=${page}`),
    createAdminQuestion: (payload) => request('/admin/questions', { method: 'POST', body: JSON.stringify(payload) }),
    updateAdminQuestion: (id, payload) => request(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteAdminQuestion: (id) => request(`/admin/questions/${id}`, { method: 'DELETE' }),
    generateAiQuestions: (payload) => request('/admin/questions/generate-ai', { method: 'POST', body: JSON.stringify(payload) }),
    bulkCreateAdminQuestions: (payload) => request('/admin/questions/bulk', { method: 'POST', body: JSON.stringify(payload) }),

    getAdminStories: (page = 1) => request(`/admin/stories?page=${page}`),
    getAdminStoryDetail: (id) => request(`/admin/stories/${id}`),
    generateAiStory: (payload) => request('/admin/stories/generate-ai', { method: 'POST', body: JSON.stringify(payload) }),
    generateAiStoryImage: (payload) => request('/admin/stories/generate-image', { method: 'POST', body: JSON.stringify(payload) }),
    createAdminStory: (payload) => request('/admin/stories', { method: 'POST', body: JSON.stringify(payload) }),
    updateAdminStory: (id, payload) => request(`/admin/stories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteAdminStory: (id) => request(`/admin/stories/${id}`, { method: 'DELETE' }),
    addStoryVocabulary: (storyId, payload) => request(`/admin/stories/${storyId}/vocabularies`, { method: 'POST', body: JSON.stringify(payload) }),

    getAdminUsers: (role = null, page = 1) => request(`/admin/users?page=${page}${role ? `&role=${role}` : ''}`),
    suspendAdminUser: (id) => request(`/admin/users/${id}/suspend`, { method: 'PUT' }),

    getAdminBadges: () => request('/admin/badges'),
    getAdminBadgeDetail: (id) => request(`/admin/badges/${id}`),
    createAdminBadge: (payload) => request('/admin/badges', { method: 'POST', body: JSON.stringify(payload) }),
    updateAdminBadge: (id, payload) => request(`/admin/badges/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteAdminBadge: (id) => request(`/admin/badges/${id}`, { method: 'DELETE' }),

    uploadMedia: async (file) => {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/admin/media/upload`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Gagal mengunggah file.');
        }
        return data;
    },
};
