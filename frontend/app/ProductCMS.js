import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, RotateCcw, Save, X } from 'lucide-react';
import Link from "next/link";

const ProductsCMS = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentUser] = useState('admin'); 
  const [filter, setFilter] = useState('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  
  const [formData, setFormData] = useState({
    product_name: '',
    product_desc: '',
    status: 'Draft'
  });

  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (includeDeleted) params.append('includeDeleted', 'true');
      
      const response = await fetch(`${API_BASE}/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter, includeDeleted]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        [editingProduct ? 'updated_by' : 'created_by']: currentUser
      };

      const url = editingProduct 
        ? `${API_BASE}/products/${editingProduct.product_id}`
        : `${API_BASE}/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProducts();
        handleCloseForm();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save product');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updated_by: currentUser }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProducts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete product');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleRestore = async (productId) => {
    if (!confirm('Are you sure you want to restore this product?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${productId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updated_by: currentUser }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProducts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to restore product');
      console.error('Restore error:', err);
    } finally {
      setLoading(false);
    }
  };

 
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      product_desc: product.product_desc,
      status: product.status
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      product_name: '',
      product_desc: '',
      status: 'Draft'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      Draft: 'bg-yellow-100 text-yellow-800',
      Published: 'bg-green-100 text-green-800',
      Archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
              <p className="text-gray-600 mt-1">Manage your product catalog with full lifecycle support</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
  <Plus className="w-4 h-4" />
  <Link href="/products/add">Add Product</Link>
</button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="rounded"
              />
              Include Deleted
            </label>
            <div className="text-sm text-gray-500">
              Total: {filteredProducts.length} products
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.product_desc}
                      onChange={(e) => setFormData({...formData, product_desc: e.target.value})}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Product'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.product_id} className={product.is_deleted ? 'opacity-50 bg-red-50' : ''}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                            {product.is_deleted && <span className="ml-2 text-red-500 text-xs">(Deleted)</span>}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                            {product.product_desc || 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{new Date(product.created_at).toLocaleDateString()}</div>
                        <div className="text-xs">by {product.created_by}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{new Date(product.updated_at).toLocaleDateString()}</div>
                        {product.updated_by && <div className="text-xs">by {product.updated_by}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {product.is_deleted ? (
                            <button
                              onClick={() => handleRestore(product.product_id)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Restore Product"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.product_id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Products Preview */}
        <LiveProductsPreview />
      </div>
    </div>
  );
};


const LiveProductsPreview = () => {
  const [liveProducts, setLiveProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;


  const fetchLiveProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/live`);
      const data = await response.json();
      
      if (data.success) {
        setLiveProducts(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch live products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
    
    const interval = setInterval(fetchLiveProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Live Website Preview</h2>
            <span className="text-sm text-gray-500">({liveProducts.length} published products)</span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            This shows what visitors see on your website (Published products only)
          </p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading live products...</div>
          ) : liveProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No published products available on live site
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveProducts.map((product) => (
                <div key={product.product_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{product.product_name}</h3>
                  <p className="text-gray-600 text-sm">{product.product_desc || 'No description available'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Live
                    </span>
                    <span className="text-xs text-gray-500">ID: {product.product_id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsCMS;