import axios from 'axios';

interface CNPJValidationResult {
  valid: boolean;
  companyName?: string;
  fantasyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  mainActivity?: string;
  situacao?: string;
  error?: string;
}

interface CNPJCacheEntry {
  data: CNPJValidationResult;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

export class CNPJService {
  private static readonly CNPJ_API_URL = 'https://publica.cnpj.ws/cnpj/';
  private static readonly CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
  private static cnpjCache = new Map<string, CNPJCacheEntry>();

  static validateCNPJFormat(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

    if (cleanCNPJ.length !== 14) return false;

    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const calculateDigit = (cnpj: string, weights: number[]): number => {
      const sum = cnpj.split('').reduce((acc, digit, index) => {
        return acc + parseInt(digit) * weights[index];
      }, 0);

      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const digit1 = calculateDigit(cleanCNPJ.substring(0, 12), weights1);
    const digit2 = calculateDigit(cleanCNPJ.substring(0, 12) + digit1, weights2);

    return parseInt(cleanCNPJ.charAt(12)) === digit1 && parseInt(cleanCNPJ.charAt(13)) === digit2;
  }

  static formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  private static getCachedResult(cnpj: string): CNPJValidationResult | null {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    const cacheEntry = this.cnpjCache.get(cleanCNPJ);

    if (cacheEntry && Date.now() - cacheEntry.timestamp < this.CACHE_EXPIRATION_TIME) {
      return cacheEntry.data;
    }

    // Remove expired entry
    if (cacheEntry) {
      clearTimeout(cacheEntry.timeoutId);
      this.cnpjCache.delete(cleanCNPJ);
    }

    return null;
  }

  private static setCachedResult(cnpj: string, result: CNPJValidationResult): void {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

    // Clear existing timeout if any
    const existingEntry = this.cnpjCache.get(cleanCNPJ);
    if (existingEntry) {
      clearTimeout(existingEntry.timeoutId);
    }

    // Set timeout to automatically remove expired cache entry
    const timeoutId = setTimeout(() => {
      this.cnpjCache.delete(cleanCNPJ);
    }, this.CACHE_EXPIRATION_TIME);

    this.cnpjCache.set(cleanCNPJ, {
      data: result,
      timestamp: Date.now(),
      timeoutId,
    });
  }

  static async validateCNPJWithAPI(cnpj: string): Promise<CNPJValidationResult> {
    try {
      if (!this.validateCNPJFormat(cnpj)) {
        return { valid: false, error: 'Invalid CNPJ format' };
      }

      // Check cache first
      const cachedResult = this.getCachedResult(cnpj);
      if (cachedResult) {
        return cachedResult;
      }

      const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
      const response = await axios.get(`${this.CNPJ_API_URL}${cleanCNPJ}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CresceBR-B2B-Marketplace/1.0',
        },
      });

      const data = response.data;

      if (data.status === 200 && data.estabelecimento) {
        const establishment = data.estabelecimento;
        const result = {
          valid: true,
          companyName: data.razao_social,
          fantasyName: establishment.nome_fantasia || data.razao_social,
          address: `${establishment.logradouro}, ${establishment.numero} - ${establishment.bairro}`,
          city: establishment.cidade?.nome,
          state: establishment.estado?.nome,
          zipCode: establishment.cep,
          phone: establishment.telefone1,
          email: establishment.email,
          mainActivity: data.natureza_juridica?.descricao,
          situacao: establishment.situacao_cadastral,
        };

        // Cache the successful result
        this.setCachedResult(cnpj, result);
        return result;
      } else {
        const result = { valid: false, error: 'CNPJ not found or inactive' };
        // Cache the failed result to avoid repeated API calls
        this.setCachedResult(cnpj, result);
        return result;
      }
    } catch (error) {
      console.error('CNPJ validation error:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { valid: false, error: 'Timeout validating CNPJ' };
        }
        if (error.response?.status === 429) {
          return { valid: false, error: 'Rate limit exceeded, try again later' };
        }
        if (error.response?.status === 404) {
          const result = { valid: false, error: 'CNPJ not found' };
          // Cache 404 results to avoid repeated API calls
          this.setCachedResult(cnpj, result);
          return result;
        }
      }

      return {
        valid: this.validateCNPJFormat(cnpj),
        error: 'Unable to validate CNPJ online, using format validation only',
      };
    }
  }

  static async validateAndUpdateCompany(
    cnpj: string,
    userId: number
  ): Promise<CNPJValidationResult> {
    const validationResult = await this.validateCNPJWithAPI(cnpj);

    if (validationResult.valid) {
      try {
        const User = (await import('../models/User')).default;
        const user = await User.findByPk(userId);

        if (user) {
          await user.update({
            companyName: validationResult.companyName || user.companyName,
            cnpj: this.formatCNPJ(cnpj),
          });
        }
      } catch (error) {
        console.error('Error updating company with CNPJ data:', error);
      }
    }

    return validationResult;
  }
}
