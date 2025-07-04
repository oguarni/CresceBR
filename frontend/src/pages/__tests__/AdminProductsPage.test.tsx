import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminProductsPage from '../AdminProductsPage';
import { productsService } from '../../services/productsService';
import toast from 'react-hot-toast';

// Mock the services
vi.mock('../../services/productsService', () => ({
  productsService: {
    getAllProducts: vi.fn(),
    getCategories: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
});

const mockProducts = [
  {
    id: 1,
    name: 'Industrial Pump',
    description: 'High-performance industrial water pump',
    price: 1500.0,
    imageUrl: 'https://example.com/pump.jpg',
    category: 'Industrial Equipment',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'Safety Helmet',
    description: 'Industrial safety helmet with adjustable strap',
    price: 25.0,
    imageUrl: 'https://example.com/helmet.jpg',
    category: 'Safety Equipment',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCategories = ['Industrial Equipment', 'Safety Equipment', 'Construction Materials'];

const renderAdminProductsPage = () => {
  return render(
    <BrowserRouter>
      <AdminProductsPage />
    </BrowserRouter>
  );
};

describe('AdminProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(productsService.getAllProducts).mockResolvedValue({
      products: mockProducts,
      pagination: {
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      },
    });

    vi.mocked(productsService.getCategories).mockResolvedValue(mockCategories);
  });

  describe('Product List Display', () => {
    it('should render the page title and new product button', async () => {
      renderAdminProductsPage();

      expect(screen.getByText('Gerenciar Produtos')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /novo produto/i })).toBeInTheDocument();
      expect(
        screen.getByText('Gerencie o catálogo de produtos do marketplace')
      ).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      renderAdminProductsPage();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render product list correctly', async () => {
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
        expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
      });

      // Check product details
      expect(screen.getByText('High-performance industrial water pump')).toBeInTheDocument();
      expect(
        screen.getByText('Industrial safety helmet with adjustable strap')
      ).toBeInTheDocument();

      // Check categories
      expect(screen.getByText('Industrial Equipment')).toBeInTheDocument();
      expect(screen.getByText('Safety Equipment')).toBeInTheDocument();

      // Check formatted prices
      expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 25,00')).toBeInTheDocument();
    });

    it('should display empty state when no products exist', async () => {
      vi.mocked(productsService.getAllProducts).mockResolvedValue({
        products: [],
        pagination: { total: 0, page: 1, limit: 100, totalPages: 0 },
      });

      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument();
      });
    });

    it('should display error state when loading fails', async () => {
      vi.mocked(productsService.getAllProducts).mockRejectedValue(
        new Error('Failed to load products')
      );

      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Failed to load products')).toBeInTheDocument();
      });
    });
  });

  describe('Product Creation', () => {
    it('should open create product dialog when clicking new product button', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      expect(screen.getByText('Novo Produto')).toBeInTheDocument();
      expect(screen.getByLabelText(/nome do produto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preço/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url da imagem/i)).toBeInTheDocument();
    });

    it('should create product successfully', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open dialog
      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      // Fill form
      await user.type(screen.getByLabelText(/nome do produto/i), 'New Test Product');
      await user.type(screen.getByLabelText(/descrição/i), 'Test product description');
      await user.type(screen.getByLabelText(/preço/i), '100.50');
      await user.type(screen.getByLabelText(/url da imagem/i), 'https://example.com/test.jpg');

      // Select category
      await user.click(screen.getByLabelText(/categoria/i));
      await user.click(screen.getByText('Industrial Equipment'));

      // Submit form
      vi.mocked(productsService.createProduct).mockResolvedValue({
        id: 3,
        name: 'New Test Product',
        description: 'Test product description',
        price: 100.5,
        imageUrl: 'https://example.com/test.jpg',
        category: 'Industrial Equipment',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(productsService.createProduct).toHaveBeenCalledWith({
          name: 'New Test Product',
          description: 'Test product description',
          price: 100.5,
          imageUrl: 'https://example.com/test.jpg',
          category: 'Industrial Equipment',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Produto criado com sucesso!');
    });

    it('should show validation error for incomplete form', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open dialog
      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      // Try to submit without filling required fields
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('Todos os campos são obrigatórios');
    });

    it('should show validation error for invalid price', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open dialog
      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      // Fill form with invalid price
      await user.type(screen.getByLabelText(/nome do produto/i), 'Test Product');
      await user.type(screen.getByLabelText(/descrição/i), 'Test description');
      await user.type(screen.getByLabelText(/preço/i), '-10');
      await user.type(screen.getByLabelText(/url da imagem/i), 'https://example.com/test.jpg');

      // Select category
      await user.click(screen.getByLabelText(/categoria/i));
      await user.click(screen.getByText('Industrial Equipment'));

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('Preço deve ser um número válido maior que zero');
    });
  });

  describe('Product Editing', () => {
    it('should open edit product dialog when clicking edit button', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Editar');
      await user.click(editButtons[0]);

      expect(screen.getByText('Editar Produto')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Industrial Pump')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('High-performance industrial water pump')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
    });

    it('should update product successfully', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open edit dialog
      const editButtons = screen.getAllByTitle('Editar');
      await user.click(editButtons[0]);

      // Update product name
      const nameField = screen.getByDisplayValue('Industrial Pump');
      await user.clear(nameField);
      await user.type(nameField, 'Updated Industrial Pump');

      // Submit form
      vi.mocked(productsService.updateProduct).mockResolvedValue({
        ...mockProducts[0],
        name: 'Updated Industrial Pump',
      });

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(productsService.updateProduct).toHaveBeenCalledWith(1, {
          name: 'Updated Industrial Pump',
          description: 'High-performance industrial water pump',
          price: 1500,
          imageUrl: 'https://example.com/pump.jpg',
          category: 'Industrial Equipment',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Produto atualizado com sucesso!');
    });
  });

  describe('Product Deletion', () => {
    it('should delete product when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(true);
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Excluir');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Tem certeza que deseja excluir "Industrial Pump"?'
      );

      await waitFor(() => {
        expect(productsService.deleteProduct).toHaveBeenCalledWith(1);
      });

      expect(toast.success).toHaveBeenCalledWith('Produto excluído com sucesso!');
    });

    it('should not delete product when cancelled', async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(false);
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Excluir');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Tem certeza que deseja excluir "Industrial Pump"?'
      );
      expect(productsService.deleteProduct).not.toHaveBeenCalled();
    });

    it('should handle delete error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(true);
      vi.mocked(productsService.deleteProduct).mockRejectedValue(new Error('Delete failed'));
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Excluir');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Delete failed');
      });
    });
  });

  describe('Dialog Management', () => {
    it('should close dialog when clicking cancel', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open dialog
      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      expect(screen.getByText('Novo Produto')).toBeInTheDocument();

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(screen.queryByText('Novo Produto')).not.toBeInTheDocument();
    });

    it('should reset form when closing dialog', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open dialog and fill some fields
      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      await user.type(screen.getByLabelText(/nome do produto/i), 'Test Product');

      // Close and reopen dialog
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      await user.click(newProductButton);

      // Check that fields are empty
      expect(screen.getByLabelText(/nome do produto/i)).toHaveValue('');
    });

    it('should show image preview when valid URL is entered', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open dialog
      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      // Enter image URL
      const imageUrlField = screen.getByLabelText(/url da imagem/i);
      await user.type(imageUrlField, 'https://example.com/test.jpg');

      // Check if preview image appears
      await waitFor(() => {
        const previewImage = screen.getByAltText('Preview');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', 'https://example.com/test.jpg');
      });
    });

    it('should handle new category creation', async () => {
      const user = userEvent.setup();
      renderAdminProductsPage();

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump')).toBeInTheDocument();
      });

      // Open dialog
      const newProductButton = screen.getByRole('button', { name: /novo produto/i });
      await user.click(newProductButton);

      // Select "Nova Categoria"
      await user.click(screen.getByLabelText(/categoria/i));
      await user.click(screen.getByText('+ Nova Categoria'));

      // Check if new category field appears
      expect(screen.getByLabelText(/nome da nova categoria/i)).toBeInTheDocument();

      // Enter new category name
      await user.type(screen.getByLabelText(/nome da nova categoria/i), 'Custom Category');

      // The form data should now have the custom category
      expect(screen.getByLabelText(/nome da nova categoria/i)).toHaveValue('Custom Category');
    });
  });
});
