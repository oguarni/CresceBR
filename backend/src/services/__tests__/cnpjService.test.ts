import axios from 'axios';
import { CNPJService } from '../cnpjService';
import User from '../../models/User';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock User model
jest.mock('../../models/User');
const MockUser = User as jest.Mocked<typeof User>;

describe('CNPJService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCNPJFormat', () => {
    it('should return true for valid CNPJ format', () => {
      const validCNPJ = '11.222.333/0001-81';
      const result = CNPJService.validateCNPJFormat(validCNPJ);
      expect(result).toBe(true);
    });

    it('should return true for valid CNPJ without formatting', () => {
      const validCNPJ = '11222333000181';
      const result = CNPJService.validateCNPJFormat(validCNPJ);
      expect(result).toBe(true);
    });

    it('should return false for CNPJ with wrong length', () => {
      const invalidCNPJ = '1122233300018';
      const result = CNPJService.validateCNPJFormat(invalidCNPJ);
      expect(result).toBe(false);
    });

    it('should return false for CNPJ with all same digits', () => {
      const invalidCNPJ = '11111111111111';
      const result = CNPJService.validateCNPJFormat(invalidCNPJ);
      expect(result).toBe(false);
    });

    it('should return false for CNPJ with invalid check digits', () => {
      const invalidCNPJ = '11.222.333/0001-00';
      const result = CNPJService.validateCNPJFormat(invalidCNPJ);
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = CNPJService.validateCNPJFormat('');
      expect(result).toBe(false);
    });

    it('should return false for string with letters', () => {
      const invalidCNPJ = 'abcdefghijklmn';
      const result = CNPJService.validateCNPJFormat(invalidCNPJ);
      expect(result).toBe(false);
    });
  });

  describe('formatCNPJ', () => {
    it('should format CNPJ correctly', () => {
      const unformattedCNPJ = '11222333000181';
      const expected = '11.222.333/0001-81';
      const result = CNPJService.formatCNPJ(unformattedCNPJ);
      expect(result).toBe(expected);
    });

    it('should format already formatted CNPJ', () => {
      const formattedCNPJ = '11.222.333/0001-81';
      const expected = '11.222.333/0001-81';
      const result = CNPJService.formatCNPJ(formattedCNPJ);
      expect(result).toBe(expected);
    });

    it('should handle CNPJ with mixed formatting', () => {
      const mixedCNPJ = '11.222333/000181';
      const expected = '11.222.333/0001-81';
      const result = CNPJService.formatCNPJ(mixedCNPJ);
      expect(result).toBe(expected);
    });
  });

  describe('validateCNPJWithAPI', () => {
    it('should return valid result for valid CNPJ', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const mockResponse = {
        data: {
          status: 200,
          razao_social: 'Test Company Ltd',
          natureza_juridica: {
            descricao: 'Sociedade Limitada',
          },
          estabelecimento: {
            nome_fantasia: 'Test Company',
            logradouro: 'Test Street',
            numero: '123',
            bairro: 'Test District',
            cidade: { nome: 'Test City' },
            estado: { nome: 'Test State' },
            cep: '12345-678',
            telefone1: '11999999999',
            email: 'test@example.com',
            situacao_cadastral: 'ATIVA',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(result.valid).toBe(true);
      expect(result.companyName).toBe('Test Company Ltd');
      expect(result.fantasyName).toBe('Test Company');
      expect(result.address).toBe('Test Street, 123 - Test District');
      expect(result.city).toBe('Test City');
      expect(result.state).toBe('Test State');
      expect(result.zipCode).toBe('12345-678');
      expect(result.phone).toBe('11999999999');
      expect(result.email).toBe('test@example.com');
      expect(result.mainActivity).toBe('Sociedade Limitada');
      expect(result.situacao).toBe('ATIVA');
    });

    it('should return invalid result for invalid CNPJ format', async () => {
      const invalidCNPJ = '1122233300018';

      const result = await CNPJService.validateCNPJWithAPI(invalidCNPJ);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid CNPJ format');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return invalid result when API returns not found', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const mockResponse = {
        data: {
          status: 404,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('CNPJ not found or inactive');
    });

    it('should handle API timeout error', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const timeoutError = {
        code: 'ECONNABORTED',
        isAxiosError: true,
      };

      mockedAxios.get.mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Timeout validating CNPJ');
    });

    it('should handle API rate limit error', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const rateLimitError = {
        response: { status: 429 },
        isAxiosError: true,
      };

      mockedAxios.get.mockRejectedValue(rateLimitError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Rate limit exceeded, try again later');
    });

    it('should handle API 404 error', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const notFoundError = {
        response: { status: 404 },
        isAxiosError: true,
      };

      mockedAxios.get.mockRejectedValue(notFoundError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('CNPJ not found');
    });

    it('should handle general API error gracefully', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const generalError = {
        response: { status: 500 },
        isAxiosError: true,
      };

      mockedAxios.get.mockRejectedValue(generalError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(result.valid).toBe(true); // Should fall back to format validation
      expect(result.error).toBe('Unable to validate CNPJ online, using format validation only');
    });

    it('should handle network error', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const networkError = new Error('Network Error');

      mockedAxios.get.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(result.valid).toBe(true); // Should fall back to format validation
      expect(result.error).toBe('Unable to validate CNPJ online, using format validation only');
    });

    it('should make correct API call with proper headers', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const mockResponse = {
        data: {
          status: 200,
          razao_social: 'Test Company',
          estabelecimento: {
            nome_fantasia: 'Test Company',
            logradouro: 'Test Street',
            numero: '123',
            bairro: 'Test District',
            cidade: { nome: 'Test City' },
            estado: { nome: 'Test State' },
            cep: '12345-678',
            telefone1: '11999999999',
            email: 'test@example.com',
            situacao_cadastral: 'ATIVA',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await CNPJService.validateCNPJWithAPI(validCNPJ);

      expect(mockedAxios.get).toHaveBeenCalledWith('https://publica.cnpj.ws/cnpj/11222333000181', {
        timeout: 10000,
        headers: {
          'User-Agent': 'CresceBR-B2B-Marketplace/1.0',
        },
      });
    });
  });

  describe('validateAndUpdateCompany', () => {
    it('should update company data when validation succeeds', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const userId = 1;
      const mockUser = {
        id: userId,
        companyName: 'Old Company Name',
        update: jest.fn(),
      };

      // Mock the validation result
      const mockValidationResult = {
        valid: true,
        companyName: 'New Company Name',
        fantasyName: 'New Fantasy Name',
      };

      // Mock the API call
      const mockResponse = {
        data: {
          status: 200,
          razao_social: 'New Company Name',
          estabelecimento: {
            nome_fantasia: 'New Fantasy Name',
            logradouro: 'Test Street',
            numero: '123',
            bairro: 'Test District',
            cidade: { nome: 'Test City' },
            estado: { nome: 'Test State' },
            cep: '12345-678',
            telefone1: '11999999999',
            email: 'test@example.com',
            situacao_cadastral: 'ATIVA',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      MockUser.findByPk.mockResolvedValue(mockUser as any);

      const result = await CNPJService.validateAndUpdateCompany(validCNPJ, userId);

      expect(result.valid).toBe(true);
      expect(result.companyName).toBe('New Company Name');
      expect(mockUser.update).toHaveBeenCalledWith({
        companyName: 'New Company Name',
        cnpj: '11.222.333/0001-81',
      });
    });

    it('should not update company data when validation fails', async () => {
      const invalidCNPJ = '1122233300018';
      const userId = 1;

      const result = await CNPJService.validateAndUpdateCompany(invalidCNPJ, userId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid CNPJ format');
      expect(MockUser.findByPk).not.toHaveBeenCalled();
    });

    it('should handle user not found gracefully', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const userId = 999;

      // Mock successful validation
      const mockResponse = {
        data: {
          status: 200,
          razao_social: 'Test Company',
          estabelecimento: {
            nome_fantasia: 'Test Company',
            logradouro: 'Test Street',
            numero: '123',
            bairro: 'Test District',
            cidade: { nome: 'Test City' },
            estado: { nome: 'Test State' },
            cep: '12345-678',
            telefone1: '11999999999',
            email: 'test@example.com',
            situacao_cadastral: 'ATIVA',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      MockUser.findByPk.mockResolvedValue(null);

      const result = await CNPJService.validateAndUpdateCompany(validCNPJ, userId);

      expect(result.valid).toBe(true);
      expect(result.companyName).toBe('Test Company');
      // Should not throw error when user is not found
    });

    it('should handle database update error gracefully', async () => {
      const validCNPJ = '11.222.333/0001-81';
      const userId = 1;
      const mockUser = {
        id: userId,
        companyName: 'Old Company Name',
        update: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      // Mock successful validation
      const mockResponse = {
        data: {
          status: 200,
          razao_social: 'Test Company',
          estabelecimento: {
            nome_fantasia: 'Test Company',
            logradouro: 'Test Street',
            numero: '123',
            bairro: 'Test District',
            cidade: { nome: 'Test City' },
            estado: { nome: 'Test State' },
            cep: '12345-678',
            telefone1: '11999999999',
            email: 'test@example.com',
            situacao_cadastral: 'ATIVA',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      MockUser.findByPk.mockResolvedValue(mockUser as any);

      const result = await CNPJService.validateAndUpdateCompany(validCNPJ, userId);

      expect(result.valid).toBe(true);
      expect(result.companyName).toBe('Test Company');
      // Should not throw error when database update fails
    });
  });
});
