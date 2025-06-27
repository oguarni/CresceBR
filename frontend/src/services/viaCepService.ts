import axios from 'axios';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

class ViaCepService {
  private api = axios.create({
    baseURL: 'https://viacep.com.br/ws',
    timeout: 5000,
  });

  async getAddressByCep(cep: string): Promise<ViaCepResponse> {
    // Remove non-numeric characters from CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    // Validate CEP format
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos');
    }

    try {
      const response = await this.api.get<ViaCepResponse>(`/${cleanCep}/json/`);
      
      if (response.data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Tempo limite excedido ao consultar CEP');
        } else if (!error.response) {
          throw new Error('Erro de conexão ao consultar CEP');
        }
      }
      throw new Error('Erro ao consultar CEP');
    }
  }

  formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  }

  isValidCep(cep: string): boolean {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
  }
}

export const viaCepService = new ViaCepService();