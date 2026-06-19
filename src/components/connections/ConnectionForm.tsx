import { useState } from 'react';
import { createConnection, updateConnection, testConnection, ConnectionRecord } from '../../api/connections';
import { useDialogStore } from '../../stores/dialogStore';
import { Eye, EyeOff } from 'lucide-react';

interface ConnectionFormProps {
  initialData?: ConnectionRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ConnectionForm({ initialData, onSuccess, onCancel }: ConnectionFormProps) {
  const { showDialog } = useDialogStore();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    host: initialData?.host || 'localhost',
    port: initialData?.port || 6379,
    password: initialData?.password || '',
    username: initialData?.username || '',
    dbNumber: initialData?.dbNumber || 0,
    useTls: initialData?.useTls || false,
    isDefault: initialData?.isDefault || false,
  });

  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      // testConnection doesn't need name, isDefault, id, createdAt, updatedAt
      const result = await testConnection({
        host: formData.host,
        port: formData.port,
        password: formData.password,
        username: formData.username,
        dbNumber: formData.dbNumber,
        useTls: formData.useTls,
      });
      showDialog({
        title: 'Teste de Conexão',
        message: `Conexão bem sucedida!\nResposta do Servidor: ${result}`,
        type: 'success'
      });
    } catch (error) {
      showDialog({
        title: 'Falha no Teste',
        message: `A conexão falhou:\n${String(error)}`,
        type: 'error'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData?.id) {
        await updateConnection({ id: initialData.id, ...formData });
      } else {
        await createConnection(formData);
      }
      
      showDialog({
        title: 'Sucesso',
        message: 'A conexão foi salva com sucesso!',
        type: 'success'
      });
      onSuccess();
    } catch (error) {
      showDialog({
        title: 'Erro de Conexão',
        message: String(error),
        type: 'error'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full bg-card p-6">
      <div className="grid gap-1.5">
        <label className="text-[13px] font-medium text-foreground">Nome</label>
        <input 
          type="text" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Ex: Redis Produção"
          required
          className="w-full bg-input border border-border rounded-sm px-3 py-1.5 text-[13px] text-foreground focus:bg-secondary outline-none"
        />
      </div>

      <div className="grid grid-cols-[3fr_1fr] gap-4">
        <div className="grid gap-1.5">
          <label className="text-[13px] font-medium text-foreground">Host</label>
          <input 
            type="text" 
            value={formData.host}
            onChange={(e) => setFormData({...formData, host: e.target.value})}
            required
            className="w-full bg-input border border-border rounded-sm px-3 py-1.5 text-[13px] text-foreground focus:bg-secondary outline-none"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-[13px] font-medium text-foreground">Porta</label>
          <input 
            type="number" 
            value={formData.port}
            onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
            required
            className="w-full bg-input border border-border rounded-sm px-3 py-1.5 text-[13px] text-foreground focus:bg-secondary outline-none"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className="text-[13px] font-medium text-foreground">Senha (Opcional)</label>
        <div className="relative flex items-center">
          <input 
            type={showPassword ? "text" : "password"} 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full bg-input border border-border rounded-sm pl-3 pr-9 py-1.5 text-[13px] text-foreground focus:bg-secondary outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 text-muted-foreground hover:text-foreground flex items-center justify-center"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      
      <div className="grid gap-1.5">
        <label className="text-[13px] font-medium text-foreground">Usuário (ACL - Opcional)</label>
        <input 
          type="text" 
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          className="w-full bg-input border border-border rounded-sm px-3 py-1.5 text-[13px] text-foreground focus:bg-secondary outline-none"
        />
      </div>
      
      <div className="grid gap-1.5 w-1/3">
        <label className="text-[13px] font-medium text-foreground">Banco (Index)</label>
        <input 
          type="number" 
          min="0"
          value={formData.dbNumber}
          onChange={(e) => setFormData({...formData, dbNumber: parseInt(e.target.value) || 0})}
          className="w-full bg-input border border-border rounded-sm px-3 py-1.5 text-[13px] text-foreground focus:bg-secondary outline-none"
        />
      </div>

      <div className="flex gap-6 pt-2">
        <label className="flex items-center gap-2 text-[13px] text-foreground cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.useTls}
            onChange={(e) => setFormData({...formData, useTls: e.target.checked})}
            className="w-4 h-4 rounded-sm border-border"
          />
          Usar TLS (mTLS suportado)
        </label>
        
        <label className="flex items-center gap-2 text-[13px] text-foreground cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.isDefault}
            onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
            className="w-4 h-4 rounded-sm border-border"
          />
          Definir como Padrão
        </label>
      </div>

      <div className="pt-4 border-t border-border flex gap-3 justify-end items-center">
        <button 
          type="button" 
          onClick={handleTest}
          disabled={testing}
          className="bg-transparent text-[#4F81BD] hover:underline px-4 py-1.5 text-[13px] rounded-sm disabled:opacity-50 disabled:no-underline flex-1 text-left"
        >
          {testing ? 'Testando...' : 'Testar Conexão'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="bg-secondary text-foreground px-4 py-1.5 text-[13px] rounded-sm hover:bg-muted border border-border"
        >
          Cancelar
        </button>
        <button type="submit" className="bg-[#4F81BD] text-white px-4 py-1.5 text-[13px] rounded-sm hover:brightness-110 border border-[#1F497D]">
          Salvar Conexão
        </button>
      </div>
    </form>
  );
}
