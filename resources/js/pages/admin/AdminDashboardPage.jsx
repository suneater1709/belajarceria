import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    LayoutDashboard, Layers, HelpCircle, BookOpen, Users, Award, 
    LogOut, Plus, Trash2, Edit, CheckCircle, XCircle, AlertCircle, 
    Loader2, Eye, Upload, Image as ImageIcon, X, Sparkles, ArrowLeft, RotateCcw,
    Menu
} from 'lucide-react';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import BadgeIcon from '../../components/common/BadgeIcon';
import AppIcon from '../../components/common/AppIcon';
import { sound } from '../../services/audio';
import { api, removeAuthToken } from '../../services/api';

const BADGE_ICONS = [
    { id: 'medal', icon: 'medal', label: 'Medali' },
    { id: 'star', icon: 'star', label: 'Bintang Emas' },
    { id: 'trophy', icon: 'trophy', label: 'Piala Juara' },
    { id: 'crown', icon: 'crown', label: 'Mahkota' },
    { id: 'target', icon: 'target', label: 'Target Sasaran' },
    { id: 'rocket', icon: 'rocket', label: 'Roket Penjelajah' },
    { id: 'calculator', icon: 'calculator', label: 'Kalkulator / Math' },
    { id: 'award', icon: 'award', label: 'Penghargaan' },
    { id: 'book-open', icon: 'book-open', label: 'Buku Ilmu' },
    { id: 'palette', icon: 'palette', label: 'Palet Seni' },
    { id: 'gem', icon: 'gem', label: 'Permata Cemerlang' },
    { id: 'sparkles', icon: 'sparkles', label: 'Kilau Bintang' },
    { id: 'lion', icon: '🦁', label: 'Singa Berani' },
    { id: 'owl', icon: '🦉', label: 'Burung Bijak' },
];

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data State
    const [summary, setSummary] = useState(null);
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [stories, setStories] = useState([]);
    const [users, setUsers] = useState([]);
    const [badges, setBadges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'question'|'topic'|'story'|'badge'|'suspend_user', id, name }

    // Topic Form & Modal State
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [topicModalMode, setTopicModalMode] = useState('create'); // 'create' | 'edit'
    const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
    const [topicForm, setTopicForm] = useState({
        id: null,
        module_id: '',
        name: '',
        description: '',
        icon: '📚',
        difficulty: 'mudah',
        min_age_level: '4-5',
        sort_order: 1,
        is_active: true,
    });

    // AI Topic Generator State
    const [isAiTopicModalOpen, setIsAiTopicModalOpen] = useState(false);
    const [isGeneratingAiTopic, setIsGeneratingAiTopic] = useState(false);
    const [isSavingAiTopic, setIsSavingAiTopic] = useState(false);
    const [aiTopicForm, setAiTopicForm] = useState({
        module_id: '',
        prompt: '',
        difficulty: 'mudah',
        min_age_level: '4-5',
    });
    const [generatedAiTopic, setGeneratedAiTopic] = useState(null);
    const [autoGenerateQuestions, setAutoGenerateQuestions] = useState(true);
    const [isQuickGeneratingQuestions, setIsQuickGeneratingQuestions] = useState(false);

    // Question Form & Image Upload & Edit & AI Generator
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [questionModalMode, setQuestionModalMode] = useState('create'); // 'create' | 'edit'
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isAiQuestionModalOpen, setIsAiQuestionModalOpen] = useState(false);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [isSavingAiBulk, setIsSavingAiBulk] = useState(false);
    const [aiForm, setAiForm] = useState({
        difficulty: 'mudah',
        count: 3,
        type: 'multiple_choice',
        prompt_hint: '',
    });
    const [generatedAiQuestions, setGeneratedAiQuestions] = useState([]);
    const [questionForm, setQuestionForm] = useState({
        id: null,
        topic_id: '',
        type: 'multiple_choice',
        question_text: '',
        question_image_url: '',
        points: 10,
        difficulty: 'mudah',
        explanation: '',
        status: 'published',
        options: [
            { option_text: '', is_correct: true, sort_order: 1 },
            { option_text: '', is_correct: false, sort_order: 2 },
            { option_text: '', is_correct: false, sort_order: 3 },
        ],
    });

    // Story CRUD Modals & State
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [storyModalMode, setStoryModalMode] = useState('create'); // 'create' | 'edit'
    const [isUploadingStoryCover, setIsUploadingStoryCover] = useState(false);
    const [isStoryDetailOpen, setIsStoryDetailOpen] = useState(false);
    const [selectedStoryDetail, setSelectedStoryDetail] = useState(null);
    const [isAiStoryModalOpen, setIsAiStoryModalOpen] = useState(false);
    const [isGeneratingAiStory, setIsGeneratingAiStory] = useState(false);
    const [isGeneratingStoryImage, setIsGeneratingStoryImage] = useState(false);
    const [generatedStoryImageUrl, setGeneratedStoryImageUrl] = useState('');
    const [storyImagePrompt, setStoryImagePrompt] = useState('');
    const [aiStoryForm, setAiStoryForm] = useState({
        module_id: '',
        theme: '',
        level: 'mudah',
    });
    const [generatedAiStory, setGeneratedAiStory] = useState(null);
    const [storyForm, setStoryForm] = useState({
        id: null,
        module_id: '',
        topic_id: '',
        title: '',
        description: '',
        content: '',
        cover_image_url: '',
        level: 'mudah',
        sort_order: 1,
        is_active: true,
        vocabularies: [{ word: '', meaning: '' }],
    });

    // Badge CRUD Modals & State
    const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
    const [badgeModalMode, setBadgeModalMode] = useState('create'); // 'create' | 'edit'
    const [badgeForm, setBadgeForm] = useState({
        id: null,
        name: '',
        description: '',
        icon: 'medal',
        criteria_type: 'total_stars',
        criteria_value: 10,
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [sumRes, modRes] = await Promise.all([
                api.getAdminSummary(),
                api.getAdminModules(),
            ]);
            setSummary(sumRes.data);
            setModules(modRes.data || []);
            if (modRes.data && modRes.data.length > 0) {
                const firstModId = modRes.data[0].id;
                setSelectedModuleId(firstModId);
                loadTopics(firstModId);
            }
        } catch (err) {
            console.error(err);
            if (err.status === 401) {
                navigate('/admin/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadTopics = async (moduleId) => {
        try {
            const res = await api.getAdminTopics(moduleId);
            setTopics(res.data || []);
            if (res.data && res.data.length > 0) {
                setSelectedTopicId(res.data[0].id);
                loadQuestions(res.data[0].id);
            } else {
                setQuestions([]);
                setSelectedTopicId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadQuestions = async (topicId) => {
        try {
            const res = await api.getAdminQuestions(topicId);
            setQuestions(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadStories = async () => {
        try {
            const res = await api.getAdminStories();
            setStories(res.data?.data || res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await api.getAdminUsers();
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadBadges = async () => {
        try {
            const res = await api.getAdminBadges();
            setBadges(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTabChange = (tab) => {
        sound.playPop();
        setActiveTab(tab);
        if (tab === 'stories') loadStories();
        if (tab === 'users') loadUsers();
        if (tab === 'badges') loadBadges();
    };

    // Logout
    const handleConfirmLogout = async () => {
        try {
            await api.logout();
        } catch (e) {}
        removeAuthToken();
        setIsLogoutOpen(false);
        navigate('/admin/login', { replace: true });
    };

    // Delete confirmation handler
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;

        try {
            if (type === 'question') {
                await api.deleteAdminQuestion(id);
                setQuestions(prev => prev.filter(q => q.id !== id));
            } else if (type === 'topic') {
                await api.deleteAdminTopic(id);
                setTopics(prev => prev.filter(t => t.id !== id));
                const modRes = await api.getAdminModules();
                setModules(modRes.data || []);
            } else if (type === 'story') {
                await api.deleteAdminStory(id);
                setStories(prev => prev.filter(s => s.id !== id));
            } else if (type === 'badge') {
                await api.deleteAdminBadge(id);
                setBadges(prev => prev.filter(b => b.id !== id));
            } else if (type === 'suspend_user') {
                await api.suspendAdminUser(id);
                loadUsers();
            }
            sound.playPop();
        } catch (err) {
            alert(err.message || 'Gagal menghapus item.');
        } finally {
            setItemToDelete(null);
        }
    };

    // Topic Handlers
    const handleOpenCreateTopic = (moduleId = null) => {
        sound.playPop();
        const targetModId = moduleId || selectedModuleId || (modules[0]?.id ?? '');
        setTopicModalMode('create');
        setTopicForm({
            id: null,
            module_id: targetModId,
            name: '',
            description: '',
            icon: '📚',
            difficulty: 'mudah',
            min_age_level: '4-5',
            sort_order: topics.length + 1,
            is_active: true,
        });
        setIsTopicModalOpen(true);
    };

    const handleOpenEditTopic = (t) => {
        sound.playPop();
        setTopicModalMode('edit');
        setTopicForm({
            id: t.id,
            module_id: t.module_id || selectedModuleId,
            name: t.name || '',
            description: t.description || '',
            icon: t.icon || '📚',
            difficulty: t.difficulty || 'mudah',
            min_age_level: t.min_age_level || '4-5',
            sort_order: t.sort_order || 1,
            is_active: t.is_active !== undefined ? Boolean(t.is_active) : true,
        });
        setIsTopicModalOpen(true);
    };

    const handleSaveTopic = async (e) => {
        e.preventDefault();
        try { sound.playPop(); } catch(e) {}
        setIsSubmittingTopic(true);

        try {
            if (topicModalMode === 'create') {
                await api.createAdminTopic(topicForm);
            } else {
                await api.updateAdminTopic(topicForm.id, topicForm);
            }
            setIsTopicModalOpen(false);
            loadTopics(topicForm.module_id || selectedModuleId);
            const modRes = await api.getAdminModules();
            setModules(modRes.data || []);
            try { sound.playCorrect(); } catch(e) {}
        } catch (err) {
            console.error('Topic save error:', err);
            const validationErrors = err.errors ? Object.values(err.errors).flat().join('\n') : '';
            alert(validationErrors || err.message || 'Gagal menyimpan topik.');
        } finally {
            setIsSubmittingTopic(false);
        }
    };

    // AI Topic Generator Handlers
    const handleOpenAiTopicModal = (moduleId = null) => {
        try { sound.playPop(); } catch (e) {}
        const targetModId = moduleId || selectedModuleId || (modules[0]?.id ?? '');
        setAiTopicForm({
            module_id: targetModId,
            prompt: '',
            difficulty: 'mudah',
            min_age_level: '4-5',
        });
        setGeneratedAiTopic(null);
        setIsAiTopicModalOpen(true);
    };

    const handleGenerateAiTopic = async (e) => {
        if (e) e.preventDefault();
        setIsGeneratingAiTopic(true);
        try { sound.playPop(); } catch (e) {}
        try {
            const res = await api.generateAiTopic({
                module_id: aiTopicForm.module_id,
                prompt: aiTopicForm.prompt,
                difficulty: aiTopicForm.difficulty,
                min_age_level: aiTopicForm.min_age_level,
            });
            if (res.data) {
                setGeneratedAiTopic(res.data);
                try { sound.playSparkle(); } catch (e) {}
            }
        } catch (err) {
            alert(err.message || 'Gagal menghasilkan topik AI.');
        } finally {
            setIsGeneratingAiTopic(false);
        }
    };

    const handleSaveGeneratedTopic = async () => {
        if (!generatedAiTopic) return;
        setIsSavingAiTopic(true);
        try { sound.playPop(); } catch (e) {}
        try {
            const res = await api.createAdminTopic({
                module_id: generatedAiTopic.module_id || aiTopicForm.module_id,
                name: generatedAiTopic.name,
                description: generatedAiTopic.description,
                icon: generatedAiTopic.icon || '📚',
                difficulty: generatedAiTopic.difficulty || 'mudah',
                min_age_level: generatedAiTopic.min_age_level || '4-5',
                sort_order: topics.length + 1,
                is_active: true,
                auto_generate_questions: autoGenerateQuestions,
                question_count: 5,
                prompt_hint: aiTopicForm.prompt || generatedAiTopic.name || '',
            });
            setIsAiTopicModalOpen(false);
            setGeneratedAiTopic(null);
            const targetModuleId = aiTopicForm.module_id || selectedModuleId;
            await loadTopics(targetModuleId);
            const modRes = await api.getAdminModules();
            setModules(modRes.data || []);
            if (res.data?.id) {
                setSelectedTopicId(res.data.id);
                await loadQuestions(res.data.id);
            }
            try { sound.playCorrect(); } catch (e) {}
        } catch (err) {
            alert(err.message || 'Gagal menyimpan topik.');
        } finally {
            setIsSavingAiTopic(false);
        }
    };

    const handleQuickGenerateAiQuestions = async (topicId) => {
        const targetTopicId = topicId || selectedTopicId;
        if (!targetTopicId) return;
        setIsQuickGeneratingQuestions(true);
        try { sound.playPop(); } catch (e) {}
        try {
            const currentTopic = topics.find(t => t.id === targetTopicId);
            const genRes = await api.generateAiQuestions({
                topic_id: targetTopicId,
                count: 5,
                difficulty: currentTopic?.difficulty || 'mudah',
                type: 'multiple_choice',
                prompt_hint: currentTopic?.name || '',
            });
            if (genRes.data && genRes.data.length > 0) {
                await api.bulkStoreAiQuestions({
                    topic_id: targetTopicId,
                    questions: genRes.data,
                });
                await loadQuestions(targetTopicId);
                const modRes = await api.getAdminModules();
                setModules(modRes.data || []);
                try { sound.playCorrect(); } catch (e) {}
            } else {
                alert('Tidak ada soal yang dihasilkan.');
            }
        } catch (err) {
            alert(err.message || 'Gagal membuat soal otomatis.');
        } finally {
            setIsQuickGeneratingQuestions(false);
        }
    };

    const handleEditGeneratedTopicInManualForm = () => {
        if (!generatedAiTopic) return;
        setIsAiTopicModalOpen(false);
        setTopicModalMode('create');
        setTopicForm({
            id: null,
            module_id: generatedAiTopic.module_id || aiTopicForm.module_id,
            name: generatedAiTopic.name || '',
            description: generatedAiTopic.description || '',
            icon: generatedAiTopic.icon || '📚',
            difficulty: generatedAiTopic.difficulty || 'mudah',
            min_age_level: generatedAiTopic.min_age_level || '4-5',
            sort_order: topics.length + 1,
            is_active: true,
        });
        setIsTopicModalOpen(true);
    };

    // Question Handlers
    const handleOpenCreateQuestion = () => {
        sound.playPop();
        setQuestionModalMode('create');
        setQuestionForm({
            id: null,
            topic_id: selectedTopicId,
            type: 'multiple_choice',
            question_text: '',
            question_image_url: '',
            points: 10,
            difficulty: 'mudah',
            explanation: '',
            status: 'published',
            options: [
                { option_text: '', is_correct: true, sort_order: 1 },
                { option_text: '', is_correct: false, sort_order: 2 },
                { option_text: '', is_correct: false, sort_order: 3 },
            ],
        });
        setIsQuestionModalOpen(true);
    };

    const handleOpenEditQuestion = (q) => {
        sound.playPop();
        setQuestionModalMode('edit');
        setQuestionForm({
            id: q.id,
            topic_id: q.topic_id,
            type: q.type || 'multiple_choice',
            question_text: q.question_text || '',
            question_image_url: q.question_image_url || '',
            points: q.points || 10,
            difficulty: q.difficulty || 'mudah',
            explanation: q.explanation || '',
            status: q.status || 'published',
            options: q.options && q.options.length > 0 
                ? q.options.map((opt, idx) => ({
                    id: opt.id,
                    option_text: opt.option_text,
                    is_correct: Boolean(opt.is_correct),
                    sort_order: opt.sort_order || (idx + 1)
                }))
                : [
                    { option_text: '', is_correct: true, sort_order: 1 },
                    { option_text: '', is_correct: false, sort_order: 2 },
                    { option_text: '', is_correct: false, sort_order: 3 },
                ]
        });
        setIsQuestionModalOpen(true);
    };

    const handleUploadQuestionImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB.');
            return;
        }

        setIsUploadingImage(true);
        sound.playPop();
        try {
            const res = await api.uploadMedia(file);
            if (res.data && res.data.url) {
                setQuestionForm(prev => ({ ...prev, question_image_url: res.data.url }));
            }
        } catch (err) {
            alert(err.message || 'Gagal mengunggah gambar.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        sound.playPop();

        try {
            if (questionModalMode === 'create') {
                const payload = {
                    ...questionForm,
                    topic_id: selectedTopicId,
                };
                await api.createAdminQuestion(payload);
            } else {
                await api.updateAdminQuestion(questionForm.id, questionForm);
            }
            setIsQuestionModalOpen(false);
            loadQuestions(selectedTopicId);
            sound.playCorrect();
        } catch (err) {
            alert(err.message || 'Gagal menyimpan soal.');
        }
    };

    // AI Question Generator Handlers
    const handleOpenAiModal = () => {
        try { sound.playPop(); } catch (e) {}
        setGeneratedAiQuestions([]);
        setAiForm({
            difficulty: 'mudah',
            count: 3,
            type: 'multiple_choice',
            prompt_hint: '', // Selalu kosong/bersih saat modal dibuka
        });
        setIsAiQuestionModalOpen(true);
    };

    const handleGenerateAi = async (e) => {
        e.preventDefault();
        setIsGeneratingAi(true);
        try { sound.playPop(); } catch (e) {}
        try {
            // Sertakan soal yang sudah pernah di-generate dalam sesi popup ini agar klik ulang tidak duplikat (§4.3)
            const previousQuestions = generatedAiQuestions && generatedAiQuestions.length > 0
                ? generatedAiQuestions.map(q => q.question_text).filter(Boolean)
                : [];

            const res = await api.generateAiQuestions({
                topic_id: selectedTopicId,
                count: aiForm.count,
                difficulty: aiForm.difficulty,
                type: aiForm.type,
                custom_prompt: aiForm.prompt_hint,
                prompt_hint: aiForm.prompt_hint,
                session_questions: previousQuestions,
            });
            if (res.data) {
                setGeneratedAiQuestions(res.data);
                try { sound.playSparkle(); } catch (e) {}
            }
        } catch (err) {
            alert(err.message || 'Gagal menghasilkan soal AI.');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleUpdateGeneratedQuestionText = (index, newText) => {
        const next = [...generatedAiQuestions];
        next[index] = { ...next[index], question_text: newText };
        setGeneratedAiQuestions(next);
    };

    const handleUpdateGeneratedOption = (qIndex, optIndex, newText) => {
        const next = [...generatedAiQuestions];
        const nextOptions = [...next[qIndex].options];
        nextOptions[optIndex] = { ...nextOptions[optIndex], option_text: newText };
        next[qIndex] = { ...next[qIndex], options: nextOptions };
        setGeneratedAiQuestions(next);
    };

    const handleSelectGeneratedCorrectOption = (qIndex, optIndex) => {
        const next = [...generatedAiQuestions];
        const nextOptions = next[qIndex].options.map((opt, i) => ({
            ...opt,
            is_correct: i === optIndex,
        }));
        next[qIndex] = { ...next[qIndex], options: nextOptions };
        setGeneratedAiQuestions(next);
    };

    const handleRemoveGeneratedQuestion = (index) => {
        try { sound.playPop(); } catch (e) {}
        setGeneratedAiQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveAiQuestionsBulk = async () => {
        if (!generatedAiQuestions || generatedAiQuestions.length === 0) {
            alert('Tidak ada soal hasil AI untuk disimpan.');
            return;
        }

        setIsSavingAiBulk(true);
        try { sound.playPop(); } catch (e) {}
        try {
            await api.bulkCreateAdminQuestions({
                topic_id: selectedTopicId,
                questions: generatedAiQuestions,
            });
            setIsAiQuestionModalOpen(false);
            setGeneratedAiQuestions([]);
            setAiForm(prev => ({ ...prev, prompt_hint: '' }));
            loadQuestions(selectedTopicId);
            try { sound.playCorrect(); } catch (e) {}
        } catch (err) {
            alert(err.message || 'Gagal menyimpan soal hasil AI.');
        } finally {
            setIsSavingAiBulk(false);
        }
    };

    // AI Story Handlers
    const handleOpenAiStoryModal = () => {
        sound.playPop();
        const ceritaMod = modules.find(m => m.code === 'cerita') || modules[0];
        setAiStoryForm({
            module_id: ceritaMod ? ceritaMod.id : (modules[0]?.id || ''),
            theme: '',
            level: 'mudah',
        });
        setGeneratedAiStory(null);
        setGeneratedStoryImageUrl('');
        setStoryImagePrompt('');
        setIsGeneratingStoryImage(false);
        setIsAiStoryModalOpen(true);
    };

    const handleGenerateStoryImage = async (title, description, theme, level, customSeed = null) => {
        setIsGeneratingStoryImage(true);
        try {
            const targetUsia = level === 'sulit' ? '7-8 tahun' : (level === 'sedang' ? '5-6 tahun' : '3-5 tahun');
            const imgRes = await api.generateAiStoryImage({
                title: title || aiStoryForm.theme || 'Cerita Ceria Anak',
                description: description || aiStoryForm.theme || '',
                theme: theme || aiStoryForm.theme || '',
                level: level || 'mudah',
                target_usia: targetUsia,
                seed: customSeed || Math.floor(Math.random() * 900000) + 1000,
            });
            if (imgRes.data?.image_url) {
                setGeneratedStoryImageUrl(imgRes.data.image_url);
                setStoryImagePrompt(imgRes.data.prompt || '');
                setGeneratedAiStory(prev => prev ? { ...prev, cover_image_url: imgRes.data.image_url } : prev);
            }
        } catch (err) {
            console.error('Gagal generate gambar cerita:', err);
        } finally {
            setIsGeneratingStoryImage(false);
        }
    };

    const handleGenerateAiStory = async (e) => {
        if (e) e.preventDefault();
        setIsGeneratingAiStory(true);
        setGeneratedStoryImageUrl('');
        setStoryImagePrompt('');
        sound.playPop();
        try {
            const res = await api.generateAiStory({
                module_id: aiStoryForm.module_id,
                theme: aiStoryForm.theme,
                level: aiStoryForm.level,
            });
            if (res.data) {
                setGeneratedAiStory(res.data);
                sound.playSparkle();
                // Generate gambar secara otomatis menyusul di latar belakang (non-blocking)
                handleGenerateStoryImage(res.data.title, res.data.description, aiStoryForm.theme, aiStoryForm.level);
            }
        } catch (err) {
            alert(err.message || 'Gagal menghasilkan cerita AI.');
        } finally {
            setIsGeneratingAiStory(false);
        }
    };

    const handleUpdateGeneratedStoryField = (field, value) => {
        setGeneratedAiStory(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleAddGeneratedStoryVocab = () => {
        sound.playPop();
        setGeneratedAiStory(prev => {
            if (!prev) return null;
            const vocabs = [...(prev.vocabularies || []), { word: '', meaning: '' }];
            return { ...prev, vocabularies: vocabs };
        });
    };

    const handleUpdateGeneratedStoryVocab = (idx, field, val) => {
        setGeneratedAiStory(prev => {
            if (!prev) return null;
            const vocabs = [...(prev.vocabularies || [])];
            vocabs[idx] = { ...vocabs[idx], [field]: val };
            return { ...prev, vocabularies: vocabs };
        });
    };

    const handleRemoveGeneratedStoryVocab = (idx) => {
        sound.playPop();
        setGeneratedAiStory(prev => {
            if (!prev) return null;
            return { ...prev, vocabularies: prev.vocabularies.filter((_, i) => i !== idx) };
        });
    };

    const handleSaveGeneratedStoryToForm = () => {
        if (!generatedAiStory) return;
        sound.playPop();
        setStoryModalMode('create');
        setStoryForm({
            id: null,
            module_id: aiStoryForm.module_id || (modules[0]?.id || ''),
            topic_id: '',
            title: generatedAiStory.title || '',
            description: generatedAiStory.description || '',
            content: generatedAiStory.content || '',
            cover_image_url: generatedStoryImageUrl || generatedAiStory.cover_image_url || '',
            level: generatedAiStory.level || 'mudah',
            sort_order: stories.length + 1,
            is_active: true,
            vocabularies: (generatedAiStory.vocabularies && generatedAiStory.vocabularies.length > 0)
                ? generatedAiStory.vocabularies
                : [{ word: '', meaning: '' }],
        });
        setIsAiStoryModalOpen(false);
        setIsStoryModalOpen(true);
    };

    // Story Handlers
    const handleOpenCreateStory = () => {
        sound.playPop();
        setStoryModalMode('create');
        setStoryForm({
            id: null,
            module_id: modules.length > 0 ? modules[0].id : '',
            topic_id: '',
            title: '',
            description: '',
            content: '',
            cover_image_url: '',
            level: 'mudah',
            sort_order: stories.length + 1,
            is_active: true,
            vocabularies: [{ word: '', meaning: '' }],
        });
        setIsStoryModalOpen(true);
    };

    const handleOpenEditStory = async (story) => {
        sound.playPop();
        setStoryModalMode('edit');
        try {
            const res = await api.getAdminStoryDetail(story.id);
            const data = res.data || story;
            setStoryForm({
                id: data.id,
                module_id: data.module_id,
                topic_id: data.topic_id || '',
                title: data.title,
                description: data.description || '',
                content: data.content || '',
                cover_image_url: data.cover_image_url || '',
                level: data.level || 'mudah',
                sort_order: data.sort_order || 0,
                is_active: Boolean(data.is_active),
                vocabularies: (data.vocabularies && data.vocabularies.length > 0)
                    ? data.vocabularies.map(v => ({ word: v.word, meaning: v.meaning }))
                    : [{ word: '', meaning: '' }],
            });
            setIsStoryModalOpen(true);
        } catch (err) {
            alert('Gagal mengambil data cerita: ' + err.message);
        }
    };

    const handleOpenDetailStory = async (story) => {
        sound.playPop();
        try {
            const res = await api.getAdminStoryDetail(story.id);
            setSelectedStoryDetail(res.data || story);
            setIsStoryDetailOpen(true);
        } catch (err) {
            setSelectedStoryDetail(story);
            setIsStoryDetailOpen(true);
        }
    };

    const handleUploadStoryCover = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB.');
            return;
        }

        setIsUploadingStoryCover(true);
        sound.playPop();
        try {
            const res = await api.uploadMedia(file);
            if (res.data && res.data.url) {
                setStoryForm(prev => ({ ...prev, cover_image_url: res.data.url }));
            }
        } catch (err) {
            alert(err.message || 'Gagal mengunggah cover cerita.');
        } finally {
            setIsUploadingStoryCover(false);
        }
    };

    const handleSaveStory = async (e) => {
        e.preventDefault();
        sound.playPop();

        const filteredVocabs = storyForm.vocabularies.filter(v => v.word.trim() && v.meaning.trim());

        const payload = {
            ...storyForm,
            vocabularies: filteredVocabs,
        };

        try {
            if (storyModalMode === 'create') {
                await api.createAdminStory(payload);
            } else {
                await api.updateAdminStory(storyForm.id, payload);
            }
            setIsStoryModalOpen(false);
            loadStories();
            sound.playCorrect();
        } catch (err) {
            alert(err.message || 'Gagal menyimpan cerita.');
        }
    };

    // Badge Handlers
    const handleOpenCreateBadge = () => {
        sound.playPop();
        setBadgeModalMode('create');
        setBadgeForm({
            id: null,
            name: '',
            description: '',
            icon: 'medal',
            criteria_type: 'total_stars',
            criteria_value: 10,
        });
        setIsBadgeModalOpen(true);
    };

    const handleOpenEditBadge = (b) => {
        sound.playPop();
        setBadgeModalMode('edit');
        setBadgeForm({
            id: b.id,
            name: b.name || '',
            description: b.description || '',
            icon: b.icon || 'medal',
            criteria_type: b.criteria_type || 'total_stars',
            criteria_value: b.criteria_value || 10,
        });
        setIsBadgeModalOpen(true);
    };

    const handleSaveBadge = async (e) => {
        e.preventDefault();
        sound.playPop();

        const payload = {
            name: badgeForm.name,
            description: badgeForm.description,
            icon: badgeForm.icon,
            criteria_type: badgeForm.criteria_type,
            criteria_value: badgeForm.criteria_value,
        };

        try {
            if (badgeModalMode === 'create') {
                await api.createAdminBadge(payload);
            } else {
                await api.updateAdminBadge(badgeForm.id, payload);
            }
            setIsBadgeModalOpen(false);
            loadBadges();
            sound.playCorrect();
        } catch (err) {
            alert(err.message || 'Gagal menyimpan lencana.');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex overflow-x-hidden">
            {/* Mobile Backdrop Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Left (Responsive: Drawer on Mobile, Sticky Column on Desktop) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out
                lg:static lg:translate-x-0 lg:z-auto lg:shrink-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Brand Header */}
                    <div className="h-16 sm:h-20 px-5 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
                        <Link 
                            to="/belajarceria" 
                            onClick={() => sound.playPop()}
                            className="flex items-center space-x-3 group min-w-0"
                            title="Ke Area Belajar Anak"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform overflow-hidden p-0.5 shrink-0">
                                <img 
                                    src="/belajarceria.png" 
                                    alt="Logo BelajarCeria" 
                                    className="w-full h-full object-contain" 
                                />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-black font-heading tracking-wide text-[#2E2A4A] group-hover:text-indigo-600 transition-colors truncate">
                                    BelajarCeria
                                </h1>
                                <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                                    CMS Admin
                                </span>
                            </div>
                        </Link>

                        {/* Close button for mobile */}
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Tutup Menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation list */}
                    <nav className="p-3 sm:p-4 space-y-1.5 flex-1">
                        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Menu Navigasi
                        </p>
                        {[
                            { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
                            { id: 'modules', label: '7 Modul & Topik', icon: Layers },
                            { id: 'questions', label: 'Bank Soal CMS', icon: HelpCircle },
                            { id: 'stories', label: 'Buku Cerita Digital', icon: BookOpen },
                            { id: 'users', label: 'Data Pengguna', icon: Users },
                            { id: 'badges', label: 'Master Lencana', icon: Award },
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        handleTabChange(tab.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200' 
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                        }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-heading tracking-wide text-sm truncate">{tab.label}</span>
                                    </div>
                                    {isActive && (
                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0 ml-2" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
                    <Link
                        to="/belajarceria"
                        onClick={() => sound.playPop()}
                        className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-2xs"
                    >
                        <ArrowLeft className="w-4 h-4 text-indigo-500" />
                        <span>Area Bermain Anak</span>
                    </Link>

                    <button
                        onClick={() => { sound.playPop(); setIsLogoutOpen(true); }}
                        className="w-full py-2.5 px-3 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Keluar dari Admin</span>
                    </button>
                </div>
            </aside>

            {/* Right Side Content Container */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC]">
                {/* Top Bar Header */}
                <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0">
                    <div className="flex items-center space-x-3 min-w-0">
                        {/* Hamburger Button on Mobile */}
                        <button
                            type="button"
                            onClick={() => { sound.playPop(); setIsSidebarOpen(true); }}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200/80 cursor-pointer shadow-2xs shrink-0"
                            title="Buka Menu Admin"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-black font-heading text-[#2E2A4A] tracking-tight truncate">
                                {[
                                    { id: 'overview', label: 'Ringkasan Statistik' },
                                    { id: 'modules', label: '7 Modul & Topik Pembelajaran' },
                                    { id: 'questions', label: 'Bank Soal CMS' },
                                    { id: 'stories', label: 'Buku Cerita Digital' },
                                    { id: 'users', label: 'Data Pengguna & Profil Anak' },
                                    { id: 'badges', label: 'Master Lencana & Reward' },
                                ].find(n => n.id === activeTab)?.label || 'Panel Admin'}
                            </h2>
                            <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate">
                                BelajarCeria CMS • Manajemen Pembelajaran Terpadu
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                        <Link
                            to="/belajarceria"
                            onClick={() => sound.playPop()}
                            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors hidden sm:flex items-center space-x-1.5 border border-indigo-100 shadow-2xs"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Area Bermain</span>
                        </Link>

                        <button
                            onClick={() => { sound.playPop(); setIsLogoutOpen(true); }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Logout Admin"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Main Tab Content */}
                <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {isLoading && !summary ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl h-28 flex flex-col justify-between shadow-xs">
                                        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                                        <div className="h-8 bg-slate-100 rounded w-1/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* 4 Metric Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pengguna</span>
                                        <h3 className="text-3xl font-black text-[#2E2A4A] mt-2 font-heading">
                                            {summary?.total_users ?? summary?.counts?.parents ?? 0}
                                        </h3>
                                        <span className="text-[11px] text-slate-400 mt-1 block">Akun orang tua terdaftar</span>
                                    </div>
                                    <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
                                        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total Profil Anak</span>
                                        <h3 className="text-3xl font-black text-indigo-600 mt-2 font-heading">
                                            {summary?.total_children ?? summary?.counts?.children ?? 0}
                                        </h3>
                                        <span className="text-[11px] text-slate-400 mt-1 block">Profil aktif di platform</span>
                                    </div>
                                    <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
                                        <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Total Soal Kuis</span>
                                        <h3 className="text-3xl font-black text-emerald-600 mt-2 font-heading">
                                            {summary?.total_questions ?? summary?.counts?.questions ?? 0}
                                        </h3>
                                        <span className="text-[11px] text-slate-400 mt-1 block">Soal interaktif tersedia</span>
                                    </div>
                                    <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
                                        <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Sesi Kuis Selesai</span>
                                        <h3 className="text-3xl font-black text-amber-600 mt-2 font-heading">
                                            {summary?.total_quiz_attempts ?? summary?.counts?.quiz_attempts ?? 0}
                                        </h3>
                                        <span className="text-[11px] text-slate-400 mt-1 block">Total pengerjaan kuis</span>
                                    </div>
                                </div>

                                {/* Ringkasan Ekstra: Modul & Cerita */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                                                    <Layers className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-[#2E2A4A] text-sm font-heading">7 Modul Pembelajaran</h3>
                                                    <p className="text-xs text-slate-500">Kurikulum terstruktur untuk anak usia 3–6 tahun</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleTabChange('modules')}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                                            >
                                                Kelola →
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {modules.slice(0, 4).map(m => (
                                                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                                                    <span className="font-bold text-slate-800">{m.name}</span>
                                                    <span className="text-slate-500 font-semibold">{m.topics_count ?? m.topics?.length ?? 0} Topik</span>
                                                </div>
                                            ))}
                                            {modules.length > 4 && (
                                                <p className="text-[11px] text-slate-400 text-center pt-1">+ {modules.length - 4} modul lainnya</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-[#2E2A4A] text-sm font-heading">Sistem Gamifikasi & Lencana</h3>
                                                    <p className="text-xs text-slate-500">Pemberian motivasi bintang dan lencana otomatis</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleTabChange('badges')}
                                                className="text-xs text-amber-600 hover:text-amber-700 font-bold cursor-pointer"
                                            >
                                                Lihat Lencana →
                                            </button>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Total Master Lencana:</span>
                                                <span className="font-bold text-amber-600">{badges.length || (summary?.counts?.badges ?? 0)} Lencana</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Total Buku Cerita Digital:</span>
                                                <span className="font-bold text-purple-600">{summary?.total_stories ?? summary?.counts?.stories ?? 0} Cerita</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Status Server & Database:</span>
                                                <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span>Terhubung (MySQL)</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* TAB 2: MODUL & TOPIK */}
                {activeTab === 'modules' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold font-heading text-[#2E2A4A]">7 Modul Pembelajaran & Manajemen Topik</h2>
                                <p className="text-xs text-slate-500">Pilih salah satu modul di bawah untuk melihat dan mengelola topik pembelajaran.</p>
                            </div>
                        </div>

                        {/* Grid 7 Modul */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {modules.map(mod => {
                                const isSelected = selectedModuleId === mod.id;
                                return (
                                    <div
                                        key={mod.id}
                                        onClick={() => {
                                            sound.playPop();
                                            setSelectedModuleId(mod.id);
                                            loadTopics(mod.id);
                                        }}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md text-slate-900'
                                                : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-xs text-slate-800'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                                                    <AppIcon icon={mod.icon} className="w-5 h-5" emojiSize="text-xl" />
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {mod.code === 'cerita' ? `${stories.length || summary?.total_stories || 0} Cerita Digital` : `${mod.topics_count || 0} Topik`}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-[#2E2A4A] font-heading">{mod.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mod.description}</p>
                                        </div>
                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400">Kode: {mod.code}</span>
                                            <span className={`font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                {isSelected ? 'Sedang Dipilih ✓' : 'Pilih Modul →'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Detail Topik pada Modul Terpilih */}
                        {(() => {
                            const currentMod = modules.find(m => m.id === selectedModuleId) || modules[0];
                            const isCeritaMod = currentMod?.code === 'cerita';

                            if (isCeritaMod) {
                                return (
                                    <div className="bg-purple-50/70 border-2 border-purple-200/90 rounded-3xl p-8 text-center space-y-4 shadow-xs">
                                        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[#2E2A4A] font-heading">
                                                Modul Cerita Anak Digital
                                            </h3>
                                            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed mt-1.5 font-medium">
                                                Modul ini dirancang khusus untuk cerita interaktif digital ramah anak dan pengenalan kosakata baru tanpa sistem kuis atau topik berjenjang.
                                            </p>
                                        </div>
                                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                            <button
                                                onClick={() => {
                                                    sound.playPop();
                                                    setActiveTab('stories');
                                                }}
                                                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-500/20 inline-flex items-center space-x-2 cursor-pointer transition-transform hover:scale-105"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                <span>Buka Manajemen Buku Cerita Digital ({stories.length} Cerita)</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                                                <AppIcon icon={currentMod?.icon} className="w-7 h-7" emojiSize="text-2xl" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-lg font-black text-[#2E2A4A] font-heading">
                                                        Daftar Topik: {currentMod?.name || 'Pilih Modul'}
                                                    </h3>
                                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                                        {topics.length} Topik Tersedia
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {currentMod?.description || 'Kelola dan atur topik pembelajaran di modul ini.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenAiTopicModal(currentMod?.id)}
                                                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center space-x-1.5 cursor-pointer transition-all w-fit"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                <span>Generate Topik</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenCreateTopic(currentMod?.id)}
                                                className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 flex items-center space-x-1.5 cursor-pointer transition-all w-fit"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Tambah Topik</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* List / Grid Topik */}
                                    {topics.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                            <p className="text-slate-600 font-medium">Belum ada topik pada modul <span className="text-slate-900 font-bold">"{currentMod?.name}"</span>.</p>
                                            <div className="mt-3 flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenAiTopicModal(currentMod?.id)}
                                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>Generate Topik AI</span>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenCreateTopic(currentMod?.id)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span>Tambah Manual</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                            {topics.map(t => (
                                                <div
                                                    key={t.id}
                                                    className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition-all group"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex items-center space-x-2.5">
                                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
                                                                    <AppIcon icon={t.icon} className="w-5 h-5" emojiSize="text-xl" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                        {t.name}
                                                                    </h4>
                                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                            t.difficulty === 'sulit' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                                            t.difficulty === 'sedang' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        }`}>
                                                                            {t.difficulty || 'mudah'}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                                                            Usia {t.min_age_level || '4-5'} th
                                                                        </span>
                                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-400">
                                                                            #{t.sort_order ?? 1}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                t.is_active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                {t.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                                            {t.description || 'Tidak ada deskripsi topik.'}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                                                        <button
                                                            onClick={() => {
                                                                sound.playPop();
                                                                setSelectedModuleId(t.module_id || currentMod?.id);
                                                                setSelectedTopicId(t.id);
                                                                loadQuestions(t.id);
                                                                setActiveTab('questions');
                                                            }}
                                                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors border border-slate-200"
                                                            title="Buka Bank Soal Topik ini"
                                                        >
                                                            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                                                            <span>Bank Soal</span>
                                                        </button>

                                                        <div className="flex items-center space-x-1.5">
                                                            <button
                                                                onClick={() => handleOpenEditTopic(t)}
                                                                className="p-1.5 rounded-lg bg-white text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                                                                title="Edit Topik"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    sound.playPop();
                                                                    setItemToDelete({
                                                                        type: 'topic',
                                                                        id: t.id,
                                                                        name: `Topik: "${t.name}"`,
                                                                    });
                                                                }}
                                                                className="p-1.5 rounded-lg bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                                                                title="Hapus Topik"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* TAB 3: BANK SOAL CMS */}
                {activeTab === 'questions' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold font-heading text-[#2E2A4A]">Bank Soal Kuis</h2>
                                <p className="text-xs text-slate-500">Kelola soal interaktif manual atau buat otomatis dengan AI.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleOpenAiModal}
                                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-105"
                                    title="Generate soal otomatis dengan AI"
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                    <span>✨ Buat Soal AI</span>
                                </button>
                                <button
                                    onClick={handleOpenCreateQuestion}
                                    className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center space-x-1.5 cursor-pointer transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Tambah Soal</span>
                                </button>
                            </div>
                        </div>

                        {/* Pemilih Modul */}
                        <div className="flex flex-wrap gap-2">
                            {modules.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setSelectedModuleId(m.id);
                                        loadTopics(m.id);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        selectedModuleId === m.id 
                                            ? 'bg-indigo-600 text-white shadow-xs' 
                                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>

                        {/* Pemilih Topik */}
                        {topics.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80">
                                {topics.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setSelectedTopicId(t.id);
                                            loadQuestions(t.id);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            selectedTopicId === t.id 
                                                ? 'bg-amber-500 text-white shadow-xs' 
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Daftar Soal dalam Topik */}
                        <div className="space-y-3 mt-4">
                            {questions.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-white border border-slate-200/80 rounded-3xl shadow-xs space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto text-xl">
                                        ✨
                                    </div>
                                    <div className="max-w-md mx-auto space-y-1">
                                        <h4 className="text-base font-bold text-slate-800 font-heading">
                                            Belum Ada Soal pada Topik Ini
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Buat 5 butir soal kuis otomatis yang disesuaikan secara cerdas dengan topik ini, atau tambahkan soal secara manual.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            disabled={isQuickGeneratingQuestions}
                                            onClick={() => handleQuickGenerateAiQuestions(selectedTopicId)}
                                            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-200 cursor-pointer flex items-center space-x-1.5 transition-all disabled:opacity-50"
                                        >
                                            {isQuickGeneratingQuestions ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Membuat 5 Soal AI...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>✨ Auto-Generate 5 Soal AI</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleOpenCreateQuestion}
                                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center space-x-1.5 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Tambah Soal Manual</span>
                                        </button>
                                    </div>
                                </div>
                            ) : questions.map((q, idx) => (
                                <div key={q.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                                    {q.type}
                                                </span>
                                                <span className="text-xs text-slate-500 font-bold">{q.points} Poin</span>
                                                <span className="text-xs text-amber-600 font-semibold capitalize">Kesulitan: {q.difficulty}</span>
                                            </div>
                                            <h4 className="text-base font-bold text-[#2E2A4A] font-heading">
                                                {idx + 1}. {q.question_text}
                                            </h4>
                                            {q.explanation && (
                                                <p className="text-xs text-slate-500 mt-1 italic">
                                                    💡 Penjelasan: {q.explanation}
                                                </p>
                                            )}
                                            {q.question_image_url && (
                                                <div className="mt-3">
                                                    <img 
                                                        src={q.question_image_url} 
                                                        alt="Gambar Soal" 
                                                        className="max-h-32 rounded-xl object-contain border border-slate-200 bg-slate-50"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-1 shrink-0">
                                            <button
                                                onClick={() => handleOpenEditQuestion(q)}
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                                title="Edit Soal"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setItemToDelete({ type: 'question', id: q.id, name: q.question_text })}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                title="Hapus Soal (Soft Delete)"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Opsi Jawaban */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                                        {q.options && q.options.map(opt => (
                                            <div key={opt.id} className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                                opt.is_correct 
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' 
                                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                            }`}>
                                                <span>{opt.option_text}</span>
                                                {opt.is_correct && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: BUKU CERITA DIGITAL */}
                {activeTab === 'stories' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold font-heading text-[#2E2A4A]">Manajemen Cerita Anak</h2>
                                <p className="text-xs text-slate-500">Kelola buku cerita interaktif digital dan kosakata baru.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <button
                                    onClick={handleOpenAiStoryModal}
                                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer transition-all"
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                    <span>Buatkan dengan AI</span>
                                </button>
                                <button
                                    onClick={handleOpenCreateStory}
                                    className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 flex items-center space-x-1.5 cursor-pointer transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Tambah Cerita Baru</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {stories.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                                    Belum ada buku cerita digital. Klik "Tambah Cerita Baru" untuk menambahkan.
                                </div>
                            ) : stories.map(s => (
                                <div key={s.id} className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
                                    <div>
                                        {s.cover_image_url ? (
                                            <div className="h-40 rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-200">
                                                <img 
                                                    src={s.cover_image_url} 
                                                    alt={s.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-32 rounded-2xl bg-gradient-to-tr from-purple-50 to-indigo-50 flex items-center justify-center text-4xl mb-3 border border-purple-200">
                                                📖
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                                {s.level || 'mudah'}
                                            </span>
                                            {s.module && (
                                                <span className="text-[11px] text-slate-500 font-semibold">
                                                    {s.module.name}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-[#2E2A4A] font-heading mt-1">{s.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs text-purple-600 font-bold">
                                            {s.vocabularies_count ?? (s.vocabularies ? s.vocabularies.length : 0)} Kosakata
                                        </span>

                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={() => handleOpenDetailStory(s)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                                                title="Lihat Detail Cerita"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleOpenEditStory(s)}
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                                title="Edit Cerita"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => setItemToDelete({ type: 'story', id: s.id, name: s.title })}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                title="Hapus Cerita"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 5: DATA PENGGUNA */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold font-heading text-[#2E2A4A]">Akun Pengguna</h2>
                        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-x-auto shadow-xs">
                            <table className="w-full text-left text-xs min-w-[580px]">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-4">Nama</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Anak</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-4 font-bold text-[#2E2A4A]">{u.name}</td>
                                            <td className="p-4 text-slate-600 font-medium">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                                    u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500">{u.children_count ?? 0} Anak</td>
                                            <td className="p-4 text-right">
                                                {u.role !== 'admin' && (
                                                    <button
                                                        onClick={() => setItemToDelete({ type: 'suspend_user', id: u.id, name: u.name })}
                                                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                                                    >
                                                        Cabut Sesi (Suspend)
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 6: MASTER LENCANA */}
                {activeTab === 'badges' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold font-heading text-[#2E2A4A]">Master Lencana (Badges)</h2>
                            <button
                                onClick={handleOpenCreateBadge}
                                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-200 flex items-center space-x-1.5 cursor-pointer transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Lencana Baru</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {badges.map(b => (
                                <div key={b.id} className="bg-white border border-slate-200/80 p-5 rounded-3xl text-center flex flex-col justify-between group hover:border-amber-300 shadow-xs transition-all">
                                    <div>
                                        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 flex items-center justify-center mb-3 border border-amber-200 group-hover:scale-105 transition-transform shadow-inner">
                                            <BadgeIcon icon={b.icon} className="w-8 h-8 text-amber-500" emojiSize="text-3xl" />
                                        </div>
                                        <h3 className="text-sm font-bold text-[#2E2A4A] font-heading">{b.name}</h3>
                                        <p className="text-[11px] text-slate-500 mt-1">{b.description}</p>
                                        <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full inline-block font-semibold">
                                            Syarat: {b.criteria_type} ({b.criteria_value})
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center space-x-2">
                                        <button
                                            onClick={() => handleOpenEditBadge(b)}
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                            title="Edit Lencana"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setItemToDelete({ type: 'badge', id: b.id, name: b.name })}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title="Hapus Lencana"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            </div>

            {/* MODAL KONFIRMASI LOGOUT */}
            <ConfirmationModal
                isOpen={isLogoutOpen}
                title="Keluar dari Panel Admin?"
                description="Sesi admin Anda akan berakhir dan Anda harus memasukkan kredensial admin kembali."
                confirmText="Keluar"
                isDanger={false}
                onConfirm={handleConfirmLogout}
                onCancel={() => setIsLogoutOpen(false)}
            />

            {/* MODAL KONFIRMASI HAPUS */}
            <ConfirmationModal
                isOpen={!!itemToDelete}
                title={`Hapus / Nonaktifkan "${itemToDelete ? itemToDelete.name : ''}"?`}
                description="Aksi ini akan menghapus data dari sistem. Konfirmasi untuk melanjutkan penghapusan."
                confirmText="Hapus Permanen"
                isDanger={true}
                onConfirm={handleConfirmDelete}
                onCancel={() => setItemToDelete(null)}
            />

            {/* MODAL FORM TAMBAH / EDIT SOAL */}
            {isQuestionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h3 className="text-xl font-bold font-heading text-[#2E2A4A]">
                                {questionModalMode === 'edit' ? 'Edit Soal Bank Kuis' : 'Tambah Soal Baru ke Bank Soal'}
                            </h3>
                            <button
                                onClick={() => setIsQuestionModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teks Pertanyaan</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={questionForm.question_text}
                                    onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Contoh: Berapakah hasil dari 2 + 3?"
                                />
                            </div>

                            {/* Lampiran Gambar Soal */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Lampiran Gambar Soal (Opsional)
                                </label>
                                
                                {questionForm.question_image_url ? (
                                    <div className="relative border border-slate-200 bg-slate-50 rounded-2xl p-3 flex items-center space-x-4">
                                        <img 
                                            src={questionForm.question_image_url} 
                                            alt="Preview Soal" 
                                            className="h-20 w-24 object-contain rounded-xl bg-white p-1 border border-slate-200"
                                        />
                                        <div className="flex-1 text-xs">
                                            <span className="text-emerald-600 font-bold block mb-1">✓ Gambar Siap Digunakan</span>
                                            <button
                                                type="button"
                                                onClick={() => { sound.playPop(); setQuestionForm(prev => ({ ...prev, question_image_url: '' })); }}
                                                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center space-x-1 cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Hapus Gambar</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-slate-400 transition-colors bg-slate-50/50">
                                        <input
                                            type="file"
                                            id="question-image-file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleUploadQuestionImage}
                                            className="hidden"
                                        />
                                        <label htmlFor="question-image-file" className="cursor-pointer flex flex-col items-center">
                                            {isUploadingImage ? (
                                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-1" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                            )}
                                            <span className="text-xs font-bold text-slate-700">
                                                {isUploadingImage ? 'Mengunggah gambar...' : 'Klik untuk Upload Gambar (JPG/PNG/WEBP, Maks 2MB)'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-0.5">
                                                Gambar akan ditampilkan di kuis petualangan anak
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tingkat Kesulitan</label>
                                    <select
                                        value={questionForm.difficulty}
                                        onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                                    >
                                        <option value="mudah">Mudah</option>
                                        <option value="sedang">Sedang</option>
                                        <option value="sulit">Sulit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Poin Nilai</label>
                                    <input
                                        type="number"
                                        value={questionForm.points}
                                        onChange={e => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 10 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Penjelasan Singkat (Opsional)</label>
                                <input
                                    type="text"
                                    value={questionForm.explanation}
                                    onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                                    placeholder="Contoh: 2 ditambah 3 hasilnya adalah 5."
                                />
                            </div>

                            {/* Opsi Jawaban */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                                    Opsi Jawaban (Pilih 1 Jawaban Benar)
                                </label>
                                <div className="space-y-2">
                                    {questionForm.options.map((opt, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="correct_option"
                                                checked={opt.is_correct}
                                                onChange={() => {
                                                    const nextOpts = questionForm.options.map((o, i) => ({
                                                        ...o,
                                                        is_correct: i === idx
                                                    }));
                                                    setQuestionForm({ ...questionForm, options: nextOpts });
                                                }}
                                                className="w-4 h-4 text-indigo-600 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                required
                                                placeholder={`Opsi ${idx + 1}`}
                                                value={opt.option_text}
                                                onChange={e => {
                                                    const nextOpts = [...questionForm.options];
                                                    nextOpts[idx].option_text = e.target.value;
                                                    setQuestionForm({ ...questionForm, options: nextOpts });
                                                }}
                                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsQuestionModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 cursor-pointer"
                                >
                                    {questionModalMode === 'edit' ? 'Simpan Perubahan' : 'Simpan Soal ke CMS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL GENERATOR SOAL DENGAN AI */}
            {isAiQuestionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black shadow-md shadow-amber-500/20">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-heading text-[#2E2A4A]">Generator Bank Soal AI</h3>
                                    <p className="text-xs text-slate-500">
                                        Topik: <span className="text-indigo-600 font-bold">{topics.find(t => t.id === selectedTopicId)?.name || 'Pilih Topik'}</span> ({modules.find(m => m.id === selectedModuleId)?.name || 'Modul'})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAiQuestionModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* AI Param Form */}
                        <form onSubmit={handleGenerateAi} className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jumlah Soal</label>
                                    <select
                                        value={aiForm.count}
                                        onChange={e => setAiForm({ ...aiForm, count: parseInt(e.target.value) || 3 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                                    >
                                        <option value={1}>1 Soal (Kilat)</option>
                                        <option value={3}>3 Soal (Rekomendasi Hemat)</option>
                                        <option value={5}>5 Soal (Lengkap)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tingkat Kesulitan</label>
                                    <select
                                        value={aiForm.difficulty}
                                        onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                                    >
                                        <option value="mudah">Mudah (Anak TK/SD Awal)</option>
                                        <option value="sedang">Sedang (SD Kelas 1-3)</option>
                                        <option value="sulit">Sulit (Tantangan Ekstra)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Instruksi Tambahan</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Soal bergambar hewan"
                                        value={aiForm.prompt_hint}
                                        onChange={e => setAiForm({ ...aiForm, prompt_hint: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isGeneratingAi}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                            >
                                {isGeneratingAi ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sedang Menghasilkan Soal AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Generate Soal Otomatis Sekarang</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* List Soal Hasil Generate */}
                        {generatedAiQuestions.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="text-sm font-bold text-[#2E2A4A] font-heading">
                                    Hasil Soal AI ({generatedAiQuestions.length} Soal Siap Disimpan):
                                </h4>

                                <div className="space-y-3">
                                    {generatedAiQuestions.map((gq, qIdx) => (
                                        <div key={qIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <input
                                                    type="text"
                                                    value={gq.question_text}
                                                    onChange={e => handleUpdateGeneratedQuestionText(qIdx, e.target.value)}
                                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                                />
                                                <button
                                                    onClick={() => handleRemoveGeneratedQuestion(qIdx)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 ml-2"
                                                    title="Hapus soal ini"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Opsi Soal AI */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                                {gq.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex items-center space-x-1.5">
                                                        <input
                                                            type="radio"
                                                            name={`ai_correct_${qIdx}`}
                                                            checked={opt.is_correct}
                                                            onChange={() => handleSelectGeneratedCorrectOption(qIdx, oIdx)}
                                                            className="w-3.5 h-3.5 text-emerald-600 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt.option_text}
                                                            onChange={e => handleUpdateGeneratedOption(qIdx, oIdx, e.target.value)}
                                                            className={`flex-1 px-2 py-1 rounded-lg text-[11px] border ${
                                                                opt.is_correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-700'
                                                            }`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end space-x-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAiQuestionModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveAiQuestionsBulk}
                                        disabled={isSavingAiBulk}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                                    >
                                        {isSavingAiBulk && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Simpan Semua Soal ke Bank Soal</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL FORM TAMBAH / EDIT CERITA */}
            {isStoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h3 className="text-xl font-bold font-heading text-[#2E2A4A]">
                                {storyModalMode === 'create' ? 'Tambah Cerita Anak Baru' : 'Edit Cerita Anak'}
                            </h3>
                            <button
                                onClick={() => setIsStoryModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveStory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Judul Cerita</label>
                                <input
                                    type="text"
                                    required
                                    value={storyForm.title}
                                    onChange={e => setStoryForm({ ...storyForm, title: e.target.value })}
                                    placeholder="Contoh: Petualangan Kucing Cerdas Mencari Bintang"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi / Sinopsis</label>
                                <textarea
                                    rows={2}
                                    value={storyForm.description}
                                    onChange={e => setStoryForm({ ...storyForm, description: e.target.value })}
                                    placeholder="Ringkasan singkat cerita untuk pengantar pembaca..."
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Isi Cerita Lengkap (Multi-Paragraf)</label>
                                <textarea
                                    rows={5}
                                    value={storyForm.content}
                                    onChange={e => setStoryForm({ ...storyForm, content: e.target.value })}
                                    placeholder="Tuliskan isi cerita anak di sini..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:bg-white"
                                />
                            </div>

                            {/* Cover / Gambar Ilustrasi */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cover / Ilustrasi Cerita</label>
                                {storyForm.cover_image_url ? (
                                    <div className="border border-slate-200 bg-slate-50 rounded-2xl p-3 flex items-center space-x-4">
                                        <img 
                                            src={storyForm.cover_image_url} 
                                            alt="Preview Cover" 
                                            className="h-20 w-24 object-cover rounded-xl border border-slate-200"
                                        />
                                        <div className="flex-1">
                                            <span className="text-emerald-600 font-bold text-xs block mb-1">✓ Cover Terpasang</span>
                                            <button
                                                type="button"
                                                onClick={() => setStoryForm(prev => ({ ...prev, cover_image_url: '' }))}
                                                className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                                            >
                                                Hapus Cover
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50/50">
                                        <input
                                            type="file"
                                            id="story-cover-file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleUploadStoryCover}
                                            className="hidden"
                                        />
                                        <label htmlFor="story-cover-file" className="cursor-pointer flex flex-col items-center">
                                            {isUploadingStoryCover ? (
                                                <Loader2 className="w-6 h-6 text-purple-500 animate-spin mb-1" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                            )}
                                            <span className="text-xs font-bold text-slate-700">
                                                {isUploadingStoryCover ? 'Mengunggah cover...' : 'Upload Cover Cerita (JPG/PNG/WEBP)'}
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Kosakata Terkait Cerita */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Kosakata Terkait</label>
                                    <button
                                        type="button"
                                        onClick={() => setStoryForm(prev => ({ ...prev, vocabularies: [...prev.vocabularies, { word: '', meaning: '' }] }))}
                                        className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center space-x-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Tambah Kata</span>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {storyForm.vocabularies.map((v, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                placeholder="Kata (misal: Bintang)"
                                                value={v.word}
                                                onChange={e => {
                                                    const nextV = [...storyForm.vocabularies];
                                                    nextV[idx].word = e.target.value;
                                                    setStoryForm({ ...storyForm, vocabularies: nextV });
                                                }}
                                                className="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Arti kata"
                                                value={v.meaning}
                                                onChange={e => {
                                                    const nextV = [...storyForm.vocabularies];
                                                    nextV[idx].meaning = e.target.value;
                                                    setStoryForm({ ...storyForm, vocabularies: nextV });
                                                }}
                                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                                            />
                                            {storyForm.vocabularies.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setStoryForm(prev => ({ ...prev, vocabularies: prev.vocabularies.filter((_, i) => i !== idx) }))}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsStoryModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 cursor-pointer"
                                >
                                    {storyModalMode === 'create' ? 'Simpan Cerita Baru' : 'Perbarui Cerita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL CERITA */}
            {isStoryDetailOpen && selectedStoryDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <span className="text-xs uppercase font-bold text-purple-600">Detail Cerita Digital</span>
                            <button
                                onClick={() => setIsStoryDetailOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {selectedStoryDetail.cover_image_url && (
                            <div className="h-48 rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-200">
                                <img 
                                    src={selectedStoryDetail.cover_image_url} 
                                    alt={selectedStoryDetail.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <h2 className="text-2xl font-black font-heading text-[#2E2A4A]">{selectedStoryDetail.title}</h2>
                        
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                Tingkat: {selectedStoryDetail.level}
                            </span>
                            {selectedStoryDetail.module && (
                                <span className="text-xs text-slate-500 font-medium">
                                    Modul: {selectedStoryDetail.module.name}
                                </span>
                            )}
                        </div>

                        <div className="mt-4">
                            <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Sinopsis</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                {selectedStoryDetail.description || 'Tidak ada sinopsis.'}
                            </p>
                        </div>

                        {selectedStoryDetail.content && (
                            <div className="mt-4">
                                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Isi Cerita Lengkap</h4>
                                <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line">
                                    {selectedStoryDetail.content}
                                </div>
                            </div>
                        )}

                        {selectedStoryDetail.vocabularies && selectedStoryDetail.vocabularies.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Kosakata Terkait</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedStoryDetail.vocabularies.map((v, i) => (
                                        <div key={i} className="bg-purple-50/70 border border-purple-200 p-2.5 rounded-xl text-xs">
                                            <span className="font-bold text-purple-900 block">{v.word}</span>
                                            <span className="text-purple-700">{v.meaning}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsStoryDetailOpen(false)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORM TAMBAH / EDIT LENCANA */}
            {isBadgeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h3 className="text-xl font-bold font-heading text-[#2E2A4A]">
                                {badgeModalMode === 'create' ? 'Tambah Master Lencana' : 'Edit Lencana'}
                            </h3>
                            <button
                                onClick={() => setIsBadgeModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBadge} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lencana</label>
                                <input
                                    type="text"
                                    required
                                    value={badgeForm.name}
                                    onChange={e => setBadgeForm({ ...badgeForm, name: e.target.value })}
                                    placeholder="Contoh: Bintang Matematika Ceria"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi Syarat</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={badgeForm.description}
                                    onChange={e => setBadgeForm({ ...badgeForm, description: e.target.value })}
                                    placeholder="Contoh: Selesaikan seluruh topik pada modul Matematika Ceria!"
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                                />
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                                    Pilih Icon Lencana (Klik untuk Memilih)
                                </label>
                                <div className="grid grid-cols-7 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    {BADGE_ICONS.map(ic => (
                                        <button
                                            key={ic.id}
                                            type="button"
                                            onClick={() => { sound.playPop(); setBadgeForm({ ...badgeForm, icon: ic.icon }); }}
                                            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                                                badgeForm.icon === ic.icon 
                                                    ? 'bg-amber-100 border-amber-500 scale-110 shadow-xs' 
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                            title={ic.label}
                                        >
                                            <BadgeIcon icon={ic.icon} className="w-5 h-5 text-amber-500" emojiSize="text-xl" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trigger Criteria */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Syarat Pemicu</label>
                                    <select
                                        value={badgeForm.criteria_type}
                                        onChange={e => setBadgeForm({ ...badgeForm, criteria_type: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                                    >
                                        <option value="total_stars">Kumpulkan X Bintang</option>
                                        <option value="perfect_score">Skor 100 di Kuis</option>
                                        <option value="module_complete">Selesaikan Modul</option>
                                        <option value="topic_streak">Streak Topik</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nilai Target</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={badgeForm.criteria_value}
                                        onChange={e => setBadgeForm({ ...badgeForm, criteria_value: parseInt(e.target.value, 10) || 1 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsBadgeModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-200 cursor-pointer"
                                >
                                    {badgeModalMode === 'create' ? 'Simpan Lencana' : 'Perbarui Lencana'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL GENERATE TOPIK AI */}
            {isAiTopicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black shadow-md shadow-amber-500/20">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-heading text-[#2E2A4A]">Generate Topik AI</h3>
                                    <p className="text-xs text-slate-500">
                                        Modul: <span className="text-indigo-600 font-bold">{modules.find(m => m.id == aiTopicForm.module_id)?.name || 'Pilih Modul'}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAiTopicModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Parameter AI Topic */}
                        <form onSubmit={handleGenerateAiTopic} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                                    Pilih Modul Target <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={aiTopicForm.module_id}
                                    onChange={e => setAiTopicForm({ ...aiTopicForm, module_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="" disabled>-- Pilih Modul --</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                                    Ide / Kata Kunci Topik (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Angka Arab 1-10, Huruf Dal sampai Ro, Benda di Kelas"
                                    value={aiTopicForm.prompt}
                                    onChange={e => setAiTopicForm({ ...aiTopicForm, prompt: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Kosongkan jika ingin AI menyusun ide topik kurikulum terbaik secara otomatis.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tingkat Kesulitan</label>
                                    <select
                                        value={aiTopicForm.difficulty}
                                        onChange={e => setAiTopicForm({ ...aiTopicForm, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                                    >
                                        <option value="mudah">🟢 Mudah (Pemula)</option>
                                        <option value="sedang">🟡 Sedang (Menengah)</option>
                                        <option value="sulit">🔴 Sulit (Tantangan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Usia Anak</label>
                                    <select
                                        value={aiTopicForm.min_age_level}
                                        onChange={e => setAiTopicForm({ ...aiTopicForm, min_age_level: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                                    >
                                        <option value="4-5">Usia 4 - 5 Tahun (PAUD / TK-A)</option>
                                        <option value="6-7">Usia 6 - 7 Tahun (TK-B / SD 1)</option>
                                        <option value="8">Usia 8+ Tahun</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isGeneratingAiTopic}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                            >
                                {isGeneratingAiTopic ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sedang Menyusun Topik AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Generate Topik Sekarang</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Hasil Topik AI */}
                        {generatedAiTopic && (
                            <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Hasil Generate Topik:
                                </h4>

                                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                                            {generatedAiTopic.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                <h4 className="text-sm font-bold text-slate-900 font-heading">
                                                    {generatedAiTopic.name}
                                                </h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                    {generatedAiTopic.difficulty}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                    Usia {generatedAiTopic.min_age_level} th
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600">
                                                {generatedAiTopic.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 px-1 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                                    <input 
                                        type="checkbox"
                                        id="autoGenerateQuestionsTopicCheckbox"
                                        checked={autoGenerateQuestions}
                                        onChange={(e) => setAutoGenerateQuestions(e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor="autoGenerateQuestionsTopicCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                        ✨ Otomatis buatkan 5 butir soal kuis untuk topik ini
                                    </label>
                                </div>

                                <div className="flex items-center justify-end space-x-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleEditGeneratedTopicInManualForm}
                                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center space-x-1"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>Sesuaikan di Form</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSavingAiTopic}
                                        onClick={handleSaveGeneratedTopic}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                                    >
                                        {isSavingAiTopic ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Gunakan & Simpan Topik</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL FORM TAMBAH / EDIT TOPIK */}
            {isTopicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-xl font-bold font-heading text-[#2E2A4A]">
                                    {topicModalMode === 'create' ? 'Tambah Topik Baru' : 'Edit Topik'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Atur modul kurikulum dan detail materi topik pembelajaran anak.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsTopicModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTopic} className="space-y-4">
                            {/* Pilihan Modul */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Pilih Modul Pembelajaran <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={topicForm.module_id}
                                    onChange={e => setTopicForm({ ...topicForm, module_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="" disabled>-- Pilih Salah Satu Modul --</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Nama Topik */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Nama Topik <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={topicForm.name}
                                    onChange={e => setTopicForm({ ...topicForm, name: e.target.value })}
                                    placeholder="Contoh: Mengenal Angka 1-10, Buah-Buahan, dll."
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Deskripsi Topik
                                </label>
                                <textarea
                                    rows={2}
                                    value={topicForm.description}
                                    onChange={e => setTopicForm({ ...topicForm, description: e.target.value })}
                                    placeholder="Ringkasan materi atau tujuan belajar pada topik ini..."
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            {/* Icon / Emoji Picker */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Icon / Emoji Topik
                                </label>
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-amber-500 shrink-0">
                                        <AppIcon icon={topicForm.icon} className="w-6 h-6" emojiSize="text-2xl" />
                                    </div>
                                    <input
                                        type="text"
                                        value={topicForm.icon}
                                        onChange={e => setTopicForm({ ...topicForm, icon: e.target.value })}
                                        placeholder="Ketik nama icon (mis. calculator, moon, star) atau emoji..."
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    {['📚', '🔢', '🔤', '🌙', '🦁', '🚀', '🎨', '🧩', '🧪', '🌱', '🍎', '⭐', '🎈', '🪐', '💡', '🏆'].map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                                sound.playPop();
                                                setTopicForm({ ...topicForm, icon: emoji });
                                            }}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-transform hover:scale-110 cursor-pointer ${
                                                topicForm.icon === emoji ? 'bg-indigo-100 border border-indigo-500' : 'bg-white hover:bg-slate-100 border border-slate-200'
                                            }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Kesulitan & Target Usia */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Tingkat Kesulitan
                                    </label>
                                    <select
                                        value={topicForm.difficulty}
                                        onChange={e => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                                    >
                                        <option value="mudah">🟢 Mudah (Pemula)</option>
                                        <option value="sedang">🟡 Sedang (Menengah)</option>
                                        <option value="sulit">🔴 Sulit (Tantangan)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Target Usia Anak
                                    </label>
                                    <select
                                        value={topicForm.min_age_level}
                                        onChange={e => setTopicForm({ ...topicForm, min_age_level: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                                    >
                                        <option value="4-5">Usia 4 - 5 Tahun (PAUD / TK-A)</option>
                                        <option value="6-7">Usia 6 - 7 Tahun (TK-B / SD 1)</option>
                                        <option value="8">Usia 8+ Tahun</option>
                                    </select>
                                </div>
                            </div>

                            {/* Urutan & Status Aktif */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Urutan Tampil (Sort Order)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={topicForm.sort_order}
                                        onChange={e => setTopicForm({ ...topicForm, sort_order: parseInt(e.target.value, 10) || 1 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                                    />
                                </div>

                                <div className="pt-4">
                                    <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={topicForm.is_active}
                                            onChange={e => setTopicForm({ ...topicForm, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700">
                                            Status Aktif (Tampil di Kuis)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsTopicModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingTopic}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                                >
                                    {isSubmittingTopic && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{topicModalMode === 'create' ? 'Simpan Topik' : 'Perbarui Topik'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL GENERATOR CERITA AI */}
            {isAiStoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center space-x-2.5">
                                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#2E2A4A] font-heading">
                                        Buatkan Cerita Anak dengan AI
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Tulis tema cerita untuk menghasilkan naskah cerita dan kosakata baru secara otomatis.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAiStoryModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Parameter AI */}
                        <form onSubmit={handleGenerateAiStory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Tema / Ide Cerita Anak <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={aiStoryForm.theme}
                                    onChange={e => setAiStoryForm({ ...aiStoryForm, theme: e.target.value })}
                                    placeholder="Contoh: Petualangan Kancil dan Burung Pipit saling menolong di hutan"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Tingkat Kesulitan
                                </label>
                                <select
                                    value={aiStoryForm.level}
                                    onChange={e => setAiStoryForm({ ...aiStoryForm, level: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                                >
                                    <option value="mudah">Mudah (TK / SD Kelas 1)</option>
                                    <option value="sedang">Sedang (SD Kelas 2-3)</option>
                                    <option value="sulit">Sulit (Tantangan Ekstra)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-amber-700 font-medium">
                                    ⚡ Menghasilkan judul, sinopsis, isi cerita, & kosakata baru
                                </span>
                                <button
                                    type="submit"
                                    disabled={isGeneratingAiStory}
                                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {isGeneratingAiStory ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menulis Cerita...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>Generate Cerita Sekarang</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Review & Edit Hasil Generate AI */}
                        {generatedAiStory && (
                            <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold font-heading text-[#2E2A4A] flex items-center space-x-2">
                                        <span>Hasil Cerita & Ilustrasi AI</span>
                                        <span className="text-[10px] text-emerald-700 font-normal bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                            Dapat Direview & Diedit
                                        </span>
                                    </h4>
                                </div>

                                {/* Preview Sampul Ilustrasi AI Otomatis */}
                                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-purple-900 uppercase flex items-center space-x-1.5">
                                            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                                            <span>Sampul Ilustrasi Cerita (AI Generated)</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateStoryImage(generatedAiStory.title, generatedAiStory.description, aiStoryForm.theme, aiStoryForm.level, Math.floor(Math.random() * 900000) + 1000)}
                                            disabled={isGeneratingStoryImage}
                                            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                                        >
                                            {isGeneratingStoryImage ? (
                                                <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                                            ) : (
                                                <RotateCcw className="w-3 h-3" />
                                            )}
                                            <span>Generate Ulang Gambar</span>
                                        </button>
                                    </div>

                                    {isGeneratingStoryImage ? (
                                        <div className="w-full h-44 rounded-xl border-2 border-dashed border-purple-300 bg-white flex flex-col items-center justify-center space-y-2 text-center p-4">
                                            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                                            <p className="text-xs font-bold text-purple-900">Sedang Menggambar Ilustrasi Sampul Cerita...</p>
                                            <p className="text-[10px] text-purple-600 max-w-xs">Gaya visual flat vector ramah anak sedang disusun sesuai tema cerita.</p>
                                        </div>
                                    ) : (generatedStoryImageUrl || generatedAiStory.cover_image_url) ? (
                                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                                            <img
                                                src={generatedStoryImageUrl || generatedAiStory.cover_image_url}
                                                alt="Sampul Cerita AI"
                                                className="w-full sm:w-44 h-32 object-cover rounded-lg border border-purple-200 shadow-xs shrink-0"
                                            />
                                            <div className="flex-1 text-left space-y-1">
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-md">
                                                    ✨ Ilustrasi Otomatis Tersedia
                                                </span>
                                                <p className="text-xs font-bold text-[#2E2A4A] line-clamp-1">
                                                    {generatedAiStory.title}
                                                </p>
                                                <p className="text-[10px] text-slate-500 line-clamp-2">
                                                    {storyImagePrompt || 'Gaya visual flat/vector ramah anak, warna cerah, tanpa teks di dalam gambar.'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-24 rounded-xl border border-purple-200 bg-white flex items-center justify-center text-xs text-purple-700 font-semibold">
                                            <span>Klik tombol "Generate Ulang Gambar" untuk membuat ilustrasi cover.</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Judul Cerita</label>
                                        <input
                                            type="text"
                                            value={generatedAiStory.title || ''}
                                            onChange={e => handleUpdateGeneratedStoryField('title', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sinopsis / Ringkasan</label>
                                        <input
                                            type="text"
                                            value={generatedAiStory.description || ''}
                                            onChange={e => handleUpdateGeneratedStoryField('description', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Naskah Cerita</label>
                                        <textarea
                                            rows={6}
                                            value={generatedAiStory.content || ''}
                                            onChange={e => handleUpdateGeneratedStoryField('content', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 focus:bg-white"
                                        />
                                    </div>

                                    {/* Kosakata dari AI */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase">Kosakata Edukasi</label>
                                            <button
                                                type="button"
                                                onClick={handleAddGeneratedStoryVocab}
                                                className="text-[11px] text-purple-600 hover:text-purple-700 font-bold flex items-center space-x-1 cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span>Tambah Kata</span>
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {generatedAiStory.vocabularies && generatedAiStory.vocabularies.map((v, i) => (
                                                <div key={i} className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Kata"
                                                        value={v.word}
                                                        onChange={e => handleUpdateGeneratedStoryVocab(i, 'word', e.target.value)}
                                                        className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Arti"
                                                        value={v.meaning}
                                                        onChange={e => handleUpdateGeneratedStoryVocab(i, 'meaning', e.target.value)}
                                                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveGeneratedStoryVocab(i)}
                                                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAiStoryModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveGeneratedStoryToForm}
                                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-purple-200 cursor-pointer flex items-center space-x-1.5"
                                    >
                                        <span>Gunakan Cerita & Atur Sampul →</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
