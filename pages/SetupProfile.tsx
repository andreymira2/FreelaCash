import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button, Input, Select, Card } from '../components/ui';
import { Currency } from '../types';
import { Rocket, ArrowRight, Camera, User } from 'lucide-react';

const SetupProfile: React.FC = () => {
    const { updateUserProfile, updateSettings, userProfile } = useData();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: userProfile.name !== 'Freelancer' ? userProfile.name : '',
        title: userProfile.title || 'Design',
        currency: Currency.BRL,
        monthlyGoal: '',
        pixKey: userProfile.pixKey || ''
    });

    const [avatar, setAvatar] = useState<string | null>(userProfile.avatar || null);
    const [saving, setSaving] = useState(false);

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
        setSaving(true);

        await updateUserProfile({
            name: formData.name || 'Freelancer',
            title: formData.title,
            avatar: avatar || undefined,
            pixKey: formData.pixKey
        });

        await updateSettings({
            mainCurrency: formData.currency,
            monthlyGoal: formData.monthlyGoal ? parseFloat(formData.monthlyGoal) : 10000
        });

        navigate('/');
    };

    const handleSkip = async () => {
        setSaving(true);
        await updateUserProfile({ name: 'Freelancer' });
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

                            <Input
                                label="Chave PIX (Opcional)"
                                placeholder="Sua chave PIX"
                                value={formData.pixKey}
                                onChange={e => setFormData({ ...formData, pixKey: e.target.value })}
                                className="bg-[#222] focus:bg-black transition-colors"
                            />

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
