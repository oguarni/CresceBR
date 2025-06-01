import React from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { categories } from '../../utils/constants';

const AdminPanel = ({ 
  showAdmin, 
  setShowAdmin, 
  user, 
  productForm, 
  setProductForm, 
  editingProduct, 
  setEditingProduct, 
  handleProductSubmit, 
  products, 
  editProduct, 
  deleteProduct, 
  loading 
}) => {
  if (!showAdmin || user?.role !== 'admin') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleProductSubmit();
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setProductForm({ 
      name: '', 
      category: 'EPI', 
      price: '', 
      unit: 'unidade', 
      description: '', 
      image: '📦' 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Painel Administrativo</h2>
            <button onClick={() => setShowAdmin(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Product Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-4">
              {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  className="px-4 py-2 border rounded-lg"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
                <select
                  className="px-4 py-2 border rounded-lg"
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  required
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço"
                  className="px-4 py-2 border rounded-lg"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Unidade"
                  className="px-4 py-2 border rounded-lg"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Emoji do produto"
                  className="px-4 py-2 border rounded-lg"
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  className="px-4 py-2 border rounded-lg"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (editingProduct ? 'Atualizar' : 'Adicionar')}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Products List */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Produto</th>
                  <th className="border p-2 text-left">Categoria</th>
                  <th className="border p-2 text-left">Preço</th>
                  <th className="border p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td className="border p-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{product.image}</span>
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border p-2">{product.category}</td>
                    <td className="border p-2">R$ {parseFloat(product.price).toFixed(2)}</td>
                    <td className="border p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;