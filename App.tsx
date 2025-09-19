import React, { useState, useCallback } from 'react';
import Card from './components/Card';
import TextInput from './components/TextInput';
import RadioGroup from './components/RadioGroup';
import TextArea from './components/TextArea';
import Button from './components/Button';
import LoadingSpinner from './components/LoadingSpinner';
import TicketAnalysis from './components/ReviewFeedback';
import SubmissionSuccess from './components/SubmissionSuccess';
import SelectGroup, { OptionGroup } from './components/SelectGroup';
import { analyzeTicket } from './services/geminiService';
import { sendSupportEmail } from './services/emailService';
import { SupportTicketData, TicketAnalysisResult } from './types';
import Card from "./components/Card";


// Define initial state to easily reset the form
const initialFormData: SupportTicketData = {
  nome: '',
  email: '',
  unidade: '',
  setor: 'Admissões',
  equipamento: 'Notebook',
  outroEquipamento: '',
  descricao: '',
};

const App: React.FC = () => {
  const [formData, setFormData] = useState<SupportTicketData>(initialFormData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<TicketAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false); // New state for submission status

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.descricao || !formData.nome || !formData.email || !formData.unidade || (formData.equipamento === 'Outro:' && !formData.outroEquipamento)) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    // Prepare form data for submission, combining 'equipamento' and 'outroEquipamento'
    const submissionData = {
        ...formData,
        equipamento: formData.equipamento === 'Outro:' 
            ? `Outro: ${formData.outroEquipamento}` 
            : formData.equipamento,
    };

    try {
      const result = await analyzeTicket(submissionData);
      setAnalysisResult(result);

      // After successful analysis, send the email via the backend
      await sendSupportEmail(submissionData, result);
      
      setIsSubmitted(true); // Set submission to true to show success screen
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to reset the entire form to its initial state
  const resetForm = () => {
      setFormData(initialFormData);
      setAnalysisResult(null);
      setError(null);
      setIsSubmitted(false);
      setIsLoading(false);
  };

  const unidadeOptions: (string | OptionGroup)[] = [
    {
        label: 'Centro Educacional Leonardo da Vinci',
        options: ['Centro Educacional Leonardo da Vinci/ ES']
    },
    {
        label: 'Escola Eleva',
        options: [
            'Escola Eleva Barra da Tijuca/ RJ',
            'Escola Eleva Botafogo/ RJ',
            'Escola Eleva Brasilia /DF',
            'Escola Eleva Recife/ PE',
            'Escola Eleva São Paulo/ SP',
            'Escola Eleva Urca/ RJ'
        ]
    },
    {
        label: 'Gurilandia',
        options: [
            'Gurilandia Federação',
            'Gurilandia Pituba'
        ]
    },
    {
        label: 'Land',
        options: [
            'Land Federação',
            'Land Pituba'
        ]
    }
  ];
  const setorOptions = ['Admissões', 'Administração', 'Finanças', 'Jurídico', 'Marketing', 'RH - Recursos Humanos', 'TI - Tecnologia da Informação'];
  const equipamentoOptions = ['Carregador', 'Impressora', 'Internet', 'Monitor', 'Mouse', 'Notebook', 'Teclado', 'Pacote Office', 'Programa Específico para operação do setor (GIA, AutoCad. etc...)', 'Outro:'];

  const renderContent = () => {
    if (isLoading) {
      // Show only the spinner while loading
      return <LoadingSpinner />;
    }
    
    if (isSubmitted && analysisResult) {
      // After submission, show success message and the analysis
      return (
        <>
          <SubmissionSuccess email={formData.email} onReset={resetForm} />
          <TicketAnalysis result={analysisResult} />
        </>
      );
    }

    // Default view is the form
    return (
      <form onSubmit={handleSubmit}>
        <Card title="Seu nome e sobrenome" required>
           <TextInput id="nome" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Sua resposta" />
        </Card>
        
        <Card 
          title="Escreva seu e-mail" 
          description="Uma cópia do registro deste atendimento será enviada automaticamente para você, como forma de acompanhamento e comprovação do suporte prestado." 
          required
        >
          <TextInput id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Sua resposta" type="email" />
        </Card>

        <Card title="Escolha qual a sua unidade" required>
            <SelectGroup 
                id="unidade" 
                name="unidade" 
                value={formData.unidade} 
                onChange={handleInputChange} 
                optionGroups={unidadeOptions} 
            />
        </Card>

        <Card title="Setor" required>
          <RadioGroup name="setor" options={setorOptions} selectedValue={formData.setor} onChange={handleInputChange} />
        </Card>

        <Card title="Equipamento Envolvido" required>
           <RadioGroup name="equipamento" options={equipamentoOptions} selectedValue={formData.equipamento} onChange={handleInputChange} />
           {formData.equipamento === 'Outro:' && (
             <div className="mt-4 pl-7">
               <TextInput
                 id="outroEquipamento"
                 name="outroEquipamento"
                 value={formData.outroEquipamento || ''}
                 onChange={handleInputChange}
                 placeholder="Especifique o equipamento"
               />
             </div>
           )}
        </Card>
        
        <Card 
          title="Descrição do Problema" 
          description="Descreva qual foi o problema, pedido ou dúvida que você tem." 
          required
        >
          <TextArea id="descricao" name="descricao" value={formData.descricao} onChange={handleInputChange} placeholder="Sua resposta" rows={8} />
        </Card>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Analisando...' : 'Enviar'}
          </Button>
          {error && <p className="text-red-600 text-sm font-medium text-right">{error}</p>}
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="w-full bg-indigo-600 h-2.5 rounded-t-lg"></div>
                <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-900">Formulário de Suporte de TI</h1>
                    <p className="mt-2 text-gray-600">
                        Preencha o formulário abaixo para abrir um chamado de suporte. Nossa IA fará uma análise inicial do seu problema.
                    </p>
                </div>
            </div>
        </header>
        
        {renderContent()}

      </div>
    </div>
  );
};

export default App;
