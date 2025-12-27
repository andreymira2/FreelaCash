import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select, Card } from '../components/ui';
import { Currency, UserProfile } from '../types';
import { Rocket, ArrowRight, Camera, User, PlusCircle, XCircle } from 'lucide-react';
import { SensitiveInput } from '../components/ui/SensitiveInput';
import { validateCPF, validatePIX } from '../utils/validation';

const SetupProfile: React.FC = () => {
    const { updateUserProfile, updateSettings, userProfile } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: userProfile.name !== 'Freelancer' ? userProfile.name : '',
        title: userProfile.title || 'Design',
        currency: Currency.BRL,
        monthlyGoal: '',
        pixKey: userProfile.pixKey || '',
        taxId: userProfile.taxId || ''
    });

    const [avatar, setAvatar] = useState<string | null>(userProfile.avatar || null);
    const [saving, setSaving] = useState(false);
    const [showCPFToggle, setShowCPFToggle] = useState(!!userProfile.taxId);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setAvatar(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};
        if (formData.taxId && !validateCPF(formData.taxId)) {
            newErrors.taxId = 'CPF inválido';
        }
        if (formData.pixKey && !validatePIX(formData.pixKey)) {
            newErrors.pixKey = 'Chave PIX inválida';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 3000);
            return;
        }

        setSaving(true);

        await updateUserProfile({
            name: formData.name || 'Freelancer',
            title: formData.title,
            avatar: avatar || undefined,
            pixKey: formData.pixKey,
            taxId: formData.taxId
        });

        await updateSettings({
            mainCurrency: formData.currency,
            monthlyGoal: formData.monthlyGoal ? parseFloat(formData.monthlyGoal) : 10000
        });

        navigate('/');
    };

    const handleSkip = async () => {
        setSaving(true);
        const metadata = user?.user_metadata;
        const defaultName = metadata?.full_name || metadata?.name || metadata?.user_name || 'Meu Perfil';
        await updateUserProfile({ name: defaultName });
        navigate('/');
    };

    const areas = [
        'Design',
        'Desenvolvimento',
        'Social Media',
        'Vídeo',
        'Conteúdo',
        'Outro'
    ];

    return (
        <div className="min-h-screen bg-base flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-semantic-purple/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700 relative z-10">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-brand rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-neon transform rotate-3">
                        <Rocket size={40} className="text-black" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">Antes de começar, vamos configurar seu perfil rapidinho?</h1>
                    <p className="text-slate-400 font-medium">Prometemos que é jogo rápido.</p>
                </div>

                <Card className="border-white/10 bg-[#161616] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="flex justify-center -mt-12 mb-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group cursor-pointer w-28 h-28 rounded-full border-4 border-[#161616] shadow-xl overflow-hidden bg-black flex items-center justify-center"
                            >
                                {avatar ? (
                                    <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={36} className="text-slate-500 group-hover:text-brand transition-colors" />
                                )}

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera size={24} className="text-white" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                        <div className="text-center -mt-4 mb-6">
                            <p className="text-xs font-medium text-ink-dim">Sua foto (opcional)</p>
                        </div>

                        <div className="space-y-5">
                            <Input
                                label="Como quer que a gente te chame?"
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                                className="text-lg bg-[#222] focus:bg-black transition-colors"
                            />

                            <Select
                                label="Qual é a sua área principal hoje?"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="bg-[#222]"
                            >
                                {areas.map(a => <option key={a} value={a} className="bg-black">{a}</option>)}
                            </Select>

                            {showCPFToggle || formData.taxId ? (
                                <div className="relative">
                                    <SensitiveInput
                                        label="CPF (Opcional)"
                                        placeholder="000.000.000-00"
                                        value={formData.taxId}
                                        onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                        className="bg-[#222] focus:bg-black transition-colors"
                                    />
                                    {errors.taxId && <p className="text-[10px] text-semantic-red font-bold absolute -bottom-1 left-1">{errors.taxId}</p>}
                                    {!formData.taxId && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCPFToggle(false)}
                                            className="absolute top-0 right-0 text-ink-dim hover:text-white p-1"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5 mb-4 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowCPFToggle(true)}
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/20 bg-white/5 text-ink-gray hover:text-white hover:border-white/40 transition-all text-sm font-bold"
                                    >
                                        <PlusCircle size={18} /> Adicionar CPF (opcional)
                                    </button>
                                </div>
                            )}

                            <div className="relative">
                                <SensitiveInput
                                    label="Chave PIX (Opcional)"
                                    placeholder="Sua chave PIX"
                                    value={formData.pixKey}
                                    onChange={e => setFormData({ ...formData, pixKey: e.target.value })}
                                    className="bg-[#222] focus:bg-black transition-colors"
                                />
                                {errors.pixKey && <p className="text-[10px] text-semantic-red font-bold absolute -bottom-1 left-1">{errors.pixKey}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Moeda Principal"
                                    value={formData.currency}
                                    onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
                                    className="bg-[#222]"
                                >
                                    {Object.values(Currency).map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                                </Select>

                                <Input
                                    label="Qual sua meta de faturamento por mês?"
                                    type="number"
                                    placeholder="10000"
                                    value={formData.monthlyGoal}
                                    onChange={e => setFormData({ ...formData, monthlyGoal: e.target.value })}
                                    className="bg-[#222] focus:bg-black transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <Button type="submit" variant="primary" disabled={saving} className="w-full h-14 text-base shadow-neon group font-extrabold tracking-wide">
                                {saving ? 'Salvando...' : 'Começar meu painel'}
                                {!saving && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleSkip}
                                disabled={saving}
                                className="w-full py-3 text-sm font-medium text-ink-dim hover:text-white transition-colors"
                            >
                                Pular por enquanto
                            </Button>
                        </div>
                    </form>
                </Card>

                <p className="text-center text-zinc-600 text-xs mt-6">
                    Seus dados são salvos de forma segura na nuvem
                </p>
            </div>
        </div>
    );
};

export default SetupProfile;
