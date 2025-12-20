import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  BarChart3, 
  Users, 
  Receipt, 
  Calendar,
  Shield,
  Smartphone,
  Zap,
  Check,
  Star
} from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard Financeiro',
      description: 'Visualize receitas, despesas e lucro em tempo real com gráficos intuitivos.'
    },
    {
      icon: Users,
      title: 'Gestão de Clientes',
      description: 'Organize seus clientes, histórico de projetos e informações de cobrança.'
    },
    {
      icon: Receipt,
      title: 'Controle de Despesas',
      description: 'Acompanhe gastos recorrentes, assinaturas e despesas de projeto.'
    },
    {
      icon: Calendar,
      title: 'Calendário Financeiro',
      description: 'Veja pagamentos agendados, vencimentos e prazos de projetos.'
    },
    {
      icon: Shield,
      title: 'Dados Seguros',
      description: 'Seus dados são criptografados e armazenados de forma segura na nuvem.'
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Acesse de qualquer dispositivo com interface otimizada para mobile.'
    }
  ];

  const benefits = [
    'Controle total sobre suas finanças',
    'Multi-moedas (BRL, USD, EUR, GBP)',
    'Projetos fixos, por hora ou diária',
    'Relatórios detalhados',
    'Exportação de dados',
    'Sincronização na nuvem'
  ];

  return (
    <div className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C6FF3F] flex items-center justify-center">
              <span className="text-black font-bold">F</span>
            </div>
            <span className="text-white font-bold text-lg">FreelaCash</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Entrar
            </Link>
            <Link 
              to="/signup" 
              className="bg-[#C6FF3F] text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#b8f035] transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#C6FF3F]/10 border border-[#C6FF3F]/30 px-4 py-2 rounded-full mb-6">
              <Zap className="text-[#C6FF3F]" size={16} />
              <span className="text-[#C6FF3F] text-sm font-medium">100% Gratuito</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Organize suas finanças
              <br />
              <span className="text-[#C6FF3F]">como freelancer</span>
            </h1>
            
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Acompanhe projetos, controle despesas e tenha uma visão clara do seu fluxo de caixa. 
              Simples, seguro e feito para quem trabalha por conta própria.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto bg-[#C6FF3F] text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#b8f035] transition-colors flex items-center justify-center gap-2"
              >
                Começar agora
                <ArrowRight size={20} />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto bg-zinc-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-800 transition-colors border border-zinc-700"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Tudo que você precisa
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Ferramentas essenciais para gerenciar suas finanças de freelancer em um só lugar
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="w-12 h-12 bg-[#C6FF3F]/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="text-[#C6FF3F]" size={24} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-2 mb-6">
                <Star className="text-[#C6FF3F] fill-[#C6FF3F]" size={20} />
                <Star className="text-[#C6FF3F] fill-[#C6FF3F]" size={20} />
                <Star className="text-[#C6FF3F] fill-[#C6FF3F]" size={20} />
                <Star className="text-[#C6FF3F] fill-[#C6FF3F]" size={20} />
                <Star className="text-[#C6FF3F] fill-[#C6FF3F]" size={20} />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                Por que freelancers escolhem o FreelaCash?
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C6FF3F] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-black" size={14} />
                    </div>
                    <span className="text-zinc-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-zinc-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para organizar suas finanças?
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Crie sua conta gratuita e comece a ter controle total sobre seu dinheiro.
            </p>
            <Link 
              to="/signup" 
              className="inline-flex items-center gap-2 bg-[#C6FF3F] text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#b8f035] transition-colors"
            >
              Criar conta gratuita
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#C6FF3F] flex items-center justify-center">
              <span className="text-black font-bold text-xs">F</span>
            </div>
            <span className="text-zinc-500 text-sm">FreelaCash</span>
          </div>
          <p className="text-zinc-600 text-sm">
            Seus dados são armazenados de forma segura e criptografada na nuvem.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
